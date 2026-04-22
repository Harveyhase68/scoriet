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
        Schema::table('schema_translations', function (Blueprint $table) {
            $table->foreign(['code'])->references(['code'])->on('languages')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['created_by'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_translations', function (Blueprint $table) {
            $table->dropForeign('schema_translations_code_foreign');
            $table->dropForeign('schema_translations_created_by_foreign');
        });
    }
};
