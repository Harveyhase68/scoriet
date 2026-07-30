<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $table = 'customer_contacts';
    protected $primaryKey = 'cc_id';
    public $timestamps = false;


    protected $fillable = [
        'cc_id',
        'cc_no',
        'cust_no',
        'cont_no',
        'cc_cont_is_primary',
    ];

    protected function casts(): array
    {
        return [
            'cc_id' => 'integer',
            'cc_no' => 'integer',
            'cust_no' => 'integer',
            'cont_no' => 'integer',
            'cc_cont_is_primary' => 'integer',
        ];
    }

    public function contacts(): BelongsTo
    {
        return $this->belongsTo(Contacts::class, 'cont_no', 'cont_no');
    }
    public function customers(): BelongsTo
    {
        return $this->belongsTo(Customers::class, 'cust_no', 'cust_no');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('cc_id');
    }
}
