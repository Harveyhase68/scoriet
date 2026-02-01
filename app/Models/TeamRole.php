<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TeamRole extends Model
{
    protected $fillable = [
        'team_id',
        'name',
        'slug',
        'description',
        'is_system',
        'sort_order',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Get the team this role belongs to (null = system default)
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * Get the permissions assigned to this role
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'team_role_permissions', 'team_role_id', 'permission_id')
            ->withTimestamps();
    }

    /**
     * Get team members with this role
     */
    public function teamMembers(): HasMany
    {
        return $this->hasMany(TeamMember::class, 'team_role_id');
    }

    /**
     * Check if role has a specific permission
     */
    public function hasPermission(string $permissionName): bool
    {
        // Owner role always has all permissions
        if ($this->slug === 'owner') {
            return true;
        }

        return $this->permissions()->where('name', $permissionName)->exists();
    }

    /**
     * Check if role has any of the given permissions
     */
    public function hasAnyPermission(array $permissionNames): bool
    {
        if ($this->slug === 'owner') {
            return true;
        }

        return $this->permissions()->whereIn('name', $permissionNames)->exists();
    }

    /**
     * Check if role has all of the given permissions
     */
    public function hasAllPermissions(array $permissionNames): bool
    {
        if ($this->slug === 'owner') {
            return true;
        }

        $count = $this->permissions()->whereIn('name', $permissionNames)->count();
        return $count === count($permissionNames);
    }

    /**
     * Sync permissions for this role
     */
    public function syncPermissions(array $permissionIds): void
    {
        $this->permissions()->sync($permissionIds);
    }

    /**
     * Get system default roles (team_id = null)
     */
    public static function getSystemRoles()
    {
        return static::whereNull('team_id')
            ->where('is_system', true)
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * Get roles for a specific team (only team-specific roles)
     * Note: System default roles (team_id = null) are now copied to each team on creation
     */
    public static function getRolesForTeam(int $teamId)
    {
        return static::where('team_id', $teamId)
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * Copy a system role to a team-specific role
     */
    public static function copyToTeam(TeamRole $systemRole, int $teamId): TeamRole
    {
        $newRole = static::create([
            'team_id' => $teamId,
            'name' => $systemRole->name,
            'slug' => $systemRole->slug,
            'description' => $systemRole->description,
            'is_system' => false,
            'sort_order' => $systemRole->sort_order,
        ]);

        // Copy permissions
        $permissionIds = $systemRole->permissions()->pluck('permissions.id')->toArray();
        $newRole->syncPermissions($permissionIds);

        return $newRole;
    }
}
