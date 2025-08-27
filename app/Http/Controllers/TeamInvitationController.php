<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class TeamInvitationController extends Controller
{

    /**
     * Send team invitation
     */
    public function store(Request $request, Team $team): JsonResponse
    {
        $user = Auth::user();
        $userRole = $team->getUserRole($user);

        // Check permissions - only owners and admins can invite
        if (!in_array($userRole, ['owner', 'admin'])) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $validator = Validator::make($request->all(), [
            'invited_user_id' => 'required|string|max:255',
            'invited_email' => 'nullable|email|max:255',
            'role' => 'required|in:admin,member',
            'message' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if user is already a member
        $existingUser = User::where('username', $request->invited_user_id)->first();
        if ($existingUser && $team->hasUser($existingUser)) {
            return response()->json(['message' => 'User is already a team member'], 400);
        }

        // Check if there's already a pending invitation
        $existingInvitation = TeamInvitation::where('team_id', $team->id)
                                          ->where('invited_user_id', $request->invited_user_id)
                                          ->where('status', 'pending')
                                          ->first();

        if ($existingInvitation && !$existingInvitation->isExpired()) {
            return response()->json(['message' => 'User already has a pending invitation'], 400);
        }

        // Create invitation
        $invitation = TeamInvitation::create([
            'team_id' => $team->id,
            'invited_by' => $user->id,
            'invited_user_id' => $request->invited_user_id,
            'invited_email' => $request->invited_email,
            'role' => $request->role,
            'message' => $request->message,
        ]);

        return response()->json([
            'message' => 'Invitation sent successfully',
            'invitation' => $invitation->load(['team', 'inviter'])
        ], 201);
    }

    /**
     * Get user's received invitations
     */
    public function received(): JsonResponse
    {
        $user = Auth::user();
        $username = $user->username ?? $user->name;

        $invitations = TeamInvitation::where('invited_user_id', $username)
                                   ->where('status', 'pending')
                                   ->with(['team.owner', 'inviter'])
                                   ->get()
                                   ->filter(function($invitation) {
                                       return !$invitation->isExpired();
                                   });

        return response()->json([
            'invitations' => $invitations->values()
        ]);
    }

    /**
     * Get team's sent invitations
     */
    public function teamInvitations(Team $team): JsonResponse
    {
        $user = Auth::user();
        $userRole = $team->getUserRole($user);

        // Check permissions
        if (!in_array($userRole, ['owner', 'admin'])) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $invitations = $team->invitations()->with('inviter')->get();

        return response()->json([
            'invitations' => $invitations
        ]);
    }

    /**
     * Accept invitation
     */
    public function accept(string $token): JsonResponse
    {
        $invitation = TeamInvitation::where('token', $token)->first();

        if (!$invitation) {
            return response()->json(['message' => 'Invalid invitation token'], 404);
        }

        $user = Auth::user();
        $username = $user->username ?? $user->name;

        // Check if this invitation is for the current user
        if ($invitation->invited_user_id !== $username) {
            return response()->json(['message' => 'This invitation is not for you'], 403);
        }

        if (!$invitation->accept()) {
            if ($invitation->isExpired()) {
                return response()->json(['message' => 'Invitation has expired'], 400);
            }
            return response()->json(['message' => 'Unable to accept invitation'], 400);
        }

        return response()->json([
            'message' => 'Invitation accepted successfully',
            'team' => $invitation->team->load(['members.user'])
        ]);
    }

    /**
     * Decline invitation
     */
    public function decline(string $token): JsonResponse
    {
        $invitation = TeamInvitation::where('token', $token)->first();

        if (!$invitation) {
            return response()->json(['message' => 'Invalid invitation token'], 404);
        }

        $user = Auth::user();
        $username = $user->username ?? $user->name;

        // Check if this invitation is for the current user
        if ($invitation->invited_user_id !== $username) {
            return response()->json(['message' => 'This invitation is not for you'], 403);
        }

        if (!$invitation->decline()) {
            return response()->json(['message' => 'Unable to decline invitation'], 400);
        }

        return response()->json(['message' => 'Invitation declined']);
    }

    /**
     * Cancel invitation (by team admin/owner)
     */
    public function cancel(Team $team, TeamInvitation $invitation): JsonResponse
    {
        $user = Auth::user();
        $userRole = $team->getUserRole($user);

        // Check permissions and ownership
        if (!in_array($userRole, ['owner', 'admin']) || $invitation->team_id !== $team->id) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        if ($invitation->status !== 'pending') {
            return response()->json(['message' => 'Can only cancel pending invitations'], 400);
        }

        $invitation->update(['status' => 'expired']);

        return response()->json(['message' => 'Invitation cancelled']);
    }

    /**
     * Resend invitation
     */
    public function resend(Team $team, TeamInvitation $invitation): JsonResponse
    {
        $user = Auth::user();
        $userRole = $team->getUserRole($user);

        // Check permissions and ownership
        if (!in_array($userRole, ['owner', 'admin']) || $invitation->team_id !== $team->id) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        if ($invitation->status !== 'pending' && $invitation->status !== 'expired') {
            return response()->json(['message' => 'Can only resend pending or expired invitations'], 400);
        }

        // Update invitation with new token and expiry
        $invitation->update([
            'status' => 'pending',
            'token' => \Illuminate\Support\Str::random(64),
            'expires_at' => now()->addDays(7),
            'updated_at' => now()
        ]);

        return response()->json([
            'message' => 'Invitation resent successfully',
            'invitation' => $invitation->load(['team', 'inviter'])
        ]);
    }
}
