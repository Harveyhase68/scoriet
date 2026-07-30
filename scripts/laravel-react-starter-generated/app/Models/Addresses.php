<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $table = 'addresses';
    protected $primaryKey = 'addr_id';
    public $timestamps = false;
    protected $hidden = [
    ];

    protected $fillable = [
        'addr_id',
        'addr_no',
        'addr_street',
        'addr_house_number',
        'pc_postal_code',
        'pc_city',
        'pc_state',
        'count_iso2',
        'addr_latitude',
        'addr_longitude',
        'addr_type',
        'addr_is_primary',
        'addr_valid_from',
        'addr_valid_to',
        'addr_full_text',
    ];

    protected function casts(): array
    {
        return [
            'addr_id' => 'integer',
            'addr_no' => 'integer',
            'addr_is_primary' => 'integer',
            'addr_valid_from' => 'date',
            'addr_valid_to' => 'date',
        ];
    }

    public function postalCodes(): BelongsTo
    {
        return $this->belongsTo(PostalCodes::class, 'pc_postal_code', 'pc_postal_code');
    }
    public function countries(): BelongsTo
    {
        return $this->belongsTo(Countries::class, 'count_iso2', 'count_iso2');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('addr_id');
    }
}
