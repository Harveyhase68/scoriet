<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->foreign('addr_no')->references('addr_no')->on('addresses')->onUpdate('NO ACTION')->onDelete('NO ACTION');
            $table->foreign('cust_no')->references('cust_no')->on('customers')->onUpdate('NO ACTION')->onDelete('NO ACTION');
        });
    }

    public function down(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->dropForeign('customer_addresses_addr_no_foreign');
            $table->dropForeign('customer_addresses_cust_no_foreign');
        });
    }
};
