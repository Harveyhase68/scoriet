<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    // use HasFactory, Notifiable;
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'username', // GitHub-style unique username
        'user_type',
        'premium_expires_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'premium_expires_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Team relationships
    public function ownedTeams(): HasMany
    {
        return $this->hasMany(Team::class, 'project_owner_id');
    }

    public function teamMemberships(): HasMany
    {
        return $this->hasMany(TeamMember::class);
    }

    public function teamInvitations(): HasMany
    {
        return $this->hasMany(TeamInvitation::class, 'invited_by');
    }

    public function receivedInvitations()
    {
        return TeamInvitation::where('invited_user_id', $this->username ?? $this->name)
                            ->where('status', 'pending');
    }

    public function teams()
    {
        return $this->belongsToMany(Team::class, 'team_members', 'user_id', 'team_id')
                    ->withPivot('role', 'joined_at')
                    ->withTimestamps();
    }

    public function isTeamOwner(Team $team): bool
    {
        return (string)$team->project_owner_id === (string)$this->id;
    }

    public function getTeamRole(Team $team): ?string
    {
        return $team->getUserRole($this);
    }

    // Project applications relationship
    public function projectApplications(): HasMany
    {
        return $this->hasMany(ProjectApplication::class);
    }

    // Project memberships relationship
    public function projectMemberships(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    // Project invitations received
    public function projectInvitations(): HasMany
    {
        return $this->hasMany(ProjectInvitation::class, 'invited_user_id');
    }

    // Project invitations sent by this user
    public function sentProjectInvitations(): HasMany
    {
        return $this->hasMany(ProjectInvitation::class, 'invited_by');
    }

    // Get all projects this user is a member of (not owner)
    public function memberProjects()
    {
        return $this->belongsToMany(Project::class, 'project_members', 'user_id', 'project_id')
                   ->withPivot(['role', 'joined_at', 'invited_by'])
                   ->withTimestamps();
    }

    // Check if user is a member of a specific project
    public function isMemberOf(Project $project): bool
    {
        return $this->projectMemberships()->where('project_id', $project->id)->exists();
    }

    // Get user's role in a specific project
    public function getProjectRole(Project $project): ?string
    {
        $membership = $this->projectMemberships()->where('project_id', $project->id)->first();
        return $membership ? $membership->role : null;
    }

    // Check if user can manage a specific project
    public function canManageProject(Project $project): bool
    {
        // Project owner can always manage
        if ((string)$project->owner_id === (string)$this->id) {
            return true;
        }

        // Project admin members can manage
        $membership = $this->projectMemberships()->where('project_id', $project->id)->first();
        return $membership && $membership->isAdmin();
    }

    // Premium user methods
    public function isPremium(): bool
    {
        return $this->user_type === 'premium' && 
               ($this->premium_expires_at === null || $this->premium_expires_at->isFuture());
    }

    /**
     * Find user for Passport authentication - supports both email and username
     * This method is called by Laravel Passport during authentication
     */
    public function findForPassport($username)
    {
        // Since our CustomTokenController already converts username to email,
        // this method should just find by email
        return static::where('email', $username)->first();
    }

    public function isAdmin(): bool
    {
        return $this->user_type === 'admin';
    }

    public function canCreatePrivateProjects(): bool
    {
        return $this->isPremium() || $this->isAdmin();
    }
}
