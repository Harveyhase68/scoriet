<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditTransaction extends Model
{
    protected $fillable = [
        'user_id',
        'amount',
        'type',
        'description',
        'reference_type',
        'reference_id',
        'price_paid',
    ];

    protected $casts = [
        'amount' => 'integer',
        'price_paid' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Helper: Create transaction and update user credits atomically
     */
    public static function createAndUpdateCredits(
        int $userId,
        int $amount,
        string $type,
        ?string $description = null,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?float $pricePaid = null
    ): self {
        $transaction = self::create([
            'user_id' => $userId,
            'amount' => $amount,
            'type' => $type,
            'description' => $description,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'price_paid' => $pricePaid,
        ]);

        // Update user credits
        $user = User::find($userId);
        if ($user) {
            $user->credits += $amount;
            $user->save();
        }

        return $transaction;
    }
}
