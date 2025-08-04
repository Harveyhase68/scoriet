<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Schema Versions
        Schema::create('schema_versions', function (Blueprint $table) {
            $table->id();
            $table->string('version_name', 100);
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->index('version_name');
        });

        // Schema Tables
        Schema::create('schema_tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schema_version_id')->constrained()->onDelete('cascade');
            $table->string('table_name');
            $table->timestamps();
            
            $table->unique(['schema_version_id', 'table_name']);
            $table->index('table_name');
        });

        // Schema Fields
        Schema::create('schema_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('table_id')->constrained('schema_tables')->onDelete('cascade');
            $table->string('field_name');
            $table->string('field_type', 100);
            $table->boolean('is_unsigned')->default(false);
            $table->boolean('is_nullable')->default(true);
            $table->text('default_value')->nullable();
            $table->boolean('is_auto_increment')->default(false);
            $table->integer('field_order')->default(0);
            $table->timestamps();
            
            $table->unique(['table_id', 'field_name']);
            $table->index('field_name');
        });

        // Schema Constraints
        Schema::create('schema_constraints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('table_id')->constrained('schema_tables')->onDelete('cascade');
            $table->string('constraint_name')->nullable();
            $table->enum('constraint_type', ['PRIMARY KEY', 'UNIQUE', 'KEY', 'FOREIGN KEY', 'INDEX']);
            $table->timestamps();
            
            $table->index('constraint_type');
            $table->index('constraint_name');
        });

        // Schema Constraint Columns
        Schema::create('schema_constraint_columns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('constraint_id')->constrained('schema_constraints')->onDelete('cascade');
            $table->foreignId('field_id')->constrained('schema_fields')->onDelete('cascade');
            $table->integer('column_order')->default(0);
            $table->timestamps();
            
            $table->unique(['constraint_id', 'field_id'], 'constraint_field_unique');
        });

        // Schema Foreign Key References
        Schema::create('schema_foreign_key_references', function (Blueprint $table) {
            $table->id();
            $table->foreignId('constraint_id')->constrained('schema_constraints')->onDelete('cascade');
            $table->foreignId('referenced_table_id')->constrained('schema_tables')->onDelete('cascade');
            $table->timestamps();
            
            $table->unique('constraint_id', 'fk_ref_constraint_unique');
        });

        // Schema Foreign Key Reference Columns
        Schema::create('schema_foreign_key_reference_columns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reference_id')->constrained('schema_foreign_key_references')->onDelete('cascade');
            $table->foreignId('referenced_field_id')->constrained('schema_fields')->onDelete('cascade');
            $table->integer('column_order')->default(0);
            $table->timestamps();
            
            $table->unique(['reference_id', 'referenced_field_id'], 'fk_ref_col_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schema_foreign_key_reference_columns');
        Schema::dropIfExists('schema_foreign_key_references');
        Schema::dropIfExists('schema_constraint_columns');
        Schema::dropIfExists('schema_constraints');
        Schema::dropIfExists('schema_fields');
        Schema::dropIfExists('schema_tables');
        Schema::dropIfExists('schema_versions');
    }
};