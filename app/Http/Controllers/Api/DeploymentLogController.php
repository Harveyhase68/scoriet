<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeploymentLog;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class DeploymentLogController extends Controller
{
    /**
     * Get deployment logs for a project
     *
     * GET /api/projects/{projectId}/deployment-logs
     *
     * @param int $projectId
     * @param Request $request
     * @return JsonResponse
     */
    public function index(int $projectId, Request $request): JsonResponse
    {
        $project = Project::find($projectId);

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Check if user has access to this project
        $user = Auth::user();
        $hasAccess = (string)$project->owner_id === (string)$user->id
            || $project->teams()->whereHas('members', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        // Get logs, optionally filtered by task_id
        $query = DeploymentLog::where('project_id', $projectId)
            ->orderBy('created_at', 'desc');

        if ($request->has('task_id')) {
            $query->where('task_id', $request->input('task_id'));
        }

        if ($request->has('limit')) {
            $query->limit($request->input('limit'));
        }

        $logs = $query->get();

        return response()->json([
            'success' => true,
            'logs' => $logs->map(function ($log) {
                return [
                    'id' => $log->id,
                    'type' => $log->type,
                    'message' => $log->message,
                    'metadata' => $log->metadata,
                    'task_id' => $log->task_id,
                    'created_at' => $log->created_at->toIso8601String(),
                ];
            }),
        ], 200);
    }

    /**
     * Get deployment logs for a specific task
     *
     * GET /api/deployment-logs/task/{taskId}
     *
     * @param int $taskId
     * @param Request $request
     * @return JsonResponse
     */
    public function byTask(int $taskId, Request $request): JsonResponse
    {
        $logs = DeploymentLog::where('task_id', $taskId)
            ->orderBy('created_at', 'asc')
            ->get();

        // Check if user has access to the project
        if ($logs->isNotEmpty()) {
            $project = $logs->first()->project;
            $user = Auth::user();

            $hasAccess = (string)$project->owner_id === (string)$user->id
                || $project->teams()->whereHas('members', function($query) use ($user) {
                    $query->where('user_id', $user->id);
                })->exists();

            if (!$hasAccess) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied',
                ], 403);
            }
        }

        return response()->json([
            'success' => true,
            'logs' => $logs->map(function ($log) {
                return [
                    'id' => $log->id,
                    'type' => $log->type,
                    'message' => $log->message,
                    'metadata' => $log->metadata,
                    'created_at' => $log->created_at->toIso8601String(),
                ];
            }),
        ], 200);
    }

    /**
     * Create a deployment log entry
     *
     * POST /api/deployment-logs
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => 'required|integer|exists:projects,id',
            'task_id' => 'nullable|integer|exists:cli_tasks,id',
            'type' => 'required|in:info,success,warning,error',
            'message' => 'required|string',
            'metadata' => 'nullable|array',
        ]);

        $user = Auth::user();

        // Check if user has access to this project
        $project = Project::find($validated['project_id']);
        $hasAccess = (string)$project->owner_id === (string)$user->id
            || $project->teams()->whereHas('members', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $log = DeploymentLog::log(
            $validated['project_id'],
            $user->id,
            $validated['type'],
            $validated['message'],
            $validated['task_id'] ?? null,
            $validated['metadata'] ?? null
        );

        return response()->json([
            'success' => true,
            'log' => [
                'id' => $log->id,
                'type' => $log->type,
                'message' => $log->message,
                'metadata' => $log->metadata,
                'created_at' => $log->created_at->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Clear deployment logs for a project
     *
     * DELETE /api/projects/{projectId}/deployment-logs
     *
     * @param int $projectId
     * @param Request $request
     * @return JsonResponse
     */
    public function clear(int $projectId, Request $request): JsonResponse
    {
        $project = Project::find($projectId);

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Only owner can clear logs
        $user = Auth::user();
        if ((string)$project->owner_id !== (string)$user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Only project owner can clear logs',
            ], 403);
        }

        DeploymentLog::where('project_id', $projectId)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Deployment logs cleared successfully',
        ], 200);
    }
}
