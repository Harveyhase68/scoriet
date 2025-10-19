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
        Schema::table('schema_foreign_key_reference_columns', function (Blueprint $table) {
            $table->foreign(['reference_id'])->references(['id'])->on('schema_foreign_key_references')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['referenced_field_id'])->references(['id'])->on('schema_fields')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_foreign_key_reference_columns', function (Blueprint $table) {
            $table->dropForeign('schema_foreign_key_reference_columns_reference_id_foreign');
            $table->dropForeign('schema_foreign_key_reference_columns_referenced_field_id_foreign');
        });
    }
};
