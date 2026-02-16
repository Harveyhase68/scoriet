<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use App\Mail\ProjectInvitationMail;

class ProjectInvitationController extends Controller
{
    /**
     * Send a project invitation
     */
    public function sendInvitation(Request $request, Project $project): JsonResponse
    {
        $user = Auth::user();

        // Check if user can manage this project
        if (!$project->userCanManage($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255',
            'role' => 'required|in:member,admin',
            'message' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $email = $request->email;
        $role = $request->role;
        $message = $request->message;

        // Check if user is already a project member
        $existingUser = User::where('email', $email)->first();
        if ($existingUser && $project->hasMember($existingUser)) {
            return response()->json([
                'message' => 'User is already a member of this project'
            ], 422);
        }

        // Check if there's already a pending invitation
        $existingInvitation = $project->pendingInvitations()
            ->where('invited_email', $email)
            ->first();

        if ($existingInvitation) {
            return response()->json([
                'message' => 'An invitation has already been sent to this email address'
            ], 422);
        }

        // Create the invitation
        $invitation = ProjectInvitation::create([
            'project_id' => $project->id,
            'invited_by' => $user->id,
            'invited_user_id' => $existingUser ? $existingUser->id : null,
            'invited_email' => $email,
            'role' => $role,
            'message' => $message,
        ]);

        // Send the invitation email
        try {
            Mail::to($email)->send(new ProjectInvitationMail($invitation));
        } catch (\Exception $e) {
            // Log the error but don't fail the invitation creation
            \Log::error('Failed to send project invitation email', [
                'invitation_id' => $invitation->id,
                'email' => $email,
                'error' => $e->getMessage()
            ]);
        }

        return response()->json([
            'message' => 'Invitation sent successfully',
            'invitation' => $invitation->load(['project', 'inviter', 'invitedUser'])
        ], 201);
    }

    /**
     * Get invitation information without accepting/declining
     */
    public function getInvitationInfo(string $token): JsonResponse
    {
        $invitation = ProjectInvitation::with(['project.owner', 'inviter'])
            ->where('token', $token)
            ->first();

        if (!$invitation) {
            return response()->json(['message' => 'Invalid invitation token'], 404);
        }

        if ($invitation->isExpired()) {
            return response()->json(['message' => 'This invitation has expired'], 422);
        }

        if ($invitation->status !== 'pending') {
            $statusMessage = match($invitation->status) {
                'accepted' => 'This invitation has already been accepted',
                'declined' => 'This invitation has already been declined',
                'expired' => 'This invitation has expired',
                default => 'This invitation is no longer valid'
            };
            
            return response()->json(['message' => $statusMessage], 422);
        }

        // Check if user with this email exists
        $userExists = \App\Models\User::where('email', $invitation->invited_email)->exists();

        return response()->json([
            'invitation' => $invitation,
            'user_exists' => $userExists
        ]);
    }

    /**
     * Accept a project invitation
     */
    public function acceptInvitation(Request $request, string $token): JsonResponse
    {
        $invitation = ProjectInvitation::where('token', $token)->first();

        if (!$invitation) {
            return response()->json(['message' => 'Invalid invitation token'], 404);
        }

        if (!$invitation->isPending()) {
            return response()->json([
                'message' => $invitation->isExpired() ? 'Invitation has expired' : 'Invitation is no longer valid'
            ], 422);
        }

        $success = $invitation->accept();

        if (!$success) {
            return response()->json(['message' => 'Failed to accept invitation'], 422);
        }

        return response()->json([
            'message' => 'Invitation accepted successfully',
            'project' => $invitation->project
        ]);
    }

    /**
     * Decline a project invitation
     */
    public function declineInvitation(Request $request, string $token): JsonResponse
    {
        $invitation = ProjectInvitation::where('token', $token)->first();

        if (!$invitation) {
            return response()->json(['message' => 'Invalid invitation token'], 404);
        }

        if (!$invitation->isPending()) {
            return response()->json([
                'message' => 'Invitation is no longer valid'
            ], 422);
        }

        $success = $invitation->decline();

        if (!$success) {
            return response()->json(['message' => 'Failed to decline invitation'], 422);
        }

        // Send notification email to the inviter
        try {
            $inviterEmail = $invitation->inviter->email;
            // TODO: Send decline notification email
        } catch (\Exception $e) {
            \Log::error('Failed to send decline notification email', [
                'invitation_id' => $invitation->id,
                'error' => $e->getMessage()
            ]);
        }

        return response()->json([
            'message' => 'Invitation declined successfully'
        ]);
    }

    /**
     * Get invitations for a project (for project managers)
     */
    public function getProjectInvitations(Project $project): JsonResponse
    {
        $user = Auth::user();

        if (!$project->userCanManage($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $invitations = $project->invitations()
            ->with(['inviter', 'invitedUser'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($invitations);
    }

    /**
     * Get invitations received by the current user
     */
    public function getMyInvitations(): JsonResponse
    {
        $user = Auth::user();

        $invitations = ProjectInvitation::where('invited_email', $user->email)
            ->orWhere('invited_user_id', $user->id)
            ->with(['project', 'inviter'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($invitations);
    }

    /**
     * Cancel/revoke a project invitation
     */
    public function cancelInvitation(Project $project, ProjectInvitation $invitation): JsonResponse
    {
        $user = Auth::user();

        if (!$project->userCanManage($user)) {
            \Log::warning('Cancel invitation: Unauthorized', [
                'user_id' => $user->id,
                'project_id' => $project->id,
            ]);
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ((int)$invitation->project_id !== (int)$project->id) {
            \Log::warning('Cancel invitation: Wrong project', [
                'invitation_project_id' => $invitation->project_id,
                'requested_project_id' => $project->id,
            ]);
            return response()->json(['message' => 'Invitation does not belong to this project'], 422);
        }

        if ($invitation->status !== 'pending') {
            \Log::warning('Cancel invitation: Not pending', [
                'status' => $invitation->status,
            ]);
            return response()->json(['message' => 'Can only cancel pending invitations'], 422);
        }

        $invitation->update(['status' => 'expired']);

        return response()->json(['message' => 'Invitation cancelled successfully']);
    }

    /**
     * Get the current user's pending invitation
     */
    public function getMyPendingInvitation(): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user->hasPendingInvitation()) {
            return response()->json(['message' => 'No pending invitation'], 404);
        }

        $invitation = $user->pendingProjectInvitation()
            ->with(['project.owner', 'inviter'])
            ->first();

        if (!$invitation) {
            // Clean up if invitation was deleted
            $user->clearPendingInvitation();
            return response()->json(['message' => 'No pending invitation'], 404);
        }

        return response()->json($invitation);
    }

    /**
     * Accept the current user's pending invitation
     */
    public function acceptMyPendingInvitation(): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user->hasPendingInvitation()) {
            return response()->json(['message' => 'No pending invitation'], 404);
        }

        $invitation = $user->pendingProjectInvitation;
        if (!$invitation) {
            $user->clearPendingInvitation();
            return response()->json(['message' => 'No pending invitation'], 404);
        }

        // Accept the invitation
        $success = $invitation->accept();
        
        if (!$success) {
            return response()->json(['message' => 'Failed to accept invitation'], 422);
        }

        // Clear pending invitation from user
        $user->clearPendingInvitation();

        return response()->json([
            'message' => 'Invitation accepted successfully',
            'project' => $invitation->project
        ]);
    }

    /**
     * Decline the current user's pending invitation
     */
    public function declineMyPendingInvitation(): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user->hasPendingInvitation()) {
            return response()->json(['message' => 'No pending invitation'], 404);
        }

        $invitation = $user->pendingProjectInvitation;
        if (!$invitation) {
            $user->clearPendingInvitation();
            return response()->json(['message' => 'No pending invitation'], 404);
        }

        // Decline the invitation
        $invitation->decline();

        // Clear pending invitation from user
        $user->clearPendingInvitation();

        return response()->json(['message' => 'Invitation declined']);
    }
}
