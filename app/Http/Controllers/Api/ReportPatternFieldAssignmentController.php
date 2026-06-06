<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ReportPattern;
use App\Models\ReportPatternFieldAssignment;
use App\Models\SchemaTable;
use App\Services\TemplateCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Per-report-pattern field assignment controller.
 *
 * Mirrors TemplateFileFieldAssignmentController but matrix columns are the
 * ReportPatterns linked to the project (via project_report_patterns pivot)
 * instead of the per-table template files.
 */
class ReportPatternFieldAssignmentController extends Controller
{
    /**
     * Get the assignment matrix for a project + table combination.
     * Returns report patterns linked to the project, fields, and existing assignments.
     *
     * GET /api/report-pattern-field-assignments/matrix?project_id=X&table_id=Y
     */
    public function getMatrix(Request $request): JsonResponse
    {
        $request->validate([
            'project_id' => 'required|integer',
            'table_id' => 'required|integer',
        ]);

        $user = auth()->user();
        $projectId = $request->get('project_id');
        $tableId = $request->get('table_id');

        $project = Project::find($projectId);
        if (!$project || !$project->isVisibleTo($user)) {
            return response()->json(['error' => 'Project not found or access denied'], 404);
        }

        // Get table with fields — skip fields with generation_mode='excluded',
        // those are globally removed from generation and shouldn't appear in the matrix.
        $table = SchemaTable::with(['fields' => function ($q) {
            $q->where(function ($qq) {
                $qq->whereNull('generation_mode')->orWhere('generation_mode', '!=', 'excluded');
            })->orderBy('field_order');
        }])->find($tableId);

        if (!$table) {
            return response()->json(['error' => 'Table not found'], 404);
        }

        // Report patterns linked to this project via project_report_patterns.
        $reportPatterns = DB::table('project_report_patterns as prp')
            ->join('report_patterns as rp', 'rp.id', '=', 'prp.report_pattern_id')
            ->where('prp.project_id', $projectId)
            ->where('prp.is_active', true)
            ->where('rp.is_active', true)
            ->select([
                'rp.id',
                'rp.name',
                'rp.description',
            ])
            ->orderBy('rp.name')
            ->get();

        $fieldIds = $table->fields->pluck('id')->toArray();
        $patternIds = $reportPatterns->pluck('id')->toArray();

        $existingAssignments = ReportPatternFieldAssignment::whereIn('report_pattern_id', $patternIds)
            ->whereIn('schema_field_id', $fieldIds)
            ->get();

        // Build assignments map: "patternId_fieldId" => { visibility_state, sort_order }
        $assignmentsMap = [];
        foreach ($existingAssignments as $assignment) {
            $key = $assignment->report_pattern_id . '_' . $assignment->schema_field_id;
            $assignmentsMap[$key] = [
                'id' => $assignment->id,
                'visibility_state' => $assignment->visibility_state,
                'sort_order' => $assignment->sort_order,
            ];
        }

        return response()->json([
            'table' => [
                'id' => $table->id,
                'table_name' => $table->table_name,
                'comment' => $table->comment,
                'filekeyname' => $table->filekeyname ?: ($table->primarykeyfield ?: null),
            ],
            'report_patterns' => $reportPatterns->map(function ($rp) {
                return [
                    'id' => $rp->id,
                    'name' => $rp->name,
                    'description' => $rp->description,
                ];
            })->values(),
            'fields' => $table->fields->map(function ($field) {
                return [
                    'id' => $field->id,
                    'field_name' => $field->field_name,
                    'field_type' => strtolower($field->field_type),
                    'field_order' => $field->field_order,
                    'control_type' => $field->control_type ?? 'TEXT',
                    'is_primary_key' => $field->is_primary_key,
                    'is_nullable' => $field->is_nullable,
                    'schema_display_state'   => $field->display_state ?? 'enabled',
                    'schema_generation_mode' => $field->generation_mode ?? 'full',
                ];
            })->values(),
            'assignments' => $assignmentsMap,
        ]);
    }

    /**
     * Bulk update assignments.
     *
     * POST /api/report-pattern-field-assignments/bulk-update
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'assignments' => 'required|array',
            'assignments.*.report_pattern_id' => 'required|integer|exists:report_patterns,id',
            'assignments.*.schema_field_id' => 'required|integer|exists:schema_fields,id',
            'assignments.*.visibility_state' => 'required|string|in:visible,grayed,inactive,invisible,not_available',
            'assignments.*.sort_order' => 'nullable|integer',
        ]);

        // BOLA guard: validator only verifies report_pattern_id EXISTS, not
        // that the user owns it. Without this loop, any user could mass-
        // overwrite another user's report-pattern assignment matrix.
        $userId   = auth()->id();
        $patternIds = collect($validated['assignments'])->pluck('report_pattern_id')->unique();
        $patterns = ReportPattern::whereIn('id', $patternIds)->get()->keyBy('id');
        foreach ($patternIds as $pid) {
            $owner = (string)($patterns[$pid]->creator_user_id ?? '');
            if ($owner === '' || $owner !== (string)$userId) {
                return response()->json([
                    'success' => false,
                    'message' => "You do not have permission to edit report_pattern_id={$pid}.",
                ], 403);
            }
        }

        // Split: "visible + no sort_order" is the implicit default in the
        // matrix model — represented in the DB by the ABSENCE of a row.
        // So a toggle back to Visible means: delete any existing override.
        // Without this, the frontend's reset never reached storage (the
        // payload silently dropped default-state entries on its way out).
        $toDelete = [];
        $rows = [];
        foreach ($validated['assignments'] as $assignment) {
            $isDefault = $assignment['visibility_state'] === 'visible'
                && empty($assignment['sort_order']);

            if ($isDefault) {
                $toDelete[] = [
                    'report_pattern_id' => $assignment['report_pattern_id'],
                    'schema_field_id'   => $assignment['schema_field_id'],
                ];
            } else {
                $rows[] = [
                    'report_pattern_id' => $assignment['report_pattern_id'],
                    'schema_field_id'   => $assignment['schema_field_id'],
                    'visibility_state'  => $assignment['visibility_state'],
                    'sort_order'        => $assignment['sort_order'] ?? null,
                    'created_by'        => $userId,
                    'updated_at'        => now(),
                    'created_at'        => now(),
                ];
            }
        }

        // Delete the default-state entries, grouped by pattern to batch.
        $byPattern = [];
        foreach ($toDelete as $d) {
            $byPattern[$d['report_pattern_id']][] = $d['schema_field_id'];
        }
        foreach ($byPattern as $patternId => $fieldIds) {
            ReportPatternFieldAssignment::where('report_pattern_id', $patternId)
                ->whereIn('schema_field_id', $fieldIds)
                ->delete();
        }

        if (!empty($rows)) {
            ReportPatternFieldAssignment::upsert(
                $rows,
                ['report_pattern_id', 'schema_field_id'],
                ['visibility_state', 'sort_order', 'created_by', 'updated_at']
            );
        }

        $this->invalidateCacheForAssignments($validated['assignments']);

        return response()->json([
            'message'      => 'Assignments updated successfully.',
            'count'        => count($rows),
            'reset_count'  => count($toDelete),
        ]);
    }

    /**
     * Delete a single assignment (reset to default).
     *
     * DELETE /api/report-pattern-field-assignments/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $assignment = ReportPatternFieldAssignment::with('reportPattern')->find($id);
        if (!$assignment) {
            return response()->json(['message' => 'Assignment not found'], 404);
        }

        // BOLA guard: only the report pattern's creator may delete its
        // assignments. Without this, any authenticated user could delete
        // any assignment row by passing its id.
        $pattern = $assignment->reportPattern;
        if (!$pattern || (string)$pattern->creator_user_id !== (string)auth()->id()) {
            return response()->json(['message' => 'You do not have permission to delete this assignment.'], 403);
        }

        $assignment->delete();

        return response()->json(['message' => 'Assignment deleted successfully.']);
    }

    /**
     * Reset all assignments for a specific table + report pattern combination.
     *
     * POST /api/report-pattern-field-assignments/reset-table
     */
    public function resetTable(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'report_pattern_id' => 'required|integer|exists:report_patterns,id',
            'table_id' => 'required|integer|exists:schema_tables,id',
        ]);

        // BOLA guard: only the report pattern's creator may mass-reset its
        // assignments. Without this, any authenticated user could wipe
        // another user's report-pattern matrix for any table.
        $pattern = ReportPattern::find($validated['report_pattern_id']);
        if (!$pattern || (string)$pattern->creator_user_id !== (string)auth()->id()) {
            return response()->json(['error' => 'You do not have permission to reset assignments for this report pattern.'], 403);
        }

        $table = SchemaTable::with('fields')->find($validated['table_id']);
        if (!$table) {
            return response()->json(['error' => 'Table not found'], 404);
        }

        $fieldIds = $table->fields->pluck('id')->toArray();

        $deleted = ReportPatternFieldAssignment::where('report_pattern_id', $validated['report_pattern_id'])
            ->whereIn('schema_field_id', $fieldIds)
            ->delete();

        $this->invalidateCacheForReportPattern($validated['report_pattern_id']);

        return response()->json([
            'message' => 'Assignments reset successfully.',
            'deleted_count' => $deleted,
        ]);
    }

    /**
     * Invalidate code-generation cache for every template that lives in a
     * project using one of the affected report patterns. We don't know which
     * templates specifically depend on the report pattern at this layer, so
     * we flush broadly — patterns tend to be small in number and edits rare.
     */
    private function invalidateCacheForAssignments(array $assignments): void
    {
        try {
            $cacheService = app(TemplateCacheService::class);
            $patternIds = collect($assignments)->pluck('report_pattern_id')->unique();
            foreach ($patternIds as $patternId) {
                $this->flushCacheForReportPatternInternal($cacheService, (int) $patternId);
            }
        } catch (\Exception $e) {
            Log::error('Failed to invalidate cache after report-pattern field assignment change: ' . $e->getMessage());
        }
    }

    private function invalidateCacheForReportPattern(int $reportPatternId): void
    {
        try {
            $cacheService = app(TemplateCacheService::class);
            $this->flushCacheForReportPatternInternal($cacheService, $reportPatternId);
        } catch (\Exception $e) {
            Log::error('Failed to invalidate cache after report-pattern reset: ' . $e->getMessage());
        }
    }

    /**
     * Find projects using this report pattern and flush every active template
     * used by any of those projects.
     */
    private function flushCacheForReportPatternInternal(TemplateCacheService $cacheService, int $reportPatternId): void
    {
        $projectIds = DB::table('project_report_patterns')
            ->where('report_pattern_id', $reportPatternId)
            ->pluck('project_id');

        if ($projectIds->isEmpty()) {
            return;
        }

        $templateIds = DB::table('project_template_usage')
            ->whereIn('project_id', $projectIds)
            ->where('is_active', true)
            ->pluck('template_id')
            ->unique();

        foreach ($templateIds as $templateId) {
            $cacheService->invalidateTemplate($templateId);
            $cacheService->invalidateGtreeForTemplate($templateId);
        }
    }
}
