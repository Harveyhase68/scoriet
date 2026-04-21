<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReportImage;
use App\Models\ReportPattern;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class ReportImageController extends Controller
{
    /**
     * List images for a report pattern
     * GET /api/report-patterns/{patternId}/images
     */
    public function index(Request $request, int $patternId): JsonResponse
    {
        $pattern = ReportPattern::find($patternId);
        if (!$pattern) {
            return response()->json(['success' => false, 'error' => 'Pattern not found'], 404);
        }

        $query = ReportImage::where('report_pattern_id', $patternId)
            ->select('id', 'report_pattern_id', 'element_id', 'name', 'language', 'mime_type', 'filename', 'file_size', 'width', 'height', 'created_at');

        // Filter by element_id if provided
        if ($request->has('element_id')) {
            $query->where('element_id', $request->input('element_id'));
        }

        $images = $query->orderBy('language')->get();

        return response()->json([
            'success' => true,
            'data' => $images,
        ]);
    }

    /**
     * Upload a new image (binary file upload)
     * POST /api/report-patterns/{patternId}/images
     */
    public function upload(Request $request, int $patternId): JsonResponse
    {
        $user = Auth::user();
        $pattern = ReportPattern::find($patternId);
        if (!$pattern) {
            return response()->json(['success' => false, 'error' => 'Pattern not found'], 404);
        }
        if ((int) $pattern->creator_user_id !== (int) $user->id) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'image' => 'required|file|mimes:png,jpg,jpeg,gif,svg,webp,bmp,ico|max:10240', // 10MB max
            'name' => 'required|string|max:255',
            'language' => 'nullable|string|max:10',
            'element_id' => 'nullable|integer',
        ]);

        $file = $request->file('image');
        $imageData = file_get_contents($file->getRealPath());

        // Get image dimensions (for raster images)
        $width = null;
        $height = null;
        $imageInfo = @getimagesize($file->getRealPath());
        if ($imageInfo) {
            $width = $imageInfo[0];
            $height = $imageInfo[1];
        }

        $image = ReportImage::create([
            'report_pattern_id' => $patternId,
            'element_id' => $request->input('element_id'),
            'name' => $request->input('name'),
            'language' => $request->input('language'),
            'mime_type' => $file->getMimeType(),
            'filename' => $file->getClientOriginalName(),
            'file_size' => strlen($imageData),
            'width' => $width,
            'height' => $height,
            'image_data' => $imageData,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Image uploaded',
            'data' => [
                'id' => $image->id,
                'name' => $image->name,
                'language' => $image->language,
                'mime_type' => $image->mime_type,
                'filename' => $image->filename,
                'file_size' => $image->file_size,
                'width' => $image->width,
                'height' => $image->height,
            ],
        ], 201);
    }

    /**
     * Get image metadata (without binary data)
     * GET /api/report-images/{id}
     */
    public function show(int $id): JsonResponse
    {
        $image = ReportImage::find($id);
        if (!$image) {
            return response()->json(['success' => false, 'error' => 'Image not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $image->id,
                'report_pattern_id' => $image->report_pattern_id,
                'name' => $image->name,
                'language' => $image->language,
                'mime_type' => $image->mime_type,
                'filename' => $image->filename,
                'file_size' => $image->file_size,
                'width' => $image->width,
                'height' => $image->height,
            ],
        ]);
    }

    /**
     * Serve the actual image binary data (for <img src="...">)
     * GET /api/report-images/{id}/data
     */
    public function serveImage(int $id): Response
    {
        $image = ReportImage::find($id);
        if (!$image) {
            abort(404);
        }

        return response($image->image_data, 200)
            ->header('Content-Type', $image->mime_type)
            ->header('Content-Length', $image->file_size)
            ->header('Content-Disposition', 'inline; filename="' . $image->filename . '"')
            ->header('Cache-Control', 'public, max-age=86400');
    }

    /**
     * Delete an image
     * DELETE /api/report-images/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $user = Auth::user();
        $image = ReportImage::with('pattern')->find($id);
        if (!$image) {
            return response()->json(['success' => false, 'error' => 'Image not found'], 404);
        }
        if ((int) $image->pattern->creator_user_id !== (int) $user->id) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        $image->delete();

        return response()->json([
            'success' => true,
            'message' => 'Image deleted',
        ]);
    }
}
