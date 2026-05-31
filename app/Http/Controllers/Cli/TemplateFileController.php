<?php

namespace App\Http\Controllers\Cli;

use App\Http\Controllers\Concerns\ValidatesPartialUpdate;
use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\TemplateFile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class TemplateFileController extends Controller
{
    use ValidatesPartialUpdate;

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
     * Get a single file with its full content.
     *
     * GET /cli/v1/templates/{templateId}/files/{fileId}
     *
     * The list() endpoint deliberately omits file_content (so a template
     * with 50 large files doesn't ship megabytes per call) — use this
     * endpoint when you actually need the bytes. Same access rules as list().
     */
    public function show(int $templateId, int $fileId, Request $request): JsonResponse
    {
        $template = Template::find($templateId);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found',
            ], 404);
        }

        $user = $request->user();

        // Same access matrix as list() — read access is broader than write.
        $hasAccess = $template->is_system_template
            || $template->visibility === 'public'
            || (string)$template->creator_user_id === (string)$user->id;

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied to this template',
            ], 403);
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

        return response()->json([
            'success' => true,
            'file' => [
                'id'           => $file->id,
                'template_id'  => $file->template_id,
                'file_name'    => $file->file_name,
                'file_path'    => $file->file_path,
                'output_path'  => $file->output_path,
                'file_type'    => $file->file_type,
                'content_type' => $file->content_type,
                'file_content' => $file->file_content,   // ← the actual bytes
                'content_size' => strlen($file->file_content ?? ''),
                'file_order'   => $file->file_order,
                'created_at'   => $file->created_at?->toIso8601String(),
                'updated_at'   => $file->updated_at?->toIso8601String(),
            ],
        ], 200);
    }

    /**
     * Update a template file — partial update, only sent fields change.
     *
     * PUT /cli/v1/templates/{templateId}/files/{fileId}
     *
     * Body (all optional):
     *   file_name, file_path, output_path, file_content, file_type,
     *   content_type, file_order
     *
     * Same write-permission contract as add()/delete(): only the template
     * creator can update, and system templates are read-only via the CLI.
     */
    public function update(int $templateId, int $fileId, Request $request): JsonResponse
    {
        $template = Template::find($templateId);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found',
            ], 404);
        }

        $user = $request->user();

        if ((string)$template->creator_user_id !== (string)$user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied - only template creator can update files',
            ], 403);
        }

        if ($template->is_system_template) {
            return response()->json([
                'success' => false,
                'message' => 'System templates cannot be modified',
            ], 403);
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

        $expectedFields = [
            'file_name', 'file_path', 'output_path',
            'file_content', 'file_type', 'content_type', 'file_order',
        ];

        // Short-circuit "body present but no known fields" — same UX as the
        // other PUT endpoints in /cli/v1/* (Template, FormSet, Project, etc.).
        $fieldCheck = $this->checkBodyFields($request, $expectedFields);
        if ($fieldCheck['all_unknown']) {
            return $this->unknownFieldsResponse($expectedFields, $fieldCheck['received']);
        }

        $validator = Validator::make($request->all(), [
            'file_name'    => 'sometimes|string|max:255',
            'file_path'    => 'sometimes|nullable|string|max:500',
            'output_path'  => 'sometimes|nullable|string|max:500',
            'file_content' => 'sometimes|string', // empty content allowed (clear-out)
            'file_type'    => 'sometimes|nullable|string|max:50',
            'content_type' => 'sometimes|nullable|string|max:50',
            'file_order'   => 'sometimes|nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            // Per-template uniqueness on file_name — same rule add() relies
            // on implicitly via the UI. Only checked when the name is
            // actually changing, so a content-only PUT never trips on itself.
            if ($request->filled('file_name') && $request->input('file_name') !== $file->file_name) {
                $duplicate = TemplateFile::where('template_id', $templateId)
                    ->where('file_name', $request->input('file_name'))
                    ->where('id', '!=', $file->id)
                    ->exists();
                if ($duplicate) {
                    return response()->json([
                        'success' => false,
                        'message' => "A file named '{$request->input('file_name')}' already exists in this template.",
                    ], 409);
                }
            }

            $updatable = array_intersect_key(
                $request->all(),
                array_flip($expectedFields)
            );

            $file->fill($updatable);
            $file->save();

            $response = [
                'success'        => true,
                'message'        => 'File updated successfully',
                'updated_fields' => array_keys($updatable),
                'file' => [
                    'id'           => $file->id,
                    'template_id'  => $file->template_id,
                    'file_name'    => $file->file_name,
                    'file_path'    => $file->file_path,
                    'output_path'  => $file->output_path,
                    'file_type'    => $file->file_type,
                    'content_type' => $file->content_type,
                    'content_size' => strlen($file->file_content ?? ''),
                    'file_order'   => $file->file_order,
                    'updated_at'   => $file->updated_at?->toIso8601String(),
                ],
            ];
            if ($warning = $this->unknownFieldsWarning($fieldCheck['unknown'])) {
                $response['warnings'] = $warning;
            }
            return response()->json($response, 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update file',
                'error'   => $e->getMessage(),
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
