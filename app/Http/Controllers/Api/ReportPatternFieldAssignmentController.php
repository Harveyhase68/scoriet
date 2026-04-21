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
 * instead of template files filtered by form_window_type.
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
        if (!$project || !$project->visibleTo($user)->exists()) {
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

        $userId = auth()->id();

        $rows = array_map(function ($assignment) use ($userId) {
            return [
                'report_pattern_id' => $assignment['report_pattern_id'],
                'schema_field_id' => $assignment['schema_field_id'],
                'visibility_state' => $assignment['visibility_state'],
                'sort_order' => $assignment['sort_order'] ?? null,
                'created_by' => $userId,
                'updated_at' => now(),
                'created_at' => now(),
            ];
        }, $validated['assignments']);

        ReportPatternFieldAssignment::upsert(
            $rows,
            ['report_pattern_id', 'schema_field_id'],
            ['visibility_state', 'sort_order', 'created_by', 'updated_at']
        );

        $this->invalidateCacheForAssignments($validated['assignments']);

        return response()->json([
            'message' => 'Assignments updated successfully.',
            'count' => count($rows),
        ]);
    }

    /**
     * Delete a single assignment (reset to default).
     *
     * DELETE /api/report-pattern-field-assignments/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $assignment = ReportPatternFieldAssignment::findOrFail($id);
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
