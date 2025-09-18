<?php

// app/Models/SchemaTable.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchemaTable extends Model
{
    protected $fillable = [
        'schema_version_id', // Updated to work with both legacy and floating schemas
        'schema_id', // New floating schema reference
        'table_name',
        'comment',
    ];

    public function schemaVersion(): BelongsTo
    {
        return $this->belongsTo(SchemaVersion::class);
    }

    public function floatingSchema(): BelongsTo
    {
        return $this->belongsTo(FloatingSchema::class, 'schema_id');
    }


    // Helper method to get the schema (floating or legacy)
    public function getSchema()
    {
        if ($this->schema_id) {
            return $this->floatingSchema;
        }
        return $this->schemaVersion;
    }

    public function fields(): HasMany
    {
        return $this->hasMany(SchemaField::class, 'table_id')->orderBy('field_order');
    }

    public function constraints(): HasMany
    {
        return $this->hasMany(SchemaConstraint::class, 'table_id');
    }

    /**
     * Clone this table to a new schema
     */
    public function cloneToSchema(FloatingSchema $targetSchema): self
    {
        $clone = $this->replicate();
        $clone->schema_id = $targetSchema->id;
        $clone->schema_version_id = null; // Clear legacy reference
        $clone->save();

        // Clone all fields
        $this->fields->each(function($field) use ($clone) {
            $field->cloneToTable($clone);
        });

        // Clone all constraints
        $this->constraints->each(function($constraint) use ($clone) {
            $constraint->cloneToTable($clone);
        });

        return $clone;
    }
}
