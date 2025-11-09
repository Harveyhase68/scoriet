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
        Schema::table('schema_versions', function (Blueprint $table) {
            $table->foreign(['schema_id'])->references(['id'])->on('schemas')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_versions', function (Blueprint $table) {
            $table->dropForeign('schema_versions_schema_id_foreign');
        });
    }
};
