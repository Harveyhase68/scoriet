<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $table = 'customers';
    protected $primaryKey = 'cust_id';
    public $timestamps = false;
    protected $hidden = [
    ];

    protected $fillable = [
        'cust_id',
        'cust_no',
        'cust_first_name',
        'cust_last_name',
        'cust_full_name',
        'comp_no',
        'cust_email',
        'cust_phone',
        'cust_mobile',
        'cust_website',
        'cust_vat_number',
        'cust_tax_id',
        'cust_legal_form',
        'cust_status',
        'cust_segment',
        'cust_source',
        'cust_language',
        'cust_currency',
        'cust_credit_limit',
        'cust_balance',
        'cust_payment_terms',
        'cust_marketing_opt_in',
        'cust_marketing_channel',
        'cust_preferred_contact_time',
        'cust_notes',
        'cust_created_at',
        'cust_updated_at',
    ];

    protected function casts(): array
    {
        return [
            'cust_id' => 'integer',
            'cust_no' => 'integer',
            'comp_no' => 'integer',
            'cust_marketing_opt_in' => 'integer',
            'cust_created_at' => 'datetime',
            'cust_updated_at' => 'datetime',
        ];
    }

    public function companies(): BelongsTo
    {
        return $this->belongsTo(Companies::class, 'comp_no', 'comp_no');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('cust_id');
    }
}
