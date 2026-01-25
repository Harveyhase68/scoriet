<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectAttachment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProjectAttachmentController extends Controller
{
    /**
     * Maximum file size in bytes (25 MB)
     */
    private const MAX_FILE_SIZE = 25 * 1024 * 1024;

    /**
     * Get all attachments for a project
     */
    public function index(int $projectId, Request $request): JsonResponse
    {
        $user = Auth::user();
        $project = Project::findOrFail($projectId);

        // Check if user has access to this project
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Zugriff verweigert'], 403);
        }

        // Build query with optional filters
        $query = $project->attachments()->with('uploader:id,name,username');

        // Filter by category
        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        // Search by filename or description
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('original_filename', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Order: pinned first, then by created_at desc
        $query->orderBy('is_pinned', 'desc')->orderBy('created_at', 'desc');

        $attachments = $query->get();

        // Add category labels
        $attachments->each(function ($attachment) {
            $attachment->category_label = $attachment->getCategoryLabel();
        });

        return response()->json([
            'attachments' => $attachments,
            'categories' => ProjectAttachment::CATEGORIES,
            'total' => $attachments->count(),
        ]);
    }

    /**
     * Upload a new attachment
     */
    public function store(int $projectId, Request $request): JsonResponse
    {
        $user = Auth::user();
        $project = Project::findOrFail($projectId);

        // Check if user has access to this project
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Zugriff verweigert'], 403);
        }

        // Validate request
        $validated = $request->validate([
            'file' => 'required|file|max:' . (self::MAX_FILE_SIZE / 1024), // max in KB
            'description' => 'nullable|string|max:1000',
            'category' => 'nullable|string|in:' . implode(',', array_keys(ProjectAttachment::CATEGORIES)),
        ]);

        $file = $request->file('file');

        // Generate unique filename
        $extension = $file->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;

        // Store file
        $path = "project-attachments/{$projectId}";
        $storedPath = $file->storeAs($path, $filename, 'local');

        // Create attachment record
        $attachment = ProjectAttachment::create([
            'project_id' => $projectId,
            'uploaded_by' => $user->id,
            'filename' => $filename,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'path' => $storedPath,
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'] ?? 'other',
            'is_pinned' => false,
            'download_count' => 0,
        ]);

        // Load uploader relationship
        $attachment->load('uploader:id,name,username');
        $attachment->category_label = $attachment->getCategoryLabel();

        return response()->json([
            'message' => 'Anhang erfolgreich hochgeladen',
            'attachment' => $attachment,
        ], 201);
    }

    /**
     * Get a single attachment
     */
    public function show(int $projectId, int $attachmentId): JsonResponse
    {
        $user = Auth::user();
        $project = Project::findOrFail($projectId);

        // Check if user has access to this project
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Zugriff verweigert'], 403);
        }

        $attachment = ProjectAttachment::where('project_id', $projectId)
            ->with('uploader:id,name,username')
            ->findOrFail($attachmentId);

        $attachment->category_label = $attachment->getCategoryLabel();

        return response()->json([
            'attachment' => $attachment,
        ]);
    }

    /**
     * Update an attachment (description, category, pinned status)
     */
    public function update(int $projectId, int $attachmentId, Request $request): JsonResponse
    {
        $user = Auth::user();
        $project = Project::findOrFail($projectId);

        // Check if user has access to this project
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Zugriff verweigert'], 403);
        }

        $attachment = ProjectAttachment::where('project_id', $projectId)->findOrFail($attachmentId);

        // Only owner or uploader can edit
        if ($project->owner_id !== $user->id && $attachment->uploaded_by !== $user->id) {
            return response()->json(['message' => 'Nur der Projekt-Eigentümer oder der Uploader kann diesen Anhang bearbeiten'], 403);
        }

        // Validate request
        $validated = $request->validate([
            'description' => 'nullable|string|max:1000',
            'category' => 'nullable|string|in:' . implode(',', array_keys(ProjectAttachment::CATEGORIES)),
            'is_pinned' => 'nullable|boolean',
        ]);

        // Update fields
        if (array_key_exists('description', $validated)) {
            $attachment->description = $validated['description'];
        }
        if (array_key_exists('category', $validated)) {
            $attachment->category = $validated['category'];
        }
        if (array_key_exists('is_pinned', $validated)) {
            $attachment->is_pinned = $validated['is_pinned'];
        }

        $attachment->save();

        // Reload relationships
        $attachment->load('uploader:id,name,username');
        $attachment->category_label = $attachment->getCategoryLabel();

        return response()->json([
            'message' => 'Anhang erfolgreich aktualisiert',
            'attachment' => $attachment,
        ]);
    }

    /**
     * Delete an attachment
     */
    public function destroy(int $projectId, int $attachmentId): JsonResponse
    {
        $user = Auth::user();
        $project = Project::findOrFail($projectId);

        // Check if user has access to this project
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Zugriff verweigert'], 403);
        }

        $attachment = ProjectAttachment::where('project_id', $projectId)->findOrFail($attachmentId);

        // Only owner or uploader can delete
        if ($project->owner_id !== $user->id && $attachment->uploaded_by !== $user->id) {
            return response()->json(['message' => 'Nur der Projekt-Eigentümer oder der Uploader kann diesen Anhang löschen'], 403);
        }

        // Delete (file will be deleted via boot method)
        $attachment->delete();

        return response()->json([
            'message' => 'Anhang erfolgreich gelöscht',
        ]);
    }

    /**
     * Download an attachment
     */
    public function download(int $projectId, int $attachmentId): StreamedResponse|JsonResponse
    {
        $user = Auth::user();
        $project = Project::findOrFail($projectId);

        // Check if user has access to this project
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Zugriff verweigert'], 403);
        }

        $attachment = ProjectAttachment::where('project_id', $projectId)->findOrFail($attachmentId);

        // Check if file exists
        $disk = Storage::disk('local');
        if (!$disk->exists($attachment->path)) {
            return response()->json(['message' => 'Datei nicht gefunden'], 404);
        }

        // Increment download counter
        $attachment->incrementDownloadCount();

        // Stream the file
        return response()->streamDownload(function () use ($disk, $attachment) {
            echo $disk->get($attachment->path);
        }, $attachment->original_filename, [
            'Content-Type' => $attachment->mime_type,
            'Content-Length' => $attachment->size,
        ]);
    }
}
