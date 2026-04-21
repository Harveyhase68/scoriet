<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectApplication;
use App\Models\MessageThread;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Jobs\SendPushNotificationJob;

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
                'message' => __('projectapplicationcontrollerphp37')
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
                    'message' => __('projectapplicationcontrollerphp52'),
                    'status' => $existingApplication->status
                ], 409);
            }

            // If accepted, check if user is still actually a member
            if ($existingApplication->status === 'accepted') {
                // Verify the user is still a member of the project
                $isMember = $project->members()->where('user_id', $user->id)->exists();

                if ($isMember) {
                    return response()->json([
                        'message' => __('projectapplicationcontrollerphp64'),
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
            'message' => __('projectapplicationcontrollerphp90'),
            'application' => $application->load(['project', 'user']),
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'caption' => $project->getTranslatedCaption(),
                'description' => $project->getTranslatedDescription(),
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
                'message' => __('projectapplicationcontrollerphp111')
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
            \Log::error(__('projectapplicationcontrollerphp138'), ['errors' => $validator->errors()]);
            return response()->json([
                'message' => __('projectapplicationcontrollerphp140'),
                'errors' => $validator->errors()
            ], 422);
        }

        $applicationId = $request->application_id;

        try {
            $application = ProjectApplication::with(['project', 'user'])->findOrFail($applicationId);
        } catch (\Exception $e) {
            \Log::error(__('projectapplicationcontrollerphp150'), ['applicationId' => $applicationId, 'error' => $e->getMessage()]);
            return response()->json(['message' => __('projectapplicationcontrollerphp151')], 404);
        }

        $user = $request->user();

        // Only project owner can review
        if ((string)$application->project->owner_id !== (string)$user->id) {
            \Log::warning(__('projectapplicationcontrollerphp158'), [
                'project_owner_id' => $application->project->owner_id,
                'user_id' => $user->id,
            ]);
            return response()->json([
                'message' => __('projectapplicationcontrollerphp163')
            ], 403);
        }

        // Check if already reviewed
        if ($application->status !== 'pending') {
            return response()->json([
                'message' => __('projectapplicationcontrollerphp170')
            ], 409);
        }

        // Review the application
        if ($request->action === 'approve') {
            $application->approve($user->id, $request->notes);
            $message = __('projectapplicationcontrollerphp177');

            // Send notification message to applicant
            $subject = __('projectapplicationcontrollerphp180')."{$application->project->name}";
            $body = __('projectapplicationcontrollerphp181')."{$user->name}".__('projectapplicationcontrollerphp181_2')."{$application->project->name}".__('projectapplicationcontrollerphp181_3')."\n\n";
            if ($request->notes) {
                $body .= __('projectapplicationcontrollerphp183')."{$request->notes}";
            } else {
                $body .= __('projectapplicationcontrollerphp185');
            }
        } else {
            $application->reject($user->id, $request->notes);
            $message = __('projectapplicationcontrollerphp189');

            // Send notification message to applicant
            $subject = "Bewerbung abgelehnt: {$application->project->name}";
            $body = "{$user->name}".__('projectapplicationcontrollerphp193')."'{$application->project->name}'".__('projectapplicationcontrollerphp193_2')."\n\n";
            if ($request->notes) {
                $body .= __('projectapplicationcontrollerphp195')."{$request->notes}";
            } else {
                $body .= __('projectapplicationcontrollerphp197');
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
            \Log::error(__('projectapplicationcontrollerphp210'), [
                'error' => $e->getMessage()
            ]);
            // Don't fail the whole request if message sending fails
        }

        // Send push notification to applicant
        $pushTitle = $action === 'approve'
            ? __('push.application_approved')
            : __('push.application_rejected');
        SendPushNotificationJob::dispatch(
            [$application->user_id],
            $pushTitle,
            $application->project->name ?? '',
            '/',
            'application'
        );

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
                'message' => __('projectapplicationcontrollerphp252')
            ], 404);
        }

        if (!$projectExists->is_active) {
            return response()->json([
                'message' => __('projectapplicationcontrollerphp258')
            ], 400);
        }

        if (!$projectExists->allow_join_requests) {
            return response()->json([
                'message' => __('projectapplicationcontrollerphp264')
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
                'caption' => $project->getTranslatedCaption(),
                'description' => $project->getTranslatedDescription(),
                'owner' => $project->owner->only(['id', 'name', 'username']),
                'teams_count' => $project->teams->count(),
                'created_at' => $project->created_at,
            ],
            'has_applied' => $hasApplied,
            'application_status' => $applicationStatus,
        ]);
    }
}
