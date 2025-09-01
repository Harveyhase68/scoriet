<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'owner_id',
        'is_active',
        'is_public',
        'join_code',
        'allow_join_requests',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_public' => 'boolean',
        'allow_join_requests' => 'boolean',
        'settings' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $with = ['owner'];

    /**
     * Get the owner of the project
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get teams associated with this project through pivot table
     */
    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class, 'project_teams', 'project_id', 'team_id')
                    ->withPivot('assigned_at', 'assigned_by')
                    ->withTimestamps()
                    ->orderBy('assigned_at', 'desc');
    }

    /**
     * Get templates associated with this project
     * Note: Templates table structure unknown - might not exist yet
     */
    public function templates()
    {
        // For now, return empty collection since templates table structure is unknown
        return collect([]);
    }

    /**
     * Get databases associated with this project  
     * Note: Database table structure unknown - might not exist yet
     */
    public function databases()
    {
        // For now, return empty collection since database table structure is unknown
        return collect([]);
    }

    /**
     * Scope for active projects
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for projects owned by a user
     */
    public function scopeOwnedBy($query, $userId)
    {
        return $query->where('owner_id', $userId);
    }

    /**
     * Get project applications
     */
    public function applications(): HasMany
    {
        return $this->hasMany(ProjectApplication::class);
    }

    /**
     * Get pending applications
     */
    public function pendingApplications(): HasMany
    {
        return $this->hasMany(ProjectApplication::class)->where('status', 'pending');
    }

    /**
     * Generate a unique join code
     */
    public function generateJoinCode(): string
    {
        do {
            $code = 'PROJ-' . strtoupper(\Str::random(8));
        } while (self::where('join_code', $code)->exists());

        $this->join_code = $code;
        $this->save();

        return $code;
    }

    /**
     * Scopes for visibility
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    public function scopePrivate($query)
    {
        return $query->where('is_public', false);
    }

    public function scopeVisibleTo($query, $user = null)
    {
        if (!$user) {
            return $query->where('is_public', true);
        }

        return $query->where(function ($q) use ($user) {
            $q->where('is_public', true)
              ->orWhere('owner_id', $user->id)
              ->orWhereHas('teams.members', function ($teamQuery) use ($user) {
                  $teamQuery->where('user_id', $user->id);
              });
        });
    }

    /**
     * Check if user can create private projects
     */
    public function canCreatePrivate($user): bool
    {
        return $user && in_array($user->user_type, ['premium', 'admin']);
    }

    /**
     * Get counts for dashboard
     */
    public function getCounts()
    {
        return [
            'teams_count' => $this->teams()->count(),
            'applications_count' => $this->pendingApplications()->count(),
            'templates_count' => 0, // Templates not implemented yet
            'databases_count' => 0, // Databases not implemented yet
        ];
    }
}
