<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\TemplateFile;
use App\Models\TemplateFileFieldAssignment;
use App\Models\SchemaTable;
use App\Services\TemplateCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TemplateFileFieldAssignmentController extends Controller
{
    /**
     * Get the assignment matrix for a project + table combination.
     * Returns per-table template files (file_type db_table_file[_languages]),
     * fields, and existing assignments.
     *
     * GET /api/template-file-field-assignments/matrix?project_id=X&table_id=Y
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

        // Verify project access
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

        // Get all template files linked to this project that render the fields
        // of a SINGLE table — i.e. the per-table file types. Field-level
        // visibility/sort assignments only make sense for those, so we gate on
        // file_type (the file's nature). This used to gate on the per-file
        // form_window_type marker, which left the matrix empty whenever it
        // wasn't set; that marker has since been removed entirely.
        $perTableFileTypes = ['db_table_file', 'db_table_file_languages'];
        $templateFiles = DB::table('project_template_usage as ptu')
            ->join('template_files as tf', 'tf.template_id', '=', 'ptu.template_id')
            ->join('templates as t', 't.id', '=', 'ptu.template_id')
            ->where('ptu.project_id', $projectId)
            ->where('ptu.is_active', true)
            ->whereIn('tf.file_type', $perTableFileTypes)
            ->where('tf.is_include_only', false)
            ->select([
                'tf.id',
                'tf.file_name',
                'tf.file_path',
                'tf.file_type',
                'tf.file_order',
                't.name as template_name',
                't.id as template_id',
            ])
            ->orderBy('t.name')
            ->orderBy('tf.file_order')
            ->get();

        // Get all field IDs for this table
        $fieldIds = $table->fields->pluck('id')->toArray();
        $templateFileIds = $templateFiles->pluck('id')->toArray();

        // Get existing assignments
        $existingAssignments = TemplateFileFieldAssignment::whereIn('template_file_id', $templateFileIds)
            ->whereIn('schema_field_id', $fieldIds)
            ->get();

        // Build assignments map: "fileId_fieldId" => { visibility_state, sort_order }
        $assignmentsMap = [];
        foreach ($existingAssignments as $assignment) {
            $key = $assignment->template_file_id . '_' . $assignment->schema_field_id;
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
            'template_files' => $templateFiles->map(function ($tf) {
                return [
                    'id' => $tf->id,
                    'file_name' => $tf->file_name,
                    'file_path' => $tf->file_path,
                    'file_type' => $tf->file_type,
                    'template_name' => $tf->template_name,
                    'template_id' => $tf->template_id,
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
                    // Global schema states — shown as badges in the matrix so the user
                    // knows why a field's baseline visibility might differ.
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
     * POST /api/template-file-field-assignments/bulk-update
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'assignments' => 'required|array',
            'assignments.*.template_file_id' => 'required|integer|exists:template_files,id',
            'assignments.*.schema_field_id' => 'required|integer|exists:schema_fields,id',
            'assignments.*.visibility_state' => 'required|string|in:visible,grayed,inactive,invisible,not_available',
            'assignments.*.sort_order' => 'nullable|integer',
        ]);

        // BOLA guard: the validator only checks that the template_file_id
        // EXISTS, not that it belongs to a template the user may edit.
        // Without this loop, any authenticated user could mass-overwrite
        // the field-assignment matrix of every other user's templates.
        // We resolve each template_file once (small lookup), then check
        // canBeEditedBy on the parent template.
        $user = auth()->user();
        $fileIds = collect($validated['assignments'])->pluck('template_file_id')->unique();
        $files = TemplateFile::with('template')->whereIn('id', $fileIds)->get()->keyBy('id');
        foreach ($fileIds as $fid) {
            $tpl = $files[$fid]?->template ?? null;
            if (!$tpl || !$tpl->canBeEditedBy($user)) {
                return response()->json([
                    'success' => false,
                    'message' => "You do not have permission to edit template_file_id={$fid}.",
                ], 403);
            }
        }

        $userId = $user->id;

        // Split: anything that's back to the default state ("visible" without
        // a sort_order override) becomes a DELETE — that's how the matrix
        // model represents "no override". Earlier, the frontend silently
        // dropped these from the payload, so toggling back to Visible never
        // reached the DB. Now we let the toggle through and undo it server-side.
        $toDelete = [];
        $rows = [];
        foreach ($validated['assignments'] as $assignment) {
            $isDefault = $assignment['visibility_state'] === 'visible'
                && empty($assignment['sort_order']);

            if ($isDefault) {
                $toDelete[] = [
                    'template_file_id' => $assignment['template_file_id'],
                    'schema_field_id'  => $assignment['schema_field_id'],
                ];
            } else {
                $rows[] = [
                    'template_file_id' => $assignment['template_file_id'],
                    'schema_field_id'  => $assignment['schema_field_id'],
                    'visibility_state' => $assignment['visibility_state'],
                    'sort_order'       => $assignment['sort_order'] ?? null,
                    'created_by'       => $userId,
                    'updated_at'       => now(),
                    'created_at'       => now(),
                ];
            }
        }

        // Delete the "back to default" entries in one query per pair.
        // (No composite ::whereIn for tuples in MySQL, so we group by file
        // and do one IN per template_file_id.)
        $byFile = [];
        foreach ($toDelete as $d) {
            $byFile[$d['template_file_id']][] = $d['schema_field_id'];
        }
        foreach ($byFile as $fileId => $fieldIds) {
            TemplateFileFieldAssignment::where('template_file_id', $fileId)
                ->whereIn('schema_field_id', $fieldIds)
                ->delete();
        }

        // Upsert the rest (Eloquent events don't fire with upsert, so we
        // invalidate cache manually below).
        if (!empty($rows)) {
            TemplateFileFieldAssignment::upsert(
                $rows,
                ['template_file_id', 'schema_field_id'],
                ['visibility_state', 'sort_order', 'created_by', 'updated_at']
            );
        }

        // Manual cache invalidation since upsert/delete bypass Eloquent events.
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
     * DELETE /api/template-file-field-assignments/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $assignment = TemplateFileFieldAssignment::with('templateFile.template')->find($id);
        if (!$assignment) {
            return response()->json(['message' => 'Assignment not found'], 404);
        }

        // BOLA guard: the assignment id alone tells nothing about ownership.
        // We resolve to the parent template and check edit permission.
        $tpl = $assignment->templateFile?->template;
        if (!$tpl || !$tpl->canBeEditedBy(auth()->user())) {
            return response()->json(['message' => 'You do not have permission to delete this assignment.'], 403);
        }

        // Cache invalidation will be handled by the observer
        $assignment->delete();

        return response()->json(['message' => 'Assignment deleted successfully.']);
    }

    /**
     * Reset all assignments for a specific table + template file combination.
     *
     * POST /api/template-file-field-assignments/reset-table
     */
    public function resetTable(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_file_id' => 'required|integer|exists:template_files,id',
            'table_id' => 'required|integer|exists:schema_tables,id',
        ]);

        // BOLA guard: mass-deleting assignments for a template_file requires
        // edit permission on its parent template.
        $file = TemplateFile::with('template')->find($validated['template_file_id']);
        if (!$file || !$file->template || !$file->template->canBeEditedBy(auth()->user())) {
            return response()->json(['error' => 'You do not have permission to reset assignments for this template file.'], 403);
        }

        $table = SchemaTable::with('fields')->find($validated['table_id']);
        if (!$table) {
            return response()->json(['error' => 'Table not found'], 404);
        }

        $fieldIds = $table->fields->pluck('id')->toArray();

        $deleted = TemplateFileFieldAssignment::where('template_file_id', $validated['template_file_id'])
            ->whereIn('schema_field_id', $fieldIds)
            ->delete();

        // Manual cache invalidation
        $this->invalidateCacheForTemplateFile($validated['template_file_id']);

        return response()->json([
            'message' => 'Assignments reset successfully.',
            'deleted_count' => $deleted,
        ]);
    }

    /**
     * Invalidate cache for affected template files after bulk assignment changes.
     */
    private function invalidateCacheForAssignments(array $assignments): void
    {
        try {
            $cacheService = app(TemplateCacheService::class);
            $templateFileIds = collect($assignments)->pluck('template_file_id')->unique();

            foreach ($templateFileIds as $fileId) {
                $file = TemplateFile::find($fileId);
                if ($file) {
                    $cacheService->invalidateTemplate($file->template_id);
                    $cacheService->invalidateGtreeForTemplate($file->template_id);
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to invalidate cache after field assignment change: ' . $e->getMessage());
        }
    }

    /**
     * Invalidate cache for a single template file.
     */
    private function invalidateCacheForTemplateFile(int $templateFileId): void
    {
        try {
            $cacheService = app(TemplateCacheService::class);
            $file = TemplateFile::find($templateFileId);
            if ($file) {
                $cacheService->invalidateTemplate($file->template_id);
                $cacheService->invalidateGtreeForTemplate($file->template_id);
            }
        } catch (\Exception $e) {
            Log::error('Failed to invalidate cache after field assignment reset: ' . $e->getMessage());
        }
    }
}
