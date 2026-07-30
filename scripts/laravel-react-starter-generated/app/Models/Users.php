<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $table = 'users';
    protected $primaryKey = 'id';
    public $timestamps = false;
    protected $hidden = [
    ];

    protected $fillable = [
        'id',
        'name',
        'email',
        'avatar_path',
        'language',
        'email_verified_at',
        'password',
        'remember_token',
        'created_at',
        'updated_at',
        'two_factor_secret',
        'two_factor_enabled',
        'two_factor_confirmed_at',
        'two_factor_recovery_codes',
        'two_factor_trusted_devices',
        'two_factor_last_verified_at',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'email_verified_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'two_factor_enabled' => 'integer',
            'two_factor_confirmed_at' => 'datetime',
            'two_factor_last_verified_at' => 'datetime',
        ];
    }


    public function scopeOrdered($query)
    {
        return $query->orderBy('id');
    }
}
