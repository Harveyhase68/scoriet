<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('addresses', function (Blueprint $table) {
            $table->foreign('pc_postal_code')->references('pc_postal_code')->on('postal_codes')->onUpdate('NO ACTION')->onDelete('NO ACTION');
            $table->foreign('count_iso2')->references('count_iso2')->on('countries')->onUpdate('NO ACTION')->onDelete('NO ACTION');
        });
    }

    public function down(): void
    {
        Schema::table('addresses', function (Blueprint $table) {
            $table->dropForeign('addresses_pc_postal_code_foreign');
            $table->dropForeign('addresses_count_iso2_foreign');
        });
    }
};
