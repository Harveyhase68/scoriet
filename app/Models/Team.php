<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Team extends Model
{
    protected $fillable = [
        'name',
        'description',
        'project_owner_id',
        'is_active'
    ];

    protected $casts = [
        // See note on Project::$casts re: BIGINT-as-string from MariaDB/PDO.
        'project_owner_id' => 'integer',
        'is_active' => 'boolean'
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        // Automatically copy default roles when a team is created
        static::created(function (Team $team) {
            $team->copyDefaultRoles();
        });
    }

    /**
     * Get roles for this team
     */
    public function roles(): HasMany
    {
        return $this->hasMany(TeamRole::class)->orderBy('sort_order');
    }

    /**
     * Copy default system roles to this team
     */
    public function copyDefaultRoles(): void
    {
        $systemRoles = TeamRole::getSystemRoles();

        foreach ($systemRoles as $systemRole) {
            // Check if role with this slug already exists for this team
            $exists = TeamRole::where('team_id', $this->id)
                ->where('slug', $systemRole->slug)
                ->exists();

            if (!$exists) {
                TeamRole::copyToTeam($systemRole, $this->id);
            }
        }
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'project_owner_id');
    }


    public function members(): HasMany
    {
        return $this->hasMany(TeamMember::class);
    }

    // Team invitations functionality removed
    // public function invitations(): HasMany
    // {
    //     return $this->hasMany(TeamInvitation::class);
    // }

    // public function pendingInvitations(): HasMany
    // {
    //     return $this->hasMany(TeamInvitation::class)->where('status', 'pending');
    // }

    public function getMemberCount(): int
    {
        return $this->members()->count();
    }

    public function hasUser(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists();
    }

    public function isMember(int $userId): bool
    {
        return $this->members()->where('user_id', $userId)->exists();
    }

    public function getUserRole(User $user): ?string
    {
        $member = $this->members()->where('user_id', $user->id)->first();
        return $member?->role;
    }

    /**
     * Get projects this team is assigned to
     */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_teams', 'team_id', 'project_id')
                    ->withPivot('assigned_at', 'assigned_by')
                    ->withTimestamps()
                    ->orderBy('assigned_at', 'desc');
    }

    /**
     * Get the subscription for this team
     */
    public function subscription()
    {
        return $this->hasOne(Subscription::class, 'entity_id')
                    ->where('subscription_type', Subscription::TYPE_TEAM);
    }
}
