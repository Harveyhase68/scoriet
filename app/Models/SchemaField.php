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
        'is_primary_key',
        'is_index',
        'is_unique',
        'field_order',
        'comment',
        // Control Type & Link-Felder für ComboBox, ListBox, etc.
        'control_type',
        'link_table',
        'link_field',
        'link_display_field',
        'link_order_field',
        'link_order_direction',
        'editmask', // Edit mask for input validation (framework-agnostic)
    ];

    protected $casts = [
        'is_unsigned' => 'boolean',
        'is_nullable' => 'boolean',
        'is_auto_increment' => 'boolean',
        'is_primary_key' => 'boolean',
        'is_index' => 'boolean',
        'is_unique' => 'boolean',
    ];

    public function table(): BelongsTo
    {
        return $this->belongsTo(SchemaTable::class, 'table_id');
    }

    /**
     * Clone this field to a new table
     */
    public function cloneToTable(SchemaTable $targetTable): self
    {
        $clone = $this->replicate();
        $clone->table_id = $targetTable->id;
        $clone->save();

        return $clone;
    }

    public function constraintColumns(): HasMany
    {
        return $this->hasMany(SchemaConstraintColumn::class, 'field_id');
    }

    /**
     * Get the per-template-file assignments for this field.
     */
    public function templateFileAssignments(): HasMany
    {
        return $this->hasMany(TemplateFileFieldAssignment::class, 'schema_field_id');
    }
}
