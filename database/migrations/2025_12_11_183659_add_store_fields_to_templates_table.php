<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            // Store-spezifische Felder - Verkäufer wählt Zahlungsart
            $table->enum('price_type', ['credits', 'euros'])->nullable()->after('visibility');
            $table->integer('price_credits')->nullable()->after('price_type');
            $table->decimal('price_euros', 8, 2)->nullable()->after('price_credits');
            $table->boolean('is_store_approved')->default(false)->after('price_euros');
            $table->unsignedBigInteger('sales_count')->default(0)->after('is_store_approved');
            $table->decimal('total_revenue', 12, 2)->default(0)->after('sales_count');

            // Clone-Schutz
            $table->boolean('is_from_store')->default(false)->after('original_template_id');
            $table->boolean('resale_allowed')->default(false)->after('is_from_store');
        });

        // Extend visibility ENUM to include 'store'
        DB::statement("ALTER TABLE templates MODIFY COLUMN visibility ENUM('private', 'public', 'store') DEFAULT 'private'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // First change visibility back to original enum
        DB::statement("ALTER TABLE templates MODIFY COLUMN visibility ENUM('private', 'public') DEFAULT 'private'");

        Schema::table('templates', function (Blueprint $table) {
            $table->dropColumn([
                'price_type',
                'price_credits',
                'price_euros',
                'is_store_approved',
                'sales_count',
                'total_revenue',
                'is_from_store',
                'resale_allowed',
            ]);
        });
    }
};
