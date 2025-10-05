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
        Schema::table('projects', function (Blueprint $table) {
            $table->string('start_page')->nullable()->default('index.php')->after('project_url');
            $table->string('default_language', 10)->nullable()->default('en')->after('start_page');
            $table->unsignedTinyInteger('filename_short_length')->nullable()->default(2)->after('default_language');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['start_page', 'default_language', 'filename_short_length']);
        });
    }
};
