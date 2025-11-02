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
        Schema::table('schema_foreign_key_references', function (Blueprint $table) {
            // Add ON DELETE and ON UPDATE action columns
            $table->string('on_delete', 50)->default('NO ACTION')->after('referenced_table_id');
            $table->string('on_update', 50)->default('NO ACTION')->after('on_delete');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_foreign_key_references', function (Blueprint $table) {
            $table->dropColumn(['on_delete', 'on_update']);
        });
    }
};
