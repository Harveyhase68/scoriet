<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GeneratedProjectUploadController extends Controller
{
    /**
     * Upload a generated project ZIP for deployment
     * Stores the ZIP temporarily and returns a download URL
     *
     * POST /api/generated-projects/upload
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'project_id' => 'required|integer|exists:projects,id',
            'archive' => 'required|file|mimes:zip|max:512000', // Max 500MB
        ]);

        $user = Auth::user();
        $projectId = $request->input('project_id');

        // Generate unique filename
        $filename = sprintf(
            'generated_project_%s_%s.zip',
            $projectId,
            Str::uuid()
        );

        // Store in temporary storage (will be cleaned up after download or after 24h)
        $path = $request->file('archive')->storeAs(
            'generated_projects',
            $filename,
            'public'
        );

        // Build download URL
        $downloadUrl = url("/api/generated-projects/download/{$filename}");

        return response()->json([
            'success' => true,
            'filename' => $filename,
            'download_url' => $downloadUrl,
            'path' => $path,
            'size' => $request->file('archive')->getSize(),
        ]);
    }

    /**
     * Download a previously uploaded generated project
     *
     * GET /api/generated-projects/download/{filename}
     */
    public function download(string $filename): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $path = "generated_projects/{$filename}";

        if (!Storage::disk('public')->exists($path)) {
            abort(404, 'Archive not found');
        }

        $fullPath = Storage::disk('public')->path($path);

        return response()->download($fullPath, $filename, [
            'Content-Type' => 'application/zip',
        ]);
    }
}
