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
            $table->string('file_name_renamed', 100)->nullable()->after('filekeyname');
            $table->string('file_name_short', 50)->nullable()->after('file_name_renamed');

            $table->index('file_name_renamed');
            $table->index('file_name_short');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_tables', function (Blueprint $table) {
            $table->dropIndex(['file_name_renamed']);
            $table->dropIndex(['file_name_short']);
            $table->dropColumn(['file_name_renamed', 'file_name_short']);
        });
    }
};
