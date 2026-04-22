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
        Schema::table('schema_constraint_columns', function (Blueprint $table) {
            $table->foreign(['constraint_id'])->references(['id'])->on('schema_constraints')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['field_id'])->references(['id'])->on('schema_fields')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_constraint_columns', function (Blueprint $table) {
            $table->dropForeign('schema_constraint_columns_constraint_id_foreign');
            $table->dropForeign('schema_constraint_columns_field_id_foreign');
        });
    }
};
