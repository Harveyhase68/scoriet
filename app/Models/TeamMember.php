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

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['owner', 'admin']);
    }

    public function canManageMembers(): bool
    {
        return $this->isAdmin();
    }

    public function canInviteUsers(): bool
    {
        return $this->isAdmin();
    }
}
