<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $table = 'countries';
    protected $primaryKey = 'count_id';
    public $timestamps = false;
    protected $hidden = [
    ];

    protected $fillable = [
        'count_id',
        'count_iso2',
        'count_iso3',
        'count_name',
        'count_official_name',
        'count_currency_code',
        'count_currency_name',
        'count_phone_code',
        'count_region',
        'count_subregion',
        'count_eu_member',
        'count_default_vat',
        'count_timezones',
        'count_address_format',
        'count_display',
    ];

    protected function casts(): array
    {
        return [
            'count_id' => 'integer',
            'count_eu_member' => 'integer',
        ];
    }


    public function scopeOrdered($query)
    {
        return $query->orderBy('count_id');
    }
}
