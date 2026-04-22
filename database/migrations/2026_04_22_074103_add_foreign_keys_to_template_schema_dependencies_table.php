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
        Schema::table('template_schema_dependencies', function (Blueprint $table) {
            $table->foreign(['schema_id'])->references(['id'])->on('schemas')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['template_id'])->references(['id'])->on('templates')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('template_schema_dependencies', function (Blueprint $table) {
            $table->dropForeign('template_schema_dependencies_schema_id_foreign');
            $table->dropForeign('template_schema_dependencies_template_id_foreign');
        });
    }
};
