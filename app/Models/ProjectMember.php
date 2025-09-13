<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectMember extends Model
{
    protected $fillable = [
        'project_id',
        'user_id',
        'role',
        'joined_at',
        'invited_by',
        'notes'
    ];

    protected $casts = [
        'joined_at' => 'datetime'
    ];

    /**
     * Get the project this membership belongs to
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the user who is a member
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who invited this member
     */
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * Check if this member is a project owner
     */
    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    /**
     * Check if this member is a project admin
     */
    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'owner']);
    }

    /**
     * Check if this member can manage the project
     */
    public function canManageProject(): bool
    {
        return $this->isAdmin();
    }

    /**
     * Check if this member can manage team assignments
     */
    public function canManageTeams(): bool
    {
        return $this->isAdmin();
    }
}
