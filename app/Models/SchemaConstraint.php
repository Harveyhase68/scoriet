<?php

// app/Models/SchemaConstraint.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SchemaConstraint extends Model
{
    protected $fillable = [
        'table_id',
        'constraint_name',
        'constraint_type',
    ];

    public function table(): BelongsTo
    {
        return $this->belongsTo(SchemaTable::class, 'table_id');
    }

    public function constraintColumns(): HasMany
    {
        return $this->hasMany(SchemaConstraintColumn::class, 'constraint_id');
    }

    public function foreignKeyReference(): HasOne
    {
        return $this->hasOne(SchemaForeignKeyReference::class, 'constraint_id');
    }
}
