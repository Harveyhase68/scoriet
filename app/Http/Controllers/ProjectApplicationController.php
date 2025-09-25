<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProjectApplicationController extends Controller
{
    /**
     * Apply to join a project using join code
     */
    public function apply(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'join_code' => 'required|string|size:13', // PROJ-XXXXXXXX format
            'message' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors()
            ], 422);
        }

        // Find project by join code
        $project = Project::where('join_code', $request->join_code)
                          ->where('allow_join_requests', true)
                          ->first();

        if (!$project) {
            return response()->json([
                'message' => 'Ungültiger Join-Code oder Bewerbungen nicht erlaubt'
            ], 404);
        }

        $user = $request->user();

        // Check if user already applied
        $existingApplication = ProjectApplication::where('project_id', $project->id)
                                                ->where('user_id', $user->id)
                                                ->first();

        if ($existingApplication) {
            return response()->json([
                'message' => 'Sie haben bereits eine Bewerbung für dieses Projekt eingereicht',
                'status' => $existingApplication->status
            ], 409);
        }

        // Create application
        $application = ProjectApplication::create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'join_code' => $request->join_code,
            'message' => $request->message,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Bewerbung erfolgreich eingereicht',
            'application' => $application->load(['project', 'user']),
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
            ]
        ], 201);
    }

    /**
     * Get applications for a project (project owner only)
     */
    public function getProjectApplications(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);
        $user = $request->user();

        // Only project owner can see applications
        if ((string)$project->owner_id !== (string)$user->id) {
            return response()->json([
                'message' => 'Keine Berechtigung'
            ], 403);
        }

        $applications = $project->applications()
                               ->with(['user', 'reviewer'])
                               ->orderBy('created_at', 'desc')
                               ->get();

        return response()->json([
            'applications' => $applications,
            'project' => $project
        ]);
    }

    /**
     * Review an application (approve/reject)
     */
    public function reviewApplication(Request $request, $applicationId)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:approve,reject',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors()
            ], 422);
        }

        $application = ProjectApplication::with(['project', 'user'])->findOrFail($applicationId);
        $user = $request->user();

        // Only project owner can review
        if ($application->project->owner_id !== $user->id) {
            return response()->json([
                'message' => 'Keine Berechtigung'
            ], 403);
        }

        // Check if already reviewed
        if ($application->status !== 'pending') {
            return response()->json([
                'message' => 'Diese Bewerbung wurde bereits bearbeitet'
            ], 409);
        }

        // Review the application
        if ($request->action === 'approve') {
            $application->approve($user->id, $request->notes);
            $message = 'Bewerbung wurde angenommen';
        } else {
            $application->reject($user->id, $request->notes);
            $message = 'Bewerbung wurde abgelehnt';
        }

        return response()->json([
            'message' => $message,
            'application' => $application->fresh(['project', 'user', 'reviewer'])
        ]);
    }

    /**
     * Get user's own applications
     */
    public function getMyApplications(Request $request)
    {
        $user = $request->user();
        
        $applications = ProjectApplication::where('user_id', $user->id)
                                         ->with(['project.owner', 'reviewer'])
                                         ->orderBy('created_at', 'desc')
                                         ->get();

        return response()->json([
            'applications' => $applications
        ]);
    }

    /**
     * Get project info by join code (for preview before applying)
     */
    public function getProjectByJoinCode(Request $request, $joinCode)
    {
        // Debug log
        \Log::info('ProjectApplicationController: getProjectByJoinCode called', [
            'joinCode' => $joinCode,
            'user_id' => $request->user()?->id,
        ]);

        // First check if project exists with this join code (regardless of allow_join_requests)
        $projectExists = Project::where('join_code', $joinCode)
                                ->with(['owner', 'teams'])
                                ->first();

        \Log::info('ProjectApplicationController: Project lookup result', [
            'joinCode' => $joinCode,
            'project_exists' => !!$projectExists,
            'project_id' => $projectExists?->id,
            'allow_join_requests' => $projectExists?->allow_join_requests,
            'is_active' => $projectExists?->is_active,
        ]);

        // Provide specific error messages for different scenarios
        if (!$projectExists) {
            return response()->json([
                'message' => 'Ungültiger Join-Code. Bitte überprüfen Sie den Code.'
            ], 404);
        }

        if (!$projectExists->is_active) {
            return response()->json([
                'message' => 'Dieses Projekt ist nicht mehr aktiv.'
            ], 400);
        }

        if (!$projectExists->allow_join_requests) {
            return response()->json([
                'message' => 'Dieses Projekt akzeptiert derzeit keine Beitrittsanfragen.'
            ], 403);
        }

        $project = $projectExists;

        // Check if user already applied
        $user = $request->user();
        $hasApplied = ProjectApplication::where('project_id', $project->id)
                                       ->where('user_id', $user->id)
                                       ->exists();

        return response()->json([
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'owner' => $project->owner->only(['id', 'name', 'username']),
                'teams_count' => $project->teams->count(),
                'created_at' => $project->created_at,
            ],
            'has_applied' => $hasApplied
        ]);
    }
}
