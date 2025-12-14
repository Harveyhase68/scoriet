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
        // First, update any existing premium/business users to free
        DB::table('users')
            ->whereIn('user_type', ['premium', 'business'])
            ->update(['user_type' => 'free']);

        // Add new columns
        Schema::table('users', function (Blueprint $table) {
            $table->integer('credits')->default(50)->after('language');
            $table->enum('patron_type', ['annual', 'monthly'])->nullable()->after('credits');
        });

        // Drop premium_expires_at column
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('premium_expires_at');
        });

        // Modify user_type enum to remove 'premium' and 'business'
        // This is MySQL-specific, for other databases you'd need different approach
        $databaseType = DB::getDriverName();

        if ($databaseType === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN user_type ENUM('free', 'patron', 'admin', 'system') NOT NULL DEFAULT 'free'");
        } elseif ($databaseType === 'pgsql') {
            // PostgreSQL approach
            DB::statement("ALTER TABLE users ALTER COLUMN user_type TYPE VARCHAR(20)");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_user_type_check CHECK (user_type IN ('free', 'patron', 'admin', 'system'))");
        } elseif ($databaseType === 'sqlite') {
            // SQLite doesn't support ALTER COLUMN, so we'll leave it as-is
            // The constraint is only enforced at the application level
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $databaseType = DB::getDriverName();

        // Restore user_type enum with premium and business
        if ($databaseType === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN user_type ENUM('free', 'premium', 'business', 'patron', 'admin', 'system') NOT NULL DEFAULT 'free'");
        }

        // Add back premium_expires_at column
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('premium_expires_at')->nullable()->after('language');
        });

        // Drop new columns
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['credits', 'patron_type']);
        });
    }
};
