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
        Schema::table('schema_constraints', function (Blueprint $table) {
            $table->foreign(['table_id'])->references(['id'])->on('schema_tables')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_constraints', function (Blueprint $table) {
            $table->dropForeign('schema_constraints_table_id_foreign');
        });
    }
};
