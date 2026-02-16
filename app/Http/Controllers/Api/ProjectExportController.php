<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\ProjectExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ProjectExportController extends Controller
{
    /**
     * Export a project to an archive file
     *
     * GET /api/projects/{project}/export
     * Query params:
     *   - format: 'zip' (default), 'tar.gz', or 'tar.xz'
     */
    public function export(Request $request, int $projectId): BinaryFileResponse|JsonResponse
    {
        $user = Auth::user();

        // Find project and check access
        $project = Project::find($projectId);

        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        // Only owner or admin/system can export
        if ((int) $project->owner_id !== (int) $user->id &&
            !in_array($user->user_type, ['admin', 'system'])) {
            return response()->json(['message' => 'Only the project owner can export'], 403);
        }

        // Validate format
        $format = $request->query('format', 'zip');
        if (!in_array($format, ['zip', 'tar.gz', 'tar.xz'])) {
            return response()->json(['message' => 'Invalid format. Use: zip, tar.gz, or tar.xz'], 400);
        }

        try {
            $exportService = new ProjectExportService();
            $archivePath = $exportService->export($project, $format);

            // Get filename for download
            $filename = basename($archivePath);

            // Return file for download
            return response()->download($archivePath, $filename, [
                'Content-Type' => $this->getMimeType($format),
            ])->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Export failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get export preview - shows what will be exported
     *
     * GET /api/projects/{project}/export/preview
     */
    public function preview(int $projectId): JsonResponse
    {
        $user = Auth::user();

        $project = Project::find($projectId);

        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        // Only owner or admin/system can see export preview
        if ((int) $project->owner_id !== (int) $user->id &&
            !in_array($user->user_type, ['admin', 'system'])) {
            return response()->json(['message' => 'Only the project owner can export'], 403);
        }

        // Collect statistics about what will be exported
        $preview = [
            'project' => [
                'name' => $project->name,
                'description' => $project->description,
            ],
            'counts' => [
                'attachments' => $project->attachments()->count(),
                'schemas' => $project->floatingSchemas()->count(),
                'templates' => $project->templateUsages()->count(),
                'code_adjustments' => $project->codeAdjustments()->count(),
                'form_sets' => \App\Models\ProjectFormSet::where('project_id', $project->id)->count(),
            ],
            'schema_details' => [],
            'template_details' => [],
            'attachment_size' => 0,
        ];

        // Get schema details
        $schemas = $project->floatingSchemas()->withPivot(['association_type', 'alias'])->get();
        foreach ($schemas as $schema) {
            $versionCount = $schema->versions()->count();
            $tableCount = 0;
            $latestVersion = $schema->versions()->orderBy('version_number', 'desc')->first();
            if ($latestVersion) {
                $tableCount = $latestVersion->tables()->count();
            }

            $preview['schema_details'][] = [
                'name' => $schema->name,
                'association_type' => $schema->pivot->association_type,
                'version_count' => $versionCount,
                'table_count' => $tableCount,
            ];
        }

        // Get template details
        $templateUsages = $project->templateUsages()->with('template')->get();
        foreach ($templateUsages as $usage) {
            if ($usage->template) {
                $preview['template_details'][] = [
                    'name' => $usage->template->name,
                    'usage_type' => $usage->usage_type,
                    'file_count' => $usage->template->files()->count(),
                ];
            }
        }

        // Calculate total attachment size
        $attachments = $project->attachments()->get();
        foreach ($attachments as $attachment) {
            $preview['attachment_size'] += $attachment->size ?? 0;
        }

        // Format size
        $preview['attachment_size_formatted'] = $this->formatBytes($preview['attachment_size']);

        return response()->json($preview);
    }

    /**
     * Get MIME type for archive format
     */
    protected function getMimeType(string $format): string
    {
        return match ($format) {
            'tar.gz' => 'application/gzip',
            'tar.xz' => 'application/x-xz',
            default => 'application/zip',
        };
    }

    /**
     * Format bytes to human readable
     */
    protected function formatBytes(int $bytes): string
    {
        if ($bytes === 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $i = floor(log($bytes, 1024));

        return round($bytes / pow(1024, $i), 2) . ' ' . $units[$i];
    }
}
