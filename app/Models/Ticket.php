<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ticket extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'description',
        'priority',
        'status',
        'credits_cost',
        'assigned_to',
        'resolved_at',
        'closed_at',
    ];

    protected $casts = [
        'credits_cost' => 'integer',
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Determine credit cost based on type and user
     */
    public static function calculateCreditCost(string $type, User $user): int
    {
        // Bug reports are always free
        if ($type === 'bug_report') {
            return 0;
        }

        // Patron users get 5 free tickets per month
        if ($user->isPatron()) {
            $currentMonth = now()->startOfMonth();
            $usedTickets = self::where('user_id', $user->id)
                ->where('type', '!=', 'bug_report')
                ->where('credits_cost', 0) // Free tickets
                ->where('created_at', '>=', $currentMonth)
                ->count();

            if ($usedTickets < 5) {
                return 0; // Free ticket for patron
            }
        }

        // Support/Consulting tickets cost 10 credits (~€1.20)
        return 10;
    }
}
