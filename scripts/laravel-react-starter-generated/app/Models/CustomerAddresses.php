<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $table = 'customer_addresses';
    protected $primaryKey = 'ca_i';
    public $timestamps = false;


    protected $fillable = [
        'ca_i',
        'ca_no',
        'cust_no',
        'addr_no',
        'ca_addr_type',
    ];

    protected function casts(): array
    {
        return [
            'ca_i' => 'integer',
            'ca_no' => 'integer',
            'cust_no' => 'integer',
            'addr_no' => 'integer',
        ];
    }

    public function addresses(): BelongsTo
    {
        return $this->belongsTo(Addresses::class, 'addr_no', 'addr_no');
    }
    public function customers(): BelongsTo
    {
        return $this->belongsTo(Customers::class, 'cust_no', 'cust_no');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('ca_i');
    }
}
