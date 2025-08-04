<?php

// app/Models/SchemaForeignKeyReference.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchemaForeignKeyReference extends Model
{
    protected $fillable = [
        'constraint_id',
        'referenced_table_id'
    ];

    public function constraint(): BelongsTo
    {
        return $this->belongsTo(SchemaConstraint::class, 'constraint_id');
    }

    public function referencedTable(): BelongsTo
    {
        return $this->belongsTo(SchemaTable::class, 'referenced_table_id');
    }

    public function referenceColumns(): HasMany
    {
        return $this->hasMany(SchemaForeignKeyReferenceColumn::class, 'reference_id');
    }
}