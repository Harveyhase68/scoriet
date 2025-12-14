<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayoutItem extends Model
{
    protected $fillable = [
        'payout_id',
        'template_purchase_id',
        'sale_amount',
        'seller_share',
        'platform_share',
        'vat_deducted',
    ];

    protected $casts = [
        'sale_amount' => 'decimal:2',
        'seller_share' => 'decimal:2',
        'platform_share' => 'decimal:2',
        'vat_deducted' => 'decimal:2',
    ];

    /**
     * Get the payout this item belongs to.
     */
    public function payout(): BelongsTo
    {
        return $this->belongsTo(Payout::class);
    }

    /**
     * Get the template purchase this item refers to.
     */
    public function purchase(): BelongsTo
    {
        return $this->belongsTo(TemplatePurchase::class, 'template_purchase_id');
    }
}
