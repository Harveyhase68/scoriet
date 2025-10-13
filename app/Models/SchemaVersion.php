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
        
        // Increase MySQL timeouts and prevent connection drops
        \DB::statement('SET SESSION wait_timeout = 1800'); // 30 minutes
        \DB::statement('SET SESSION interactive_timeout = 1800'); // 30 minutes
        \DB::statement('SET SESSION max_execution_time = 1800000'); // 30 minutes in ms
        \DB::reconnect(); // Ensure fresh connection
        
        \Log::info("🔍 createNewVersionWithCopy start", [
            'schema_id' => $schema->id,
            'from_version' => $fromVersionNumber,
            'description' => $description,
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'current_memory_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
            'peak_memory_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2)
        ]);
        
        // Create the new empty version
        $newVersion = self::createNewVersion($schema, $description);
        \Log::info("✅ New empty version created", ['new_version_id' => $newVersion->id]);
        
        // Find the source version to copy from
        $sourceVersion = self::where('schema_id', $schema->id)
            ->where('version_number', $fromVersionNumber)
            ->first();
            
        if (!$sourceVersion) {
            \Log::error("❌ Source version not found", ['from_version' => $fromVersionNumber]);
            throw new \Exception("Source version {$fromVersionNumber} not found");
        }
        
        \Log::info("✅ Source version found", [
            'source_version_id' => $sourceVersion->id,
            'tables_count' => $sourceVersion->tables()->count()
        ]);
        
        // PHASE 1: Copy all tables, fields, and non-foreign-key constraints
        \Log::info("🚀 Phase 1: Copying tables, fields and non-FK constraints");
        $tableMapping = []; // Map old table IDs to new table objects
        
        foreach ($sourceVersion->tables as $sourceTable) {
            \Log::info("📋 Copying table", ['table_name' => $sourceTable->table_name]);
            
            // Create new table for this version
            $newTable = \App\Models\SchemaTable::create([
                'schema_version_id' => $newVersion->id,
                'table_name' => $sourceTable->table_name,
                'table_comment' => $sourceTable->table_comment,
                'engine' => $sourceTable->engine,
                'charset' => $sourceTable->charset,
                'collation' => $sourceTable->collation,
            ]);
            \Log::info("✅ Table created", ['new_table_id' => $newTable->id]);
            
            // Store mapping for Phase 2
            $tableMapping[$sourceTable->id] = $newTable;
            
            // Copy all fields
            $fieldsCount = $sourceTable->fields ? $sourceTable->fields->count() : 0;
            \Log::info("📝 Copying fields", ['fields_count' => $fieldsCount]);
            
            foreach ($sourceTable->fields as $sourceField) {
                try {
                    \Log::info("🔤 Copying field", ['field_name' => $sourceField->field_name]);
                    
                    \App\Models\SchemaField::create([
                        'table_id' => $newTable->id,
                        'field_name' => $sourceField->field_name,
                        'field_type' => $sourceField->field_type,
                        'field_length' => $sourceField->field_length,
                        'field_precision' => $sourceField->field_precision,
                        'field_scale' => $sourceField->field_scale,
                        'is_nullable' => $sourceField->is_nullable ?? true,
                        'default_value' => $sourceField->default_value,
                        'is_primary_key' => $sourceField->is_primary_key ?? false,
                        'is_unique' => $sourceField->is_unique ?? false,
                        'is_auto_increment' => $sourceField->is_auto_increment ?? false,
                        'field_comment' => $sourceField->field_comment,
                        'field_order' => $sourceField->field_order ?? 0,
                    ]);
                    
                    \Log::info("✅ Field copied successfully");
                } catch (\Exception $e) {
                    \Log::error("❌ Failed to copy field", [
                        'field_name' => $sourceField->field_name,
                        'error' => $e->getMessage()
                    ]);
                    throw $e;
                }
            }
            
            // Copy only non-foreign-key constraints in Phase 1
            $nonFkConstraints = $sourceTable->constraints()->where('constraint_type', '!=', 'FOREIGN KEY')->get();
            \Log::info("🔗 Phase 1: Copying non-FK constraints", ['constraints_count' => $nonFkConstraints->count()]);
            
            foreach ($nonFkConstraints as $sourceConstraint) {
                try {
                    \Log::info("🔒 Copying constraint", [
                        'constraint_name' => $sourceConstraint->constraint_name,
                        'constraint_type' => $sourceConstraint->constraint_type
                    ]);
                    $newConstraint = \App\Models\SchemaConstraint::create([
                        'table_id' => $newTable->id,
                        'constraint_name' => $sourceConstraint->constraint_name,
                        'constraint_type' => $sourceConstraint->constraint_type,
                    ]);
                    
                    \Log::info("✅ Constraint created", ['constraint_id' => $newConstraint->id]);
                
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
                    } else {
                        // Log detailed warning when referenced table is not found
                        \Log::warning('🚨 Foreign Key SKIPPED - Referenced table not found', [
                            'constraint_name' => $sourceConstraint->constraint_name ?? 'NULL',
                            'constraint_type' => $sourceConstraint->constraint_type,
                            'source_table' => $sourceTable->table_name,
                            'referenced_table_name' => $sourceConstraint->foreignKeyReference->referencedTable->table_name,
                            'referenced_table_id' => $sourceConstraint->foreignKeyReference->referencedTable->id,
                            'available_tables_in_new_version' => $newVersion->tables()->pluck('table_name')->toArray(),
                            'total_tables_in_new_version' => $newVersion->tables()->count()
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
                    \Log::error("❌ Failed to copy constraint", [
                        'constraint_name' => $sourceConstraint->constraint_name ?? 'unknown',
                        'error' => $e->getMessage()
                    ]);
                    throw $e;
                }
            }
        }
        
        // PHASE 2: Copy all foreign key constraints (now that all tables exist)
        \Log::info("🚀 Phase 2: Processing foreign key constraints");
        
        foreach ($sourceVersion->tables as $sourceTable) {
            $newTable = $tableMapping[$sourceTable->id];
            $fkConstraints = $sourceTable->constraints()->where('constraint_type', 'FOREIGN KEY')->get();
            
            \Log::info("🔑 Processing FK constraints for table", [
                'table_name' => $sourceTable->table_name,
                'fk_count' => $fkConstraints->count()
            ]);
            
            foreach ($fkConstraints as $sourceConstraint) {
                try {
                    \Log::info("🔒 Phase 2: Creating FK constraint", [
                        'constraint_name' => $sourceConstraint->constraint_name ?? 'NULL',
                        'source_table' => $sourceTable->table_name
                    ]);
                    
                    // Create the foreign key constraint
                    $newConstraint = \App\Models\SchemaConstraint::create([
                        'table_id' => $newTable->id,
                        'constraint_name' => $sourceConstraint->constraint_name,
                        'constraint_type' => $sourceConstraint->constraint_type,
                        'column_names' => $sourceConstraint->column_names,
                    ]);
                    \Log::info("✅ FK Constraint created", ['constraint_id' => $newConstraint->id]);
                    
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
                            \Log::info("✅ FK Reference created successfully");
                        } else {
                            \Log::error("❌ Phase 2: Referenced table still not found", [
                                'referenced_table_name' => $referencedTableName,
                                'constraint_name' => $sourceConstraint->constraint_name
                            ]);
                        }
                    }
                } catch (\Exception $e) {
                    \Log::error("❌ Failed to copy FK constraint in Phase 2", [
                        'constraint_name' => $sourceConstraint->constraint_name ?? 'unknown',
                        'source_table' => $sourceTable->table_name,
                        'error' => $e->getMessage()
                    ]);
                    throw $e;
                }
            }
        }
        
        // Copy layout positions and sizes
        \Log::info("📐 Copying layout data");
        try {
            // First, clean up any existing layouts for this version to avoid duplicates
            \App\Models\SchemaDesignerLayout::where('schema_id', $schema->id)
                ->where('version_number', $newVersion->version_number)
                ->delete();
            
            \Log::info("📐 Cleaned existing layouts for new version", ['version_number' => $newVersion->version_number]);
            
            $sourceLayouts = \App\Models\SchemaDesignerLayout::where('schema_id', $schema->id)
                ->where('version_number', $fromVersionNumber)
                ->get();
                
            \Log::info("📐 Found layouts to copy", ['layouts_count' => $sourceLayouts->count()]);
                
            $copiedCount = 0;
            foreach ($sourceLayouts as $sourceLayout) {
                try {
                    \Log::info("📐 Copying layout", [
                        'table_name' => $sourceLayout->table_name,
                        'x' => $sourceLayout->x_position,
                        'y' => $sourceLayout->y_position,
                        'target_version' => $newVersion->version_number
                    ]);
                    
                    // Use updateOrCreate to handle any remaining duplicates gracefully
                    \App\Models\SchemaDesignerLayout::updateOrCreate(
                        [
                            'schema_id' => $schema->id,
                            'version_number' => $newVersion->version_number,
                            'table_name' => $sourceLayout->table_name,
                        ],
                        [
                            'x_position' => $sourceLayout->x_position,
                            'y_position' => $sourceLayout->y_position,
                            'width' => $sourceLayout->width,
                            'height' => $sourceLayout->height,
                        ]
                    );
                    $copiedCount++;
                    
                    \Log::info("📐 Layout copied successfully", ['copied_count' => $copiedCount]);
                } catch (\Exception $e) {
                    \Log::error("❌ Failed to copy layout", [
                        'table_name' => $sourceLayout->table_name ?? 'unknown',
                        'error' => $e->getMessage(),
                        'line' => $e->getLine(),
                        'file' => $e->getFile()
                    ]);
                    throw $e; // Re-throw to stop the process
                }
            }
            
            \Log::info("✅ Layout data copied", ['layouts_count' => $copiedCount]);
        } catch (\Exception $e) {
            \Log::error("❌ Critical error during layout copying", [
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e; // Re-throw to fail the entire process
        }
        
        \Log::info("🎉 createNewVersionWithCopy completed successfully", [
            'new_version_id' => $newVersion->id,
            'final_memory_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
            'peak_memory_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
            'execution_time_seconds' => round(microtime(true) - LARAVEL_START, 2)
        ]);
        
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
