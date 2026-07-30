<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $table = 'postal_codes';
    protected $primaryKey = 'pc_id';
    public $timestamps = false;
    protected $hidden = [
    ];

    protected $fillable = [
        'pc_id',
        'count_iso2',
        'pc_postal_code',
        'pc_city',
        'pc_state',
        'pc_subdivision',
        'pc_latitude',
        'pc_longitude',
        'pc_timezone',
        'pc_population',
        'pc_delivery_zone',
        'pc_postal_format',
        'pc_is_active',
        'pc_valid_from',
        'pc_valid_to',
        'pc_notes',
        'pc_created_at',
        'pc_updated_at',
    ];

    protected function casts(): array
    {
        return [
            'pc_id' => 'integer',
            'pc_population' => 'integer',
            'pc_is_active' => 'integer',
            'pc_valid_from' => 'date',
            'pc_valid_to' => 'date',
            'pc_created_at' => 'datetime',
            'pc_updated_at' => 'datetime',
        ];
    }

    public function countries(): BelongsTo
    {
        return $this->belongsTo(Countries::class, 'count_iso2', 'count_iso2');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('pc_id');
    }
}
