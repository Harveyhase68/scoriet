<?php

// app/Models/SchemaField.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchemaField extends Model
{
    protected $fillable = [
        'table_id',
        'field_name',
        'field_type',
        'is_unsigned',
        'is_nullable',
        'default_value',
        'is_auto_increment',
        'field_order',
    ];

    protected $casts = [
        'is_unsigned' => 'boolean',
        'is_nullable' => 'boolean',
        'is_auto_increment' => 'boolean',
    ];

    public function table(): BelongsTo
    {
        return $this->belongsTo(SchemaTable::class, 'table_id');
    }

    public function constraintColumns(): HasMany
    {
        return $this->hasMany(SchemaConstraintColumn::class, 'field_id');
    }
}
