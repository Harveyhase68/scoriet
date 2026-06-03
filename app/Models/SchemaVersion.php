<?php

// app/Models/SchemaVersion.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchemaVersion extends Model
{
    protected $fillable = [
        'version_name',
        'description',
        'schema_id',
        'version_number',
        'imported_at',
    ];

    protected $casts = [
        'imported_at' => 'datetime',
        'has_unsaved_changes' => 'boolean',
    ];

    public function tables(): HasMany
    {
        return $this->hasMany(SchemaTable::class);
    }

    /**
     * Get the schema that owns this version (if any)
     */
    public function schema(): BelongsTo
    {
        return $this->belongsTo(FloatingSchema::class, 'schema_id');
    }

    /**
     * Create a new version for a floating schema
     */
    public static function createNewVersion(FloatingSchema $schema, ?string $description = null): self
    {
        $nextVersion = $schema->last_version + 1;
        
        $version = new self([
            'schema_id' => $schema->id,
            'version_name' => "v{$nextVersion}",
            'version_number' => $nextVersion,
            'description' => $description ?? "Version {$nextVersion}",
            'imported_at' => now(),
        ]);
        
        // Save using Eloquent to trigger observers
        $version->save();

        // Update schema's last_version (which is now the current version)
        $schema->update([
            'last_version' => $nextVersion,
        ]);

        return $version;
    }

    /**
     * Create a new version by copying all data from current version
     */
    public static function createNewVersionWithCopy(FloatingSchema $schema, int $fromVersionNumber, ?string $description = null): self
    {
        // Increase PHP limits for large schema operations  
        ini_set('memory_limit', '2048M'); // 2GB for very large schemas
        ini_set('max_execution_time', 600); // 10 minutes
        set_time_limit(600);
        
        // Increase MySQL/MariaDB timeouts and prevent connection drops.
        // These are tuning knobs — if any aren't supported on this server,
        // ignore the failure and proceed. The version-copy will still work
        // (it'll just rely on the PHP-level limits set above).
        //
        // `max_execution_time` is MySQL-only (5.7.4+, milliseconds).
        // MariaDB has `max_statement_time` (seconds, same intent, different unit).
        // Try MySQL first, fall back to MariaDB, give up silently if neither works.
        foreach ([
            'SET SESSION wait_timeout = 1800',          // 30 minutes
            'SET SESSION interactive_timeout = 1800',   // 30 minutes
        ] as $tuning) {
            try { \DB::statement($tuning); } catch (\Throwable $e) { /* unsupported — ignore */ }
        }
        try {
            \DB::statement('SET SESSION max_execution_time = 1800000'); // MySQL: ms
        } catch (\Throwable $e) {
            try {
                \DB::statement('SET SESSION max_statement_time = 1800'); // MariaDB: seconds
            } catch (\Throwable $e2) { /* neither variant supported — ignore */ }
        }
        \DB::reconnect(); // Ensure fresh connection

        // Create the new empty version
        $newVersion = self::createNewVersion($schema, $description);
        
        // Find the source version to copy from
        $sourceVersion = self::where('schema_id', $schema->id)
            ->where('version_number', $fromVersionNumber)
            ->first();
            
        if (!$sourceVersion) {
            throw new \Exception("Source version {$fromVersionNumber} not found");
        }

        // PHASE 1: Copy all tables, fields, and non-foreign-key constraints
        $tableMapping = []; // Map old table IDs to new table objects

        foreach ($sourceVersion->tables as $sourceTable) {

            // Create new table for this version
            $newTable = \App\Models\SchemaTable::create([
                'schema_id' => $schema->id,
                'schema_version_id' => $newVersion->id,
                'table_name' => $sourceTable->table_name,
                'table_comment' => $sourceTable->table_comment,
                'engine' => $sourceTable->engine,
                'charset' => $sourceTable->charset,
                'collation' => $sourceTable->collation,
            ]);

            // Store mapping for Phase 2
            $tableMapping[$sourceTable->id] = $newTable;

            // Copy all fields
            foreach ($sourceTable->fields as $sourceField) {
                try {
                    \App\Models\SchemaField::create([
                        'table_id' => $newTable->id,
                        'field_name' => $sourceField->field_name,
                        'field_type' => strtolower($sourceField->field_type),
                        'field_length' => $sourceField->field_length,
                        'field_precision' => $sourceField->field_precision,
                        'field_scale' => $sourceField->field_scale,
                        'is_nullable' => $sourceField->is_nullable ?? true,
                        'is_unsigned' => $sourceField->is_unsigned ?? false,
                        'default_value' => $sourceField->default_value,
                        'is_primary_key' => $sourceField->is_primary_key ?? false,
                        'is_unique' => $sourceField->is_unique ?? false,
                        'is_auto_increment' => $sourceField->is_auto_increment ?? false,
                        'field_comment' => $sourceField->field_comment,
                        'field_order' => $sourceField->field_order ?? 0,
                    ]);
                } catch (\Exception $e) {
                    throw $e;
                }
            }

            // Copy only non-foreign-key constraints in Phase 1
            $nonFkConstraints = $sourceTable->constraints()->where('constraint_type', '!=', 'FOREIGN KEY')->get();

            foreach ($nonFkConstraints as $sourceConstraint) {
                try {
                    $newConstraint = \App\Models\SchemaConstraint::create([
                        'table_id' => $newTable->id,
                        'constraint_name' => $sourceConstraint->constraint_name,
                        'constraint_type' => $sourceConstraint->constraint_type,
                    ]);

                    // Copy constraint columns
                foreach ($sourceConstraint->constraintColumns as $sourceColumn) {
                    // Find the corresponding field in the new table
                    $newField = $newTable->fields()->where('field_name', $sourceColumn->field_name)->first();
                    
                    if ($newField) {
                        \App\Models\SchemaConstraintColumn::create([
                            'constraint_id' => $newConstraint->id,
                            'field_id' => $newField->id,
                            'column_order' => $sourceColumn->column_order,
                        ]);
                    }
                }
                
                // Copy foreign key reference if exists
                if ($sourceConstraint->foreignKeyReference) {
                    // Find the referenced table in the new version by name
                    $referencedTable = $newVersion->tables()->where('table_name', $sourceConstraint->foreignKeyReference->referencedTable->table_name)->first();
                    
                    if ($referencedTable) {
                        $newForeignKeyRef = \App\Models\SchemaForeignKeyReference::create([
                            'constraint_id' => $newConstraint->id,
                            'referenced_table_id' => $referencedTable->id,
                        ]);
                    }
                    
                    // Copy reference columns
                    if (isset($newForeignKeyRef) && $referencedTable) {
                        foreach ($sourceConstraint->foreignKeyReference->referenceColumns as $sourceRefColumn) {
                            // Find the referenced field in the referenced table
                            $referencedField = $referencedTable->fields()->where('field_name', $sourceRefColumn->referencedField->field_name)->first();
                            
                            if ($referencedField) {
                                \App\Models\SchemaForeignKeyReferenceColumn::create([
                                    'reference_id' => $newForeignKeyRef->id,
                                    'referenced_field_id' => $referencedField->id,
                                    'column_order' => $sourceRefColumn->column_order,
                                ]);
                            }
                        }
                    }
                }
                } catch (\Exception $e) {
                    throw $e;
                }
            }
        }

        // PHASE 2: Copy all foreign key constraints (now that all tables exist)
        foreach ($sourceVersion->tables as $sourceTable) {
            $newTable = $tableMapping[$sourceTable->id];
            $fkConstraints = $sourceTable->constraints()->where('constraint_type', 'FOREIGN KEY')->get();

            foreach ($fkConstraints as $sourceConstraint) {
                try {
                    // Create the foreign key constraint
                    $newConstraint = \App\Models\SchemaConstraint::create([
                        'table_id' => $newTable->id,
                        'constraint_name' => $sourceConstraint->constraint_name,
                        'constraint_type' => $sourceConstraint->constraint_type,
                        'column_names' => $sourceConstraint->column_names,
                    ]);

                    // Copy constraint columns
                    foreach ($sourceConstraint->constraintColumns as $sourceColumn) {
                        $newField = $newTable->fields()->where('field_name', $sourceColumn->field_name)->first();
                        
                        if ($newField) {
                            \App\Models\SchemaConstraintColumn::create([
                                'constraint_id' => $newConstraint->id,
                                'field_id' => $newField->id,
                                'column_order' => $sourceColumn->column_order,
                            ]);
                        }
                    }
                    
                    // Copy foreign key reference (now all tables should exist)
                    if ($sourceConstraint->foreignKeyReference) {
                        $referencedTableName = $sourceConstraint->foreignKeyReference->referencedTable->table_name;
                        $referencedTable = $newVersion->tables()->where('table_name', $referencedTableName)->first();
                        
                        if ($referencedTable) {
                            $newForeignKeyRef = \App\Models\SchemaForeignKeyReference::create([
                                'constraint_id' => $newConstraint->id,
                                'referenced_table_id' => $referencedTable->id,
                            ]);
                            
                            // Copy reference columns
                            foreach ($sourceConstraint->foreignKeyReference->referenceColumns as $sourceRefColumn) {
                                $referencedField = $referencedTable->fields()->where('field_name', $sourceRefColumn->referencedField->field_name)->first();
                                
                                if ($referencedField) {
                                    \App\Models\SchemaForeignKeyReferenceColumn::create([
                                        'reference_id' => $newForeignKeyRef->id,
                                        'referenced_field_id' => $referencedField->id,
                                    ]);
                                }
                            }
                        }
                    }
                } catch (\Exception $e) {
                    throw $e;
                }
            }
        }

        // Copy layout positions and sizes
        try {
            // Get source layout (single row with JSON data)
            $sourceLayout = \App\Models\SchemaDesignerLayout::where('schema_id', $schema->id)
                ->where('version_number', $fromVersionNumber)
                ->first();

            if ($sourceLayout) {
                // Copy layout_data JSON to new version
                \App\Models\SchemaDesignerLayout::updateOrCreate(
                    [
                        'schema_id' => $schema->id,
                        'version_number' => $newVersion->version_number,
                    ],
                    [
                        'layout_data' => $sourceLayout->layout_data,
                    ]
                );
            }
        } catch (\Exception $e) {
            \Log::error("Failed to copy layout: " . $e->getMessage());
            // Don't throw - layout copying should not fail the entire version copy
        }

        return $newVersion;
    }

    /**
     * Format version for display
     */
    public function getDisplayNameAttribute(): string
    {
        if ($this->version_number && $this->imported_at) {
            return "{$this->version_number} - {$this->imported_at->format('j.n.Y')}";
        }
        return $this->version_name;
    }

    /**
     * Check if this is a schema version (has schema_id)
     */
    public function hasSchema(): bool
    {
        return !is_null($this->schema_id);
    }
}
