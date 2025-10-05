<?php

// app/Models/SchemaConstraintColumn.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchemaConstraintColumn extends Model
{
    protected $fillable = [
        'constraint_id',
        'field_id',
        'column_order',
    ];

    // Make sure the accessor is included in JSON serialization
    protected $appends = ['field_name'];

    public function constraint(): BelongsTo
    {
        return $this->belongsTo(SchemaConstraint::class, 'constraint_id');
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(SchemaField::class, 'field_id');
    }

    /**
     * Accessor to get field_name from related field
     */
    public function getFieldNameAttribute()
    {
        return $this->field?->field_name;
    }
}
