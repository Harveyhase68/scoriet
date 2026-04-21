<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds Smart Injection fields to template_files table.
     * When both inject_target and inject_tag are set, the file is in "inject mode":
     * instead of creating a new file, generated code is injected into the target file
     * at the {:inject tagname:} marker position.
     */
    public function up(): void
    {
        Schema::table('template_files', function (Blueprint $table) {
            $table->string('inject_target')->nullable()->after('is_include_only')
                ->comment('Target file path for Smart Injection (e.g., routes/web.php)');
            $table->string('inject_tag')->nullable()->after('inject_target')
                ->comment('Marker tag name for Smart Injection (e.g., routes)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('template_files', function (Blueprint $table) {
            $table->dropColumn(['inject_target', 'inject_tag']);
        });
    }
};
