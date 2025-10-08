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
        Schema::create('schema_fields', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('table_id');
            $table->string('field_name')->index();
            $table->string('field_type', 100);
            $table->boolean('is_unsigned')->default(false);
            $table->boolean('is_nullable')->default(true);
            $table->text('default_value')->nullable();
            $table->boolean('is_auto_increment')->default(false);
            $table->boolean('is_primary_key')->default(false)->index();
            $table->boolean('is_index')->default(false)->index();
            $table->boolean('is_unique')->default(false)->index();
            $table->string('control_type', 30)->default('TEXT')->comment('UI control type (TEXT, TEXTAREA, CHECKBOX, COMBOBOX, etc.)');
            $table->string('link_table', 64)->nullable()->comment('Linked table name (e.g., countries, products)');
            $table->string('link_field', 64)->nullable()->comment('Linked field name (e.g., id, code)');
            $table->string('link_display_field', 64)->nullable()->comment('Display field for ComboBox (e.g., customer_name, group_title)');
            $table->string('link_order_field', 64)->nullable()->comment('Order by field name (e.g., branch_no, name)');
            $table->enum('link_order_direction', ['ASC', 'DESC'])->default('ASC')->comment('Order direction (ASC or DESC)');
            $table->integer('field_order')->default(0);
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['table_id', 'field_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schema_fields');
    }
};
