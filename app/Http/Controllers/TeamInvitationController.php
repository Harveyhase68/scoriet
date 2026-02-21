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
            return response()->json(['message' => __('teaminvitationcontrollerphp26')], 403);
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
            return response()->json(['message' => __('teaminvitationcontrollerphp46')], 400);
        }

        // Check if there's already a pending invitation
        $existingInvitation = TeamInvitation::where('team_id', $team->id)
                                          ->where('invited_user_id', $request->invited_user_id)
                                          ->where('status', 'pending')
                                          ->first();

        if ($existingInvitation && !$existingInvitation->isExpired()) {
            return response()->json(['message' => __('teaminvitationcontrollerphp56')], 400);
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
            'message' => __('teaminvitationcontrollerphp70'),
            'invitation' => $invitation->load(['team', 'inviter'])
        ], 201);
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
            return response()->json(['message' => __('teaminvitationcontrollerphp106')], 403);
        }

        $invitations = $team->invitations()->with('inviter')->get();

        return response()->json([
            'invitations' => $invitations
        ]);
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
            return response()->json(['message' => __('teaminvitationcontrollerphp105')], 403);
        }

        if ($invitation->status !== 'pending') {
            return response()->json(['message' => __('teaminvitationcontrollerphp109')], 400);
        }

        $invitation->update(['status' => 'expired']);

        return response()->json(['message' => __('teaminvitationcontrollerphp114')]);
    }

}
