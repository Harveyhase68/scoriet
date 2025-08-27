<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Carbon\Carbon;

class TeamInvitation extends Model
{
    protected $fillable = [
        'team_id',
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

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending' && !$this->isExpired();
    }

    public function isExpired(): bool
    {
        return Carbon::now()->greaterThan($this->expires_at);
    }

    public function accept(): bool
    {
        if (!$this->isPending()) {
            return false;
        }

        // Find the user by unique ID
        $user = User::where('username', $this->invited_user_id)->first();
        if (!$user) {
            return false;
        }

        // Check if user is already a member
        if ($this->team->hasUser($user)) {
            $this->update([
                'status' => 'declined',
                'responded_at' => Carbon::now()
            ]);
            return false;
        }

        // Create team membership
        TeamMember::create([
            'team_id' => $this->team_id,
            'user_id' => $user->id,
            'role' => $this->role,
            'joined_at' => Carbon::now()
        ]);

        // Update invitation status
        $this->update([
            'status' => 'accepted',
            'responded_at' => Carbon::now()
        ]);

        return true;
    }

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

    public function markExpired(): void
    {
        if ($this->status === 'pending') {
            $this->update(['status' => 'expired']);
        }
    }
}
