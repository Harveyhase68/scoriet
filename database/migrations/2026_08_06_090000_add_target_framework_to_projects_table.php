<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * `projects.target_language` already exists but is unrelated - it picks
     * the input-mask/validation JS library dialect used by the schema/form
     * field editor (e.g. 'react_imask', 'vue_maska'), not the code
     * generation target framework. `target_framework` is the actual "which
     * stack does this project generate for" property (see UI options in
     * ProjectSettingsPanel.tsx: 'flutter', 'php_laravel', 'spring_boot_java', ...).
     */
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('target_framework', 30)->nullable()->after('target_language');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('target_framework');
        });
    }
};
