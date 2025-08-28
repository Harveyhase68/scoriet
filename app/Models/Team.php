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
        'project_name',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'project_owner_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(TeamMember::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(TeamInvitation::class);
    }

    public function pendingInvitations(): HasMany
    {
        return $this->hasMany(TeamInvitation::class)->where('status', 'pending');
    }

    public function getMemberCount(): int
    {
        return $this->members()->count();
    }

    public function hasUser(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists();
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
}
