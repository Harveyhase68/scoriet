<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProjectImportService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProjectImportController extends Controller
{
    protected ProjectImportService $importService;

    public function __construct(ProjectImportService $importService)
    {
        $this->importService = $importService;
    }

    /**
     * Analyze an uploaded ZIP file for import
     * Returns conflict information for user to resolve
     */
    public function analyze(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:zip|max:102400', // 100MB max
        ]);

        $user = Auth::user();

        try {
            // Store uploaded file temporarily
            $file = $request->file('file');
            $tempPath = $file->storeAs('temp/imports', Str::uuid() . '.zip', 'local');
            $fullPath = Storage::disk('local')->path($tempPath);

            // Analyze the ZIP file
            $analysis = $this->importService->analyze($fullPath, $user);

            // Store the temp path for later use
            $analysis['zip_path'] = $tempPath;

            return response()->json([
                'success' => true,
                'analysis' => $analysis,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Execute the import with user-provided options
     */
    public function execute(Request $request): JsonResponse
    {
        $request->validate([
            'zip_path' => 'required|string',
            'options' => 'required|array',
            'options.project' => 'required|array',
            'options.project.action' => 'required|in:create,merge',
        ]);

        $user = Auth::user();

        try {
            $zipPath = $request->input('zip_path');
            $fullPath = Storage::disk('local')->path($zipPath);

            if (!file_exists($fullPath)) {
                return response()->json([
                    'success' => false,
                    'error' => 'ZIP file not found. Please upload again.',
                ], 400);
            }

            $options = $request->input('options');

            // Execute the import
            $result = $this->importService->execute($fullPath, $user, $options);

            // Cleanup the uploaded ZIP file
            Storage::disk('local')->delete($zipPath);

            // Return success with project info
            return response()->json([
                'success' => $result['success'],
                'project' => $result['project'] ? [
                    'id' => $result['project']->id,
                    'name' => $result['project']->name,
                    'description' => $result['project']->description,
                ] : null,
                'imported' => $result['imported'],
                'errors' => $result['errors'],
                'warnings' => $result['warnings'],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel an import and cleanup temporary files
     */
    public function cancel(Request $request): JsonResponse
    {
        $request->validate([
            'zip_path' => 'required|string',
            'temp_dir' => 'nullable|string',
        ]);

        try {
            // Path-traversal guard: both `zip_path` and `temp_dir` arrive
            // from the user. Without these checks an authenticated caller
            // could pass `../../../../etc/passwd` (or any absolute path on
            // Windows) and our deleteDirectory() would happily traverse and
            // delete arbitrary files. We pin both inputs to the storage
            // sandbox and canonicalise via realpath() to neutralise `..` /
            // symlink tricks before any delete operation runs.
            $sandbox = realpath(storage_path('app'));

            // ZIP path is relative to storage/app — Storage::disk('local')
            // already sandboxes it, but we still reject obvious traversal
            // attempts up front so we don't silently no-op on a hostile path.
            $zipPath = $request->input('zip_path');
            if ($zipPath !== null && (str_contains($zipPath, '..') || str_starts_with($zipPath, '/') || preg_match('#^[A-Za-z]:[\\\\/]#', $zipPath))) {
                return response()->json([
                    'success' => false,
                    'error'   => 'Invalid zip_path: traversal sequences and absolute paths are not allowed.',
                ], 422);
            }
            if ($zipPath && Storage::disk('local')->exists($zipPath)) {
                Storage::disk('local')->delete($zipPath);
            }

            // temp_dir is an absolute filesystem path (it came back from the
            // import upload). Only allow paths that resolve inside our
            // storage sandbox — anything else is either a bug or an attack.
            $tempDir = $request->input('temp_dir');
            if ($tempDir) {
                $resolved = realpath($tempDir);
                if (!$resolved || !$sandbox || strncmp($resolved, $sandbox, strlen($sandbox)) !== 0) {
                    return response()->json([
                        'success' => false,
                        'error'   => 'Invalid temp_dir: path must resolve inside the storage sandbox.',
                    ], 422);
                }
                if (file_exists($resolved)) {
                    $this->deleteDirectory($resolved);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Import cancelled and temporary files cleaned up.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Recursively delete directory
     */
    protected function deleteDirectory(string $dir): void
    {
        if (!file_exists($dir)) {
            return;
        }

        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }

            $path = $dir . '/' . $file;
            if (is_dir($path)) {
                $this->deleteDirectory($path);
            } else {
                unlink($path);
            }
        }

        rmdir($dir);
    }
}
