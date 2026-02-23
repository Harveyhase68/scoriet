<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Removes 'admin' from user_type enum, replacing all 'admin' entries with 'system'.
     * We standardized on 'system' as the sole administrative user type.
     */
    public function up(): void
    {
        // First, update any existing 'admin' users to 'system'
        DB::table('users')->where('user_type', 'admin')->update(['user_type' => 'system']);

        // Then modify the enum to remove 'admin'
        DB::statement("ALTER TABLE users MODIFY COLUMN user_type ENUM('free', 'patron', 'system') NOT NULL DEFAULT 'free'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-add 'admin' to the enum (no data change needed)
        DB::statement("ALTER TABLE users MODIFY COLUMN user_type ENUM('free', 'patron', 'admin', 'system') NOT NULL DEFAULT 'free'");
    }
};
