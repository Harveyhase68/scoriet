<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('postal_codes', function (Blueprint $table) {
            $table->foreign('count_iso2')->references('count_iso2')->on('countries')->onUpdate('NO ACTION')->onDelete('NO ACTION');
        });
    }

    public function down(): void
    {
        Schema::table('postal_codes', function (Blueprint $table) {
            $table->dropForeign('postal_codes_count_iso2_foreign');
        });
    }
};
