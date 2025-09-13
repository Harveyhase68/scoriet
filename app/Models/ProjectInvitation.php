<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ProjectInvitation extends Model
{
    protected $fillable = [
        'project_id',
        'invited_by',
        'invited_user_id',
        'invited_email',
        'role',
        'status',
        'message',
        'token',
        'expires_at',
        'responded_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'responded_at' => 'datetime'
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($invitation) {
            $invitation->token = Str::random(64);
            $invitation->expires_at = Carbon::now()->addDays(7); // Expire after 7 days
        });
    }

    /**
     * Get the project this invitation belongs to
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the user who sent this invitation
     */
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * Get the invited user (if they have an account)
     */
    public function invitedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_user_id');
    }

    /**
     * Check if the invitation is pending and not expired
     */
    public function isPending(): bool
    {
        return $this->status === 'pending' && !$this->isExpired();
    }

    /**
     * Check if the invitation has expired
     */
    public function isExpired(): bool
    {
        return Carbon::now()->greaterThan($this->expires_at);
    }

    /**
     * Accept the project invitation
     */
    public function accept(): bool
    {
        if (!$this->isPending()) {
            return false;
        }

        // Find user by email if not already linked
        $user = $this->invitedUser;
        if (!$user) {
            $user = User::where('email', $this->invited_email)->first();
        }

        if (!$user) {
            return false;
        }

        // Check if user is already a project member
        if ($this->project->hasMember($user)) {
            $this->update([
                'status' => 'declined',
                'responded_at' => Carbon::now()
            ]);
            return false;
        }

        // Create project membership
        ProjectMember::create([
            'project_id' => $this->project_id,
            'user_id' => $user->id,
            'role' => $this->role,
            'joined_at' => Carbon::now(),
            'invited_by' => $this->invited_by
        ]);

        // Update invitation status
        $this->update([
            'status' => 'accepted',
            'responded_at' => Carbon::now()
        ]);

        return true;
    }

    /**
     * Decline the project invitation
     */
    public function decline(): bool
    {
        if (!$this->isPending()) {
            return false;
        }

        $this->update([
            'status' => 'declined',
            'responded_at' => Carbon::now()
        ]);

        return true;
    }

    /**
     * Mark invitation as expired
     */
    public function markExpired(): void
    {
        if ($this->status === 'pending') {
            $this->update(['status' => 'expired']);
        }
    }

    /**
     * Generate the accept URL for the invitation
     */
    public function getAcceptUrl(): string
    {
        return route('project-invitations.accept', ['token' => $this->token]);
    }

    /**
     * Generate the decline URL for the invitation
     */
    public function getDeclineUrl(): string
    {
        return route('project-invitations.decline', ['token' => $this->token]);
    }
}
