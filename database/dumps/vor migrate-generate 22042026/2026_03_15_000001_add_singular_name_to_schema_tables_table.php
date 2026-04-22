<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schema_tables', function (Blueprint $table) {
            $table->string('singular_name', 100)->nullable()->after('table_name');
        });
    }

    public function down(): void
    {
        Schema::table('schema_tables', function (Blueprint $table) {
            $table->dropColumn('singular_name');
        });
    }
};
