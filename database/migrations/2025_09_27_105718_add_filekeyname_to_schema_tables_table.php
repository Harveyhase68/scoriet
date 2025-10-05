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
        Schema::table('schema_tables', function (Blueprint $table) {
            // Add filekeyname field for template {filekeyname} variable
            // This field stores the selected key field for template generation
            $table->string('filekeyname', 100)->nullable()->after('table_name');

            // Add index for performance
            $table->index('filekeyname');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_tables', function (Blueprint $table) {
            $table->dropIndex(['filekeyname']);
            $table->dropColumn('filekeyname');
        });
    }
};
