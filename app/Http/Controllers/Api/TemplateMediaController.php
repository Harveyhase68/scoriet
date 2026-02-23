<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\TemplateMedia;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class TemplateMediaController extends Controller
{
    /**
     * Get all media for a template.
     */
    public function index(Template $template): JsonResponse
    {
        $media = $template->media()->get();

        return response()->json([
            'logo' => $media->firstWhere('media_type', 'logo'),
            'images' => $media->where('media_type', 'image')->values(),
            'videos' => $media->where('media_type', 'video')->values(),
        ]);
    }

    /**
     * Serve a media file from database blob.
     */
    public function serve(TemplateMedia $media): Response
    {
        if (!$media->file_data) {
            abort(404, __('templatemediacontrollerphp37'));
        }

        $binaryData = base64_decode($media->file_data);

        return response($binaryData, 200)
            ->header('Content-Type', $media->mime_type ?? 'image/png')
            ->header('Content-Length', strlen($binaryData))
            ->header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    }

    /**
     * Upload a logo for a template.
     * Stores image as base64 blob in database.
     */
    public function uploadLogo(Request $request, Template $template): JsonResponse
    {
        $this->authorizeTemplateEdit($template);

        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,gif,webp|max:5120', // 5MB max
        ]);

        $file = $request->file('logo');

        // Delete existing logo if any
        $existingLogo = $template->logo;
        if ($existingLogo) {
            $existingLogo->delete();
        }

        // Resize logo to 256x256
        $manager = new ImageManager(new Driver());
        $image = $manager->read($file->getPathname());
        $image->cover(256, 256);

        // Convert to PNG and get binary data
        $imageData = $image->toPng()->toString();

        $media = TemplateMedia::create([
            'template_id' => $template->id,
            'media_type' => 'logo',
            'file_data' => base64_encode($imageData),
            'mime_type' => 'image/png',
            'file_size' => strlen($imageData),
            'sort_order' => 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => __('templatemediacontrollerphp87'),
            'media' => $media,
        ]);
    }

    /**
     * Upload images for a template.
     * Stores images as base64 blobs in database.
     */
    public function uploadImages(Request $request, Template $template): JsonResponse
    {
        $this->authorizeTemplateEdit($template);

        $request->validate([
            'images' => 'required|array|min:1|max:10',
            'images.*' => 'required|image|mimes:jpeg,png,gif,webp|max:10240', // 10MB max per image
        ]);

        $uploadedMedia = [];
        $currentMaxOrder = $template->images()->max('sort_order') ?? 0;

        foreach ($request->file('images') as $index => $file) {
            // Resize if larger than 1920px
            $manager = new ImageManager(new Driver());
            $image = $manager->read($file->getPathname());

            if ($image->width() > 1920 || $image->height() > 1920) {
                $image->scaleDown(1920, 1920);
            }

            // Convert to JPEG and get binary data
            $imageData = $image->toJpeg(85)->toString();

            $media = TemplateMedia::create([
                'template_id' => $template->id,
                'media_type' => 'image',
                'file_data' => base64_encode($imageData),
                'mime_type' => 'image/jpeg',
                'file_size' => strlen($imageData),
                'sort_order' => $currentMaxOrder + $index + 1,
            ]);

            $uploadedMedia[] = $media;
        }

        return response()->json([
            'success' => true,
            'message' => count($uploadedMedia) . __('templatemediacontrollerphp134'),
            'media' => $uploadedMedia,
        ]);
    }

    /**
     * Add a video link to a template.
     */
    public function addVideo(Request $request, Template $template): JsonResponse
    {
        $this->authorizeTemplateEdit($template);

        $request->validate([
            'video_url' => 'required|url',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $videoUrl = $request->video_url;

        if (!TemplateMedia::isValidVideoUrl($videoUrl)) {
            return response()->json([
                'message' => __('templatemediacontrollerphp156'),
            ], 422);
        }

        $currentMaxOrder = $template->videos()->max('sort_order') ?? 0;

        $media = TemplateMedia::create([
            'template_id' => $template->id,
            'media_type' => 'video',
            'video_url' => $videoUrl,
            'title' => $request->title,
            'description' => $request->description,
            'sort_order' => $currentMaxOrder + 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => __('templatemediacontrollerphp173'),
            'media' => $media,
        ]);
    }

    /**
     * Update media details.
     */
    public function update(Request $request, Template $template, TemplateMedia $media): JsonResponse
    {
        $this->authorizeTemplateEdit($template);

        if ($media->template_id !== $template->id) {
            return response()->json(['message' => __('templatemediacontrollerphp186')], 404);
        }

        $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $media->update([
            'title' => $request->title,
            'description' => $request->description,
        ]);

        return response()->json([
            'success' => true,
            'message' => __('templatemediacontrollerphp201'),
            'media' => $media,
        ]);
    }

    /**
     * Update media sort order.
     */
    public function updateOrder(Request $request, Template $template, TemplateMedia $media): JsonResponse
    {
        $this->authorizeTemplateEdit($template);

        if ($media->template_id !== $template->id) {
            return response()->json(['message' => __('templatemediacontrollerphp214')], 404);
        }

        $request->validate([
            'sort_order' => 'required|integer|min:0',
        ]);

        $media->update([
            'sort_order' => $request->sort_order,
        ]);

        return response()->json([
            'success' => true,
            'message' => __('templatemediacontrollerphp227'),
            'media' => $media,
        ]);
    }

    /**
     * Reorder all media of a type.
     */
    public function reorder(Request $request, Template $template): JsonResponse
    {
        $this->authorizeTemplateEdit($template);

        $request->validate([
            'media_type' => 'required|in:image,video',
            'order' => 'required|array',
            'order.*' => 'required|integer|exists:template_media,id',
        ]);

        foreach ($request->order as $index => $mediaId) {
            TemplateMedia::where('id', $mediaId)
                ->where('template_id', $template->id)
                ->where('media_type', $request->media_type)
                ->update(['sort_order' => $index]);
        }

        return response()->json([
            'success' => true,
            'message' => __('templatemediacontrollerphp254'),
        ]);
    }

    /**
     * Delete a media item.
     */
    public function destroy(Template $template, TemplateMedia $media): JsonResponse
    {
        $this->authorizeTemplateEdit($template);

        if ($media->template_id !== $template->id) {
            return response()->json(['message' => __('templatemediacontrollerphp266')], 404);
        }

        $media->delete();

        return response()->json([
            'success' => true,
            'message' => __('templatemediacontrollerphp273'),
        ]);
    }

    /**
     * Check if user can edit the template.
     */
    private function authorizeTemplateEdit(Template $template): void
    {
        $user = Auth::user();

        if (!$template->canBeEditedBy($user)) {
            abort(403, __('templatemediacontrollerphp285'));
        }
    }
}
