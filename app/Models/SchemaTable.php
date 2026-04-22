<?php

// app/Models/SchemaTable.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchemaTable extends Model
{
    // Display state — visual hint, passed to gtree as metadata. Does NOT filter generation.
    public const DISPLAY_ENABLED   = 'enabled';
    public const DISPLAY_DISABLED  = 'disabled';
    public const DISPLAY_GRAYED    = 'grayed';
    public const DISPLAY_INVISIBLE = 'invisible';
    public const DISPLAY_EXCLUDED  = 'excluded';

    // Generation mode — controls which parts of code generation apply to this table.
    public const GEN_FULL           = 'full';
    public const GEN_CODE_ONLY      = 'code_only';      // in nmaxtables, no per-file
    public const GEN_TEMPLATE_ONLY  = 'template_only';  // per-file generated, skipped in nmaxtables loops
    public const GEN_REFERENCE_ONLY = 'reference_only'; // only in gtree for FK-resolution
    public const GEN_EXCLUDED       = 'excluded';       // removed from gtree entirely

    protected $fillable = [
        'schema_version_id', // Updated to work with both legacy and floating schemas
        'schema_id', // New floating schema reference
        'table_name',
        'singular_name', // User-defined singular form (e.g. "address" for "addresses", "Produkt" for "Produkten")
        'primarykeyfield', // Primary key field name for template {primarykey} variable
        'filekeyname', // File key field name for template {filekeyname} variable
        'file_name_renamed', // Renamed file name for template {file_name_renamed} variable
        'file_name_short', // Short file name for template {file_name_short} variable
        'form_set_id', // Per-table FormSet override (null = project default)
        'report_pattern_id', // Per-table ReportPattern (null = no report)
        'display_state',
        'generation_mode',
    ];

    protected $casts = [
        // All FK columns cast to int — MariaDB/PDO may return BIGINT columns as
        // strings depending on the driver config. Without these casts, strict
        // (===, !==) comparisons between a $table->xxx_id and a route-bound
        // parent's ->id silently fail even when the values match. See the
        // "Table does not belong to this schema version" false positive in
        // SchemaController::updateTable() as the concrete example.
        'schema_version_id' => 'integer',
        'schema_id' => 'integer',
        'form_set_id' => 'integer',
        'report_pattern_id' => 'integer',
    ];

    public function formSet(): BelongsTo
    {
        return $this->belongsTo(FormSet::class, 'form_set_id');
    }

    public function reportPattern(): BelongsTo
    {
        return $this->belongsTo(ReportPattern::class, 'report_pattern_id');
    }

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
