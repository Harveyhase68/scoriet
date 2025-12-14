<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payout extends Model
{
    protected $fillable = [
        'user_id',
        'period_start',
        'period_end',
        'gross_amount',
        'platform_fee',
        'vat_amount',
        'net_amount',
        'seller_type',
        'payout_method',
        'payout_destination',
        'status',
        'transaction_id',
        'transaction_details',
        'failure_reason',
        'processed_at',
        'completed_at',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'gross_amount' => 'decimal:2',
        'platform_fee' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'transaction_details' => 'array',
        'processed_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_CANCELLED = 'cancelled';

    // Seller type constants
    const SELLER_AT_BUSINESS = 'at_business';
    const SELLER_EU_VAT = 'eu_vat';
    const SELLER_EU_PRIVATE = 'eu_private';
    const SELLER_NON_EU_BUSINESS = 'non_eu_business';
    const SELLER_NON_EU_PRIVATE = 'non_eu_private';

    // Payout method constants
    const METHOD_BANK_TRANSFER = 'bank_transfer';
    const METHOD_PAYPAL = 'paypal';

    /**
     * Get the user (seller) this payout belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the items (individual sales) in this payout.
     */
    public function items(): HasMany
    {
        return $this->hasMany(PayoutItem::class);
    }

    /**
     * Calculate payout amounts based on seller type.
     * Platform fee: 20%
     * Seller share: 80%
     * VAT: 20% (deducted from seller share for private sellers without business proof)
     */
    public static function calculatePayoutAmounts(float $grossAmount, string $sellerType): array
    {
        $platformFee = $grossAmount * 0.20; // 20% to platform
        $sellerShare = $grossAmount * 0.80; // 80% to seller

        $vatAmount = 0;
        $netAmount = $sellerShare;

        // For private sellers (EU or non-EU without business proof), deduct VAT
        if (in_array($sellerType, [self::SELLER_EU_PRIVATE, self::SELLER_NON_EU_PRIVATE])) {
            // Deduct 20% VAT from seller share
            // 80€ - (80€ / 1.20 * 0.20) = 80€ - 13.33€ = 66.67€
            // Or simpler: 80€ / 1.20 = 66.67€ net
            $vatAmount = $sellerShare - ($sellerShare / 1.20);
            $netAmount = $sellerShare / 1.20;
        }

        return [
            'gross_amount' => round($grossAmount, 2),
            'platform_fee' => round($platformFee, 2),
            'vat_amount' => round($vatAmount, 2),
            'net_amount' => round($netAmount, 2),
            'seller_share_before_vat' => round($sellerShare, 2),
        ];
    }

    /**
     * Mark payout as processing.
     */
    public function markAsProcessing(): void
    {
        $this->update([
            'status' => self::STATUS_PROCESSING,
            'processed_at' => now(),
        ]);
    }

    /**
     * Mark payout as completed.
     */
    public function markAsCompleted(string $transactionId, array $transactionDetails = []): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'transaction_id' => $transactionId,
            'transaction_details' => $transactionDetails,
            'completed_at' => now(),
        ]);

        // Mark all related purchases as paid out
        $this->items->each(function ($item) {
            $item->purchase->update([
                'is_paid_out' => true,
                'payout_id' => $this->id,
                'paid_out_at' => now(),
            ]);
        });

        // Update user's pending earnings
        $this->user->decrement('pending_earnings', $this->gross_amount);
    }

    /**
     * Mark payout as failed.
     */
    public function markAsFailed(string $reason): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'failure_reason' => $reason,
        ]);
    }

    /**
     * Scope for pending payouts.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope for completed payouts.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope for bank transfer payouts.
     */
    public function scopeBankTransfer($query)
    {
        return $query->where('payout_method', self::METHOD_BANK_TRANSFER);
    }

    /**
     * Scope for PayPal payouts.
     */
    public function scopePaypal($query)
    {
        return $query->where('payout_method', self::METHOD_PAYPAL);
    }
}
