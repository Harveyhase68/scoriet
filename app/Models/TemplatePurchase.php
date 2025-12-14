<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TemplatePurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'buyer_user_id',
        'seller_user_id',
        'template_id',
        'payment_type',
        'price_credits',
        'price_euros',
        'seller_credits',
        'seller_euros',
        'platform_credits',
        'platform_euros',
        'credit_transaction_id',
        'stripe_payment_id',
        'paypal_payment_id',
        // Payout tracking fields
        'is_paid_out',
        'payout_id',
        'paid_out_at',
        'seller_earnings',
        'platform_fee',
    ];

    protected $casts = [
        'price_credits' => 'integer',
        'price_euros' => 'decimal:2',
        'seller_credits' => 'integer',
        'seller_euros' => 'decimal:2',
        'platform_credits' => 'integer',
        'platform_euros' => 'decimal:2',
        // Payout tracking casts
        'is_paid_out' => 'boolean',
        'paid_out_at' => 'datetime',
        'seller_earnings' => 'decimal:2',
        'platform_fee' => 'decimal:2',
    ];

    /**
     * Get the buyer user.
     */
    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_user_id');
    }

    /**
     * Get the seller user.
     */
    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_user_id');
    }

    /**
     * Get the purchased template.
     */
    public function template()
    {
        return $this->belongsTo(Template::class);
    }

    /**
     * Get the credit transaction associated with this purchase.
     */
    public function creditTransaction()
    {
        return $this->belongsTo(CreditTransaction::class);
    }

    /**
     * Check if a user has purchased a specific template.
     */
    public static function hasPurchased(int $userId, int $templateId): bool
    {
        return self::where('buyer_user_id', $userId)
            ->where('template_id', $templateId)
            ->exists();
    }

    /**
     * Scope a query to get purchases for a specific user (as buyer).
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('buyer_user_id', $userId);
    }

    /**
     * Scope a query to get sales for a specific user (as seller).
     */
    public function scopeSoldBy($query, int $userId)
    {
        return $query->where('seller_user_id', $userId);
    }

    /**
     * Scope for credit payments.
     */
    public function scopeCreditPayments($query)
    {
        return $query->where('payment_type', 'credits');
    }

    /**
     * Scope for euro payments.
     */
    public function scopeEuroPayments($query)
    {
        return $query->where('payment_type', 'euros');
    }

    /**
     * Check if this purchase was made with credits.
     */
    public function isPaidWithCredits(): bool
    {
        return $this->payment_type === 'credits';
    }

    /**
     * Check if this purchase was made with euros.
     */
    public function isPaidWithEuros(): bool
    {
        return $this->payment_type === 'euros';
    }

    /**
     * Get the total price (either credits or euros).
     */
    public function getTotalPriceAttribute(): float
    {
        return $this->isPaidWithCredits()
            ? (float) $this->price_credits
            : (float) $this->price_euros;
    }

    /**
     * Get the seller's revenue (either credits or euros).
     */
    public function getSellerRevenueAttribute(): float
    {
        return $this->isPaidWithCredits()
            ? (float) $this->seller_credits
            : (float) $this->seller_euros;
    }

    /**
     * Get the platform fee (either credits or euros).
     */
    public function getPlatformFeeAttribute(): float
    {
        return $this->isPaidWithCredits()
            ? (float) $this->platform_credits
            : (float) $this->platform_euros;
    }

    /**
     * Get formatted price string.
     */
    public function getFormattedPriceAttribute(): string
    {
        if ($this->isPaidWithCredits()) {
            return $this->price_credits . ' Credits';
        }

        return number_format($this->price_euros, 2) . ' EUR';
    }
}
