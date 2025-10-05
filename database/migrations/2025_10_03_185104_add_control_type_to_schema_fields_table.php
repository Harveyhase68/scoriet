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
            $table->string('control_type', 30)->default('TEXT')->after('is_unique')->comment('UI control type (TEXT, TEXTAREA, CHECKBOX, COMBOBOX, etc.)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_fields', function (Blueprint $table) {
            $table->dropColumn('control_type');
        });
    }
};
