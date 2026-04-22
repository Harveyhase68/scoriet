<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('template_files', function (Blueprint $table) {
            $table->unsignedInteger('version')->default(1)->after('template_id');
        });
    }

    public function down(): void
    {
        Schema::table('template_files', function (Blueprint $table) {
            $table->dropColumn('version');
        });
    }
};
