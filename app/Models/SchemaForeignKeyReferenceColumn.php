<?php

// app/Models/SchemaForeignKeyReferenceColumn.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchemaForeignKeyReferenceColumn extends Model
{
    protected $fillable = [
        'reference_id',
        'referenced_field_id',
        'column_order',
    ];

    public function reference(): BelongsTo
    {
        return $this->belongsTo(SchemaForeignKeyReference::class, 'reference_id');
    }

    public function referencedField(): BelongsTo
    {
        return $this->belongsTo(SchemaField::class, 'referenced_field_id');
    }
}
