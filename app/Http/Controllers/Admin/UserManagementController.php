<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserManagementController extends Controller
{
    /**
     * Get all users (Admin only)
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Check if user is system
        if ($user->user_type !== 'system') {
            return response()->json([
                'message' => 'Unauthorized. System access required.',
            ], 403);
        }

        // Get all users with relevant data
        $users = User::select([
            'id',
            'name',
            'email',
            'username',
            'user_type',
            'is_inner_core',
            'email_verified_at',
            'created_at',
        ])
        ->orderBy('created_at', 'desc')
        ->get();

        // Add additional computed fields
        $users->each(function ($user) {
            $user->is_verified = $user->email_verified_at !== null;
            $user->member_since = $user->created_at->diffForHumans();
            $user->last_login = 'N/A'; // Column doesn't exist yet
        });

        return response()->json([
            'users' => $users,
            'total' => $users->count(),
        ], 200);
    }

    /**
     * Toggle Inner Core status for a user
     */
    public function toggleInnerCore(Request $request, $userId)
    {
        $admin = $request->user();

        // Check if user is system
        if ($admin->user_type !== 'system') {
            return response()->json([
                'message' => 'Unauthorized. System access required.',
            ], 403);
        }

        // Find user
        $user = User::find($userId);
        if (!$user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        // Prevent admin from removing their own inner core status if they have it
        // (This is optional - you can remove this check if you want admins to be able to do this)
        if ($user->id === $admin->id && $user->is_inner_core) {
            return response()->json([
                'message' => 'You cannot remove your own Inner Core status.',
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Toggle is_inner_core
            $user->is_inner_core = !$user->is_inner_core;
            $user->save();

            DB::commit();

            return response()->json([
                'message' => $user->is_inner_core
                    ? "{$user->name} is now an Inner Core Reviewer."
                    : "{$user->name} is no longer an Inner Core Reviewer.",
                'user' => $user->fresh(),
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update user status.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get Inner Core statistics
     */
    public function getInnerCoreStats(Request $request)
    {
        $admin = $request->user();

        // Check if user is system
        if ($admin->user_type !== 'system') {
            return response()->json([
                'message' => 'Unauthorized. System access required.',
            ], 403);
        }

        $totalUsers = User::count();
        $innerCoreCount = User::where('is_inner_core', true)->count();
        $verifiedUsers = User::whereNotNull('email_verified_at')->count();
        $adminCount = User::where('user_type', 'system')->count();

        $innerCoreUsers = User::where('is_inner_core', true)
            ->select('id', 'name', 'email', 'created_at')
            ->get();

        return response()->json([
            'stats' => [
                'total_users' => $totalUsers,
                'inner_core_count' => $innerCoreCount,
                'verified_users' => $verifiedUsers,
                'admin_count' => $adminCount,
            ],
            'inner_core_users' => $innerCoreUsers,
        ], 200);
    }
}
