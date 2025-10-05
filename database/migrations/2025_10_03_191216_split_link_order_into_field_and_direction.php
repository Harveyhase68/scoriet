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
            // Add new separate fields
            $table->string('link_order_field', 64)->nullable()->after('link_order')->comment('Order by field name (e.g., branch_no, name)');
            $table->enum('link_order_direction', ['ASC', 'DESC'])->default('ASC')->after('link_order_field')->comment('Order direction (ASC or DESC)');

            // Drop old combined field
            $table->dropColumn('link_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_fields', function (Blueprint $table) {
            // Restore old combined field
            $table->string('link_order', 100)->nullable()->after('link_display_field')->comment('Order by clause (e.g., name ASC, code DESC)');

            // Drop new separate fields
            $table->dropColumn(['link_order_field', 'link_order_direction']);
        });
    }
};
