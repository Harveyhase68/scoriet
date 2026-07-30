<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $table = 'contacts';
    protected $primaryKey = 'cont_id';
    public $timestamps = false;
    protected $hidden = [
    ];

    protected $fillable = [
        'cont_id',
        'cont_no',
        'cont_first_name',
        'cont_last_name',
        'cont_title',
        'cont_role',
        'cont_email',
        'cont_phone',
        'cont_mobile',
        'cont_preferred_channel',
        'cont_notes',
        'cont_created_at',
        'addr_no',
    ];

    protected function casts(): array
    {
        return [
            'cont_id' => 'integer',
            'cont_no' => 'integer',
            'cont_created_at' => 'datetime',
            'addr_no' => 'integer',
        ];
    }

    public function addresses(): BelongsTo
    {
        return $this->belongsTo(Addresses::class, 'addr_no', 'addr_no');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('cont_id');
    }
}
