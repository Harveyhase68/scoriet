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
        Schema::create('cli_devices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->uuid('device_id')->unique();
            $table->string('device_name', 100);
            $table->string('platform', 20)->default('unknown'); // windows, linux, macos
            $table->string('hostname', 255)->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id', 'is_active']);
        });

        // Add target_device_id to cli_tasks
        Schema::table('cli_tasks', function (Blueprint $table) {
            $table->uuid('target_device_id')->nullable()->after('project_id');
            $table->index('target_device_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cli_tasks', function (Blueprint $table) {
            $table->dropIndex(['target_device_id']);
            $table->dropColumn('target_device_id');
        });
        Schema::dropIfExists('cli_devices');
    }
};
