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
        if ($project->owner_id !== $user->id) {
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
        $project = Project::where('join_code', $joinCode)
                          ->where('allow_join_requests', true)
                          ->with(['owner', 'teams'])
                          ->first();

        if (!$project) {
            return response()->json([
                'message' => 'Ungültiger Join-Code'
            ], 404);
        }

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
