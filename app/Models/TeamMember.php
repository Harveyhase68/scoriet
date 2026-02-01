<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeamMember extends Model
{
    protected $fillable = [
        'team_id',
        'user_id',
        'role',
        'team_role_id',
        'joined_at'
    ];

    protected $casts = [
        'joined_at' => 'datetime'
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the assigned team role
     */
    public function teamRole(): BelongsTo
    {
        return $this->belongsTo(TeamRole::class, 'team_role_id');
    }

    /**
     * Check if member is owner (either by legacy role or by team_role)
     */
    public function isOwner(): bool
    {
        // Check legacy role field
        if ($this->role === 'owner') {
            return true;
        }

        // Check new team role system
        if ($this->teamRole && $this->teamRole->slug === 'owner') {
            return true;
        }

        return false;
    }

    /**
     * Check if member is admin (either by legacy role or by team_role)
     */
    public function isAdmin(): bool
    {
        // Check legacy role field
        if (in_array($this->role, ['owner', 'admin'])) {
            return true;
        }

        // Check new team role system
        if ($this->teamRole && in_array($this->teamRole->slug, ['owner', 'admin'])) {
            return true;
        }

        return false;
    }

    /**
     * Check if member has a specific permission
     */
    public function hasPermission(string $permissionName): bool
    {
        // Owner always has all permissions
        if ($this->isOwner()) {
            return true;
        }

        // Check via team role
        if ($this->teamRole) {
            return $this->teamRole->hasPermission($permissionName);
        }

        // Legacy fallback: admin has most permissions
        if ($this->role === 'admin') {
            return true;
        }

        return false;
    }

    /**
     * Check if member has any of the given permissions
     */
    public function hasAnyPermission(array $permissionNames): bool
    {
        if ($this->isOwner()) {
            return true;
        }

        if ($this->teamRole) {
            return $this->teamRole->hasAnyPermission($permissionNames);
        }

        return $this->role === 'admin';
    }

    /**
     * Check if member has ALL of the given permissions
     */
    public function hasAllPermissions(array $permissionNames): bool
    {
        if ($this->isOwner()) {
            return true;
        }

        foreach ($permissionNames as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }

        return true;
    }

    public function canManageMembers(): bool
    {
        return $this->hasPermission('manage_team') || $this->isAdmin();
    }

    public function canInviteUsers(): bool
    {
        return $this->hasPermission('manage_team') || $this->isAdmin();
    }

    public function canManageRoles(): bool
    {
        return $this->hasPermission('manage_roles') || $this->isOwner();
    }
}
