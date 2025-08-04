<?php

// app/Models/SchemaVersion.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchemaVersion extends Model
{
    protected $fillable = [
        'version_name',
        'description'
    ];

    public function tables(): HasMany
    {
        return $this->hasMany(SchemaTable::class);
    }
}