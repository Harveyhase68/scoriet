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
            $table->string('link_display_field', 64)->nullable()->after('link_field')->comment('Display field for ComboBox (e.g., customer_name, group_title)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_fields', function (Blueprint $table) {
            $table->dropColumn('link_display_field');
        });
    }
};
