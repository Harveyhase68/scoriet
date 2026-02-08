<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VisitorLog extends Model
{
    protected $fillable = [
        'user_id',
        'ip_address',
        'session_id',
        'page_url',
        'referrer',
        'user_agent',
        'is_authenticated',
        'visited_date',
    ];

    protected $casts = [
        'is_authenticated' => 'boolean',
        'visited_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
