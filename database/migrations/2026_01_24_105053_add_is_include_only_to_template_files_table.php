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
        Schema::table('template_files', function (Blueprint $table) {
            // Include-Only Flag: Wenn true, wird die Datei nicht generiert,
            // sondern nur für {:include: pfad/datei.php:} verwendet
            $table->boolean('is_include_only')->default(false)->after('form_window_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('template_files', function (Blueprint $table) {
            $table->dropColumn('is_include_only');
        });
    }
};
