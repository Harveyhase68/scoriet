<?php

namespace App\Http\Controllers\Cli;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\TemplateFile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class TemplateFileController extends Controller
{
    /**
     * List files for a template
     *
     * GET /cli/templates/{templateId}/files
     *
     * @param int $templateId
     * @param Request $request
     * @return JsonResponse
     */
    public function list(int $templateId, Request $request): JsonResponse
    {
        $template = Template::find($templateId);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found',
            ], 404);
        }

        $user = $request->user();

        // Check if user has access to this template
        $hasAccess = $template->is_system_template || // System template
                     $template->visibility === 'public' || // Public template
                     (string)$template->creator_user_id === (string)$user->id; // Owned by user

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied to this template',
            ], 403);
        }

        $files = $template->files()->orderByRaw('CASE WHEN file_order > 0 THEN 0 ELSE 1 END')->orderBy('file_order')->orderBy('file_name')->get()->map(function ($file) {
            return [
                'id' => $file->id,
                'file_name' => $file->file_name,
                'file_path' => $file->file_path,
                'output_path' => $file->output_path,
                'file_type' => $file->file_type,
                'content_type' => $file->content_type,
                'content_size' => strlen($file->file_content ?? ''),
                'file_order' => $file->file_order,
                'created_at' => $file->created_at->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'template' => [
                'id' => $template->id,
                'name' => $template->name,
            ],
            'files' => $files,
            'total' => $files->count(),
        ], 200);
    }

    /**
     * Add file to template
     *
     * POST /cli/templates/{templateId}/files
     *
     * @param int $templateId
     * @param Request $request
     * @return JsonResponse
     */
    public function add(int $templateId, Request $request): JsonResponse
    {
        $template = Template::find($templateId);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found',
            ], 404);
        }

        $user = $request->user();

        // Only creator can add files
        if ((string)$template->creator_user_id !== (string)$user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied - only template creator can add files',
            ], 403);
        }

        // System templates cannot be modified via CLI
        if ($template->is_system_template) {
            return response()->json([
                'success' => false,
                'message' => 'System templates cannot be modified',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'file_name' => 'required|string|max:255',
            'file_path' => 'nullable|string|max:500',
            'output_path' => 'nullable|string|max:500',
            'file_content' => 'required|string',
            'file_type' => 'nullable|string|max:50',
            'content_type' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Get next file order
            $maxOrder = $template->files()->max('file_order') ?? 0;

            $file = TemplateFile::create([
                'template_id' => $template->id,
                'file_name' => $request->input('file_name'),
                'file_path' => $request->input('file_path', ''),
                'output_path' => $request->input('output_path', $request->input('file_path', '')),
                'file_content' => $request->input('file_content'),
                'file_type' => $request->input('file_type', $this->detectFileType($request->input('file_name'))),
                'content_type' => $request->input('content_type', 'template'),
                'file_order' => $maxOrder + 1,
            ]);

            // Update template file_count
            $template->update(['file_count' => $template->files()->count()]);

            return response()->json([
                'success' => true,
                'message' => 'File added to template successfully',
                'file' => [
                    'id' => $file->id,
                    'file_name' => $file->file_name,
                    'file_path' => $file->file_path,
                    'output_path' => $file->output_path,
                    'file_type' => $file->file_type,
                    'content_type' => $file->content_type,
                    'content_size' => strlen($file->file_content),
                    'file_order' => $file->file_order,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add file',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete file from template (HARD delete - permanent!)
     *
     * DELETE /cli/templates/{templateId}/files/{fileId}
     *
     * @param int $templateId
     * @param int $fileId
     * @param Request $request
     * @return JsonResponse
     */
    public function delete(int $templateId, int $fileId, Request $request): JsonResponse
    {
        $template = Template::find($templateId);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found',
            ], 404);
        }

        $file = TemplateFile::where('template_id', $templateId)
            ->where('id', $fileId)
            ->first();

        if (!$file) {
            return response()->json([
                'success' => false,
                'message' => 'File not found in this template',
            ], 404);
        }

        $user = $request->user();

        // Only creator can delete files
        if ((string)$template->creator_user_id !== (string)$user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied - only template creator can delete files',
            ], 403);
        }

        // System templates cannot be modified via CLI
        if ($template->is_system_template) {
            return response()->json([
                'success' => false,
                'message' => 'System templates cannot be modified',
            ], 403);
        }

        try {
            // Hard delete
            $file->delete();

            // Update template file_count
            $template->update(['file_count' => $template->files()->count()]);

            return response()->json([
                'success' => true,
                'message' => 'File deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete file',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Detect file type from file name extension
     *
     * @param string $fileName
     * @return string
     */
    private function detectFileType(string $fileName): string
    {
        $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        $typeMap = [
            'php' => 'php',
            'js' => 'javascript',
            'ts' => 'typescript',
            'tsx' => 'typescript',
            'jsx' => 'javascript',
            'py' => 'python',
            'java' => 'java',
            'cs' => 'csharp',
            'go' => 'go',
            'rs' => 'rust',
            'html' => 'html',
            'css' => 'css',
            'scss' => 'scss',
            'json' => 'json',
            'xml' => 'xml',
            'md' => 'markdown',
            'txt' => 'text',
            'sql' => 'sql',
        ];

        return $typeMap[$extension] ?? 'text';
    }
}
