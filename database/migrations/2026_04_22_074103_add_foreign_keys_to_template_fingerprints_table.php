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
        Schema::table('template_fingerprints', function (Blueprint $table) {
            $table->foreign(['template_file_id'])->references(['id'])->on('template_files')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['template_id'])->references(['id'])->on('templates')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('template_fingerprints', function (Blueprint $table) {
            $table->dropForeign('template_fingerprints_template_file_id_foreign');
            $table->dropForeign('template_fingerprints_template_id_foreign');
        });
    }
};
