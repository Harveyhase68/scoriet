<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectApplication;
use App\Models\MessageThread;
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
            // If pending, don't allow another application
            if ($existingApplication->status === 'pending') {
                return response()->json([
                    'message' => 'Sie haben bereits eine ausstehende Bewerbung für dieses Projekt',
                    'status' => $existingApplication->status
                ], 409);
            }

            // If accepted, check if user is still actually a member
            if ($existingApplication->status === 'accepted') {
                // Verify the user is still a member of the project
                $isMember = $project->members()->where('user_id', $user->id)->exists();

                if ($isMember) {
                    return response()->json([
                        'message' => 'Sie sind bereits Mitglied dieses Projekts',
                        'status' => $existingApplication->status
                    ], 409);
                }

                // User was removed from project but old application still exists
                // Delete the old application to allow re-application
                $existingApplication->delete();
            }

            // If rejected, allow re-application by deleting the old one
            if ($existingApplication->status === 'rejected') {
                $existingApplication->delete();
            }
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
    public function reviewApplication(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'application_id' => 'required|integer',
            'action' => 'required|in:approve,reject',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            \Log::error('ReviewApplication: Validation failed', ['errors' => $validator->errors()]);
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors()
            ], 422);
        }

        $applicationId = $request->application_id;

        try {
            $application = ProjectApplication::with(['project', 'user'])->findOrFail($applicationId);
        } catch (\Exception $e) {
            \Log::error('ReviewApplication: Application not found', ['applicationId' => $applicationId, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Application not found'], 404);
        }

        $user = $request->user();

        // Only project owner can review
        if ((string)$application->project->owner_id !== (string)$user->id) {
            \Log::warning('ReviewApplication: Permission denied', [
                'project_owner_id' => $application->project->owner_id,
                'user_id' => $user->id,
            ]);
            return response()->json([
                'message' => 'Keine Berechtigung - Du bist nicht der Projekt-Owner'
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

            // Send notification message to applicant
            $subject = "Bewerbung angenommen: {$application->project->name}";
            $body = "Gute Neuigkeiten! {$user->name} hat deine Bewerbung zum Projekt '{$application->project->name}' angenommen!\n\n";
            if ($request->notes) {
                $body .= "Nachricht: {$request->notes}";
            } else {
                $body .= "Du bist jetzt Mitglied des Projekts.";
            }
        } else {
            $application->reject($user->id, $request->notes);
            $message = 'Bewerbung wurde abgelehnt';

            // Send notification message to applicant
            $subject = "Bewerbung abgelehnt: {$application->project->name}";
            $body = "{$user->name} hat deine Bewerbung zum Projekt '{$application->project->name}' leider abgelehnt.\n\n";
            if ($request->notes) {
                $body .= "Begründung: {$request->notes}";
            } else {
                $body .= "Es wurde keine Begründung angegeben.";
            }
        }

        // Send the notification message via internal messaging system
        try {
            MessageThread::createWithMessage(
                $subject,
                $user->id,  // sender (project owner)
                [$application->user_id],  // recipient (applicant)
                $body
            );
        } catch (\Exception $e) {
            \Log::error('ReviewApplication: Failed to send notification message', [
                'error' => $e->getMessage()
            ]);
            // Don't fail the whole request if message sending fails
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
        // First check if project exists with this join code (regardless of allow_join_requests)
        $projectExists = Project::where('join_code', $joinCode)
                                ->with(['owner', 'teams'])
                                ->first();

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
        $existingApplication = ProjectApplication::where('project_id', $project->id)
                                       ->where('user_id', $user->id)
                                       ->first();

        // Determine the actual status
        $hasApplied = false;
        $applicationStatus = $existingApplication?->status;

        if ($existingApplication) {
            if ($existingApplication->status === 'pending') {
                $hasApplied = true;
            } elseif ($existingApplication->status === 'accepted') {
                // Check if user is still actually a member
                $isMember = $project->members()->where('user_id', $user->id)->exists();
                if ($isMember) {
                    $hasApplied = true;
                } else {
                    // User was removed - treat as if no application exists
                    $applicationStatus = null;
                }
            }
            // rejected applications: hasApplied = false, can re-apply
        }

        return response()->json([
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'owner' => $project->owner->only(['id', 'name', 'username']),
                'teams_count' => $project->teams->count(),
                'created_at' => $project->created_at,
            ],
            'has_applied' => $hasApplied,
            'application_status' => $applicationStatus,
        ]);
    }
}
