<?php

// app/Models/SchemaField.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchemaField extends Model
{
    // Display state — visual hint, passed to gtree as metadata. Does NOT filter generation.
    public const DISPLAY_ENABLED   = 'enabled';
    public const DISPLAY_DISABLED  = 'disabled';
    public const DISPLAY_GRAYED    = 'grayed';
    public const DISPLAY_INVISIBLE = 'invisible';
    public const DISPLAY_EXCLUDED  = 'excluded';

    // Generation mode — controls which parts of code generation apply to this field.
    public const GEN_FULL           = 'full';
    public const GEN_CODE_ONLY      = 'code_only';      // in nmaxitems, no per-field files
    public const GEN_TEMPLATE_ONLY  = 'template_only';  // per-field files generated, skipped in nmaxitems loops
    public const GEN_REFERENCE_ONLY = 'reference_only'; // only in gtree for FK-resolution
    public const GEN_EXCLUDED       = 'excluded';       // removed from gtree entirely

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
        'display_state',
        'generation_mode',
    ];

    protected $casts = [
        // table_id cast to int — see note in SchemaTable model about MariaDB/PDO
        // returning BIGINT columns as strings. Strict === / !== comparisons in
        // controllers (e.g. "Field does not belong to this table") would
        // otherwise fail silently.
        'table_id' => 'integer',
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

    /**
     * Get the per-report-pattern assignments for this field.
     */
    public function reportPatternAssignments(): HasMany
    {
        return $this->hasMany(ReportPatternFieldAssignment::class, 'schema_field_id');
    }
}
