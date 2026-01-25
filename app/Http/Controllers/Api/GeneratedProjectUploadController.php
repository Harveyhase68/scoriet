<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PerformanceMetric;
use App\Models\Project;
use App\Models\ProjectGeneration;
use App\Models\SchemaVersion;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GeneratedProjectUploadController extends Controller
{
    /**
     * Upload a generated project ZIP for deployment
     * Stores the ZIP permanently and creates a ProjectGeneration record
     *
     * POST /api/generated-projects/upload
     */
    public function upload(Request $request): JsonResponse
    {
        $startTime = microtime(true);

        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'archive' => 'required|file|mimes:zip|max:512000', // Max 500MB
            // Optional metadata from frontend (sent as FormData - all come as strings)
            'tables' => 'nullable|array',
            'languages' => 'nullable|array',
            'template_ids' => 'nullable|array',
            'template_names' => 'nullable|array',
            'files_count' => 'nullable|numeric|min:0',
            'is_download_only' => 'nullable', // Sent as string 'true'/'false' from FormData
            // Performance tracking data from frontend
            'generation_time_ms' => 'nullable|numeric|min:0',
            'fields_count' => 'nullable|numeric|min:0',
        ]);

        $user = Auth::user();
        $projectId = (int) $request->input('project_id');
        $project = Project::find($projectId);

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        // Create permanent storage directory
        $storagePath = storage_path('app/generated-projects');
        if (!file_exists($storagePath)) {
            mkdir($storagePath, 0755, true);
        }

        // Get next generation number for this project
        $generationNumber = ProjectGeneration::getNextGenerationNumber($projectId);

        // Generate filename with project_id and generation_number
        $projectNameClean = preg_replace('/[^a-zA-Z0-9_-]/', '_', $project->name);
        $filename = sprintf(
            'project_%d_%s_gen%d_%s.zip',
            $projectId,
            $projectNameClean,
            $generationNumber,
            date('Y-m-d_His')
        );

        // Store permanently (not in public, in app storage)
        $fullPath = $storagePath . '/' . $filename;
        $request->file('archive')->move($storagePath, $filename);

        $fileSize = filesize($fullPath);

        // Get metadata from request or use defaults
        $tables = $request->input('tables', []);
        $languages = $request->input('languages', ['en']);
        $templateIds = $request->input('template_ids', []);
        $templateNames = $request->input('template_names', []);
        $filesCount = (int) $request->input('files_count', 0);

        // If files_count not provided, try to count files in ZIP
        if ($filesCount === 0) {
            $filesCount = $this->countFilesInZip($fullPath);
        }

        // Cast template_ids to integers (they come as strings from FormData)
        $templateIds = array_map('intval', $templateIds);

        // Get the current schema version for the project (via project_schemas join)
        $currentSchemaVersion = null;
        $projectSchema = \DB::table('project_schemas')
            ->where('project_id', $projectId)
            ->first();

        if ($projectSchema) {
            $currentSchemaVersion = SchemaVersion::where('schema_id', $projectSchema->schema_id)
                ->orderBy('version_number', 'desc')
                ->first();
        }

        // Create ProjectGeneration record
        $generation = ProjectGeneration::create([
            'project_id' => $projectId,
            'schema_version_id' => $currentSchemaVersion?->id,
            'user_id' => $user?->id,
            'generation_number' => $generationNumber,
            'filename' => $filename,
            'file_path' => $fullPath,
            'archive_type' => 'zip',
            'file_size' => $fileSize,
            'languages' => !empty($languages) ? $languages : null,
            'tables' => !empty($tables) ? $tables : null,
            'tables_count' => count($tables),
            'files_count' => $filesCount,
            'template_id' => $templateIds[0] ?? null,
            'template_name' => $templateNames[0] ?? null,
            'status' => 'completed',
            'notes' => $request->input('is_download_only') === 'true' ? 'Local download' : 'Deployment upload',
        ]);

        \Log::info("📦 Generation recorded", [
            'generation_id' => $generation->id,
            'generation_number' => $generationNumber,
            'project_id' => $projectId,
            'filename' => $filename,
            'file_size' => $fileSize,
        ]);

        // Track performance metrics
        $uploadTime = round((microtime(true) - $startTime) * 1000, 2);
        $generationTimeMs = (int) $request->input('generation_time_ms', 0);
        $fieldsCount = (int) $request->input('fields_count', 0);

        try {
            PerformanceMetric::create([
                'user_id' => $user?->id,
                'operation' => PerformanceMetric::OP_GENERATION,
                'operation_detail' => $project->name . ' (' . count($templateNames) . ' templates)',
                'duration_ms' => $generationTimeMs > 0 ? $generationTimeMs : (int) $uploadTime,
                'memory_peak_mb' => (int) (memory_get_peak_usage(true) / 1024 / 1024),
                'tables_count' => count($tables),
                'fields_count' => $fieldsCount,
                'from_cache' => false,
                'subscription_type' => $user?->subscription?->type ?? ($user?->isPatron() ? 'patron' : 'free'),
                'metadata' => [
                    'template_count' => count($templateNames),
                    'files_generated' => $filesCount,
                    'file_size_bytes' => $fileSize,
                    'upload_time_ms' => $uploadTime,
                    'generation_number' => $generationNumber,
                ],
                'created_at' => now(),
            ]);
            \Log::info("📊 Performance metric saved", [
                'operation' => 'generation',
                'duration_ms' => $generationTimeMs > 0 ? $generationTimeMs : (int) $uploadTime,
                'tables' => count($tables),
            ]);
        } catch (\Exception $trackingError) {
            \Log::error("❌ Performance tracking failed: " . $trackingError->getMessage());
        }

        // Build download URL (for deployment service)
        $downloadUrl = url("/api/generated-projects/download/{$filename}");

        return response()->json([
            'success' => true,
            'filename' => $filename,
            'download_url' => $downloadUrl,
            'path' => $fullPath,
            'size' => $fileSize,
            'generation_id' => $generation->id,
            'generation_number' => $generationNumber,
        ]);
    }

    /**
     * Count files in a ZIP archive
     */
    private function countFilesInZip(string $zipPath): int
    {
        $count = 0;
        $zip = new \ZipArchive();
        if ($zip->open($zipPath) === true) {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $stat = $zip->statIndex($i);
                // Don't count directories
                if (substr($stat['name'], -1) !== '/') {
                    $count++;
                }
            }
            $zip->close();
        }
        return $count;
    }

    /**
     * Download a previously uploaded generated project
     *
     * GET /api/generated-projects/download/{filename}
     */
    public function download(string $filename): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        // Check in new permanent storage location first
        $storagePath = storage_path('app/generated-projects');
        $fullPath = $storagePath . '/' . $filename;

        if (file_exists($fullPath)) {
            return response()->download($fullPath, $filename, [
                'Content-Type' => 'application/zip',
            ]);
        }

        // Fallback: check in old public storage location (for backwards compatibility)
        $oldPath = "generated_projects/{$filename}";
        if (Storage::disk('public')->exists($oldPath)) {
            $oldFullPath = Storage::disk('public')->path($oldPath);
            return response()->download($oldFullPath, $filename, [
                'Content-Type' => 'application/zip',
            ]);
        }

        abort(404, 'Archive not found');
    }
}
