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
            // Add primarykeyfield field for primary key identification
            // This field stores the primary key field name for each table
            $table->string('primarykeyfield', 100)->nullable()->after('table_name');

            // Add index for performance
            $table->index('primarykeyfield');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_tables', function (Blueprint $table) {
            $table->dropIndex(['primarykeyfield']);
            $table->dropColumn('primarykeyfield');
        });
    }
};
