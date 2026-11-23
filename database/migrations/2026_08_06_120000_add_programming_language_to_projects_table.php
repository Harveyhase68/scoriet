<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Separates the "pure programming language" (C#, Python, Swift, ...)
     * from `target_framework` (Flutter, Spring Boot, WinDev, ...) — the two
     * were originally offered together in one mixed dropdown, which read as
     * inconsistent (e.g. "C++" and "React" side by side in the same list).
     * `target_language` is untouched — it is a third, unrelated field that
     * picks the input-mask JS dialect for the schema/form field editor.
     */
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('programming_language', 30)->nullable()->after('target_language');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('programming_language');
        });
    }
};
