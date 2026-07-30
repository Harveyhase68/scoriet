<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $table = 'companies';
    protected $primaryKey = 'comp_id';
    public $timestamps = false;
    protected $hidden = [
    ];

    protected $fillable = [
        'comp_id',
        'comp_no',
        'comp_name',
        'comp_registration_number',
        'comp_vat_number',
        'comp_website',
        'comp_phone',
        'comp_fax',
        'comp_industry',
        'comp_size',
        'comp_notes',
        'comp_created_at',
        'comp_updated_at',
    ];

    protected function casts(): array
    {
        return [
            'comp_id' => 'integer',
            'comp_no' => 'integer',
            'comp_created_at' => 'datetime',
            'comp_updated_at' => 'datetime',
        ];
    }


    public function scopeOrdered($query)
    {
        return $query->orderBy('comp_id');
    }
}
