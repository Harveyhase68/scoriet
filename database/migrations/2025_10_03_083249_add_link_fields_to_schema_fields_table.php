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
        Schema::table('schema_fields', function (Blueprint $table) {
            // Generische Link-Felder für ComboBox, ListBox, RadioButtons, etc.
            $table->string('link_table', 64)->nullable()->after('is_unique')->comment('Linked table name (e.g., countries, products)');
            $table->string('link_field', 64)->nullable()->after('link_table')->comment('Linked field name (e.g., id, code)');
            $table->string('link_order', 100)->nullable()->after('link_field')->comment('Order by clause (e.g., name ASC, code DESC)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_fields', function (Blueprint $table) {
            $table->dropColumn(['link_table', 'link_field', 'link_order']);
        });
    }
};
