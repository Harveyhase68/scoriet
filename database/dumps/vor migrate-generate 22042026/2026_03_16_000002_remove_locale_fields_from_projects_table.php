<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn([
                'decimal_separator',
                'thousands_separator',
                'date_format',
                'time_format',
                'currency_symbol',
                'timezone',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('decimal_separator', 1)->nullable()->default(',')->after('description');
            $table->string('thousands_separator', 1)->nullable()->default('.')->after('decimal_separator');
            $table->string('date_format', 20)->nullable()->default('d.m.Y')->after('thousands_separator');
            $table->string('time_format', 20)->nullable()->default('H:i:s')->after('date_format');
            $table->string('currency_symbol', 5)->nullable()->default('€')->after('time_format');
            $table->string('timezone', 50)->nullable()->default('Europe/Vienna')->after('currency_symbol');
        });
    }
};
