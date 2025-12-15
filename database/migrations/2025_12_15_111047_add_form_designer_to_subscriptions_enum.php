<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds 'form_designer' to the subscription_type enum and migrates
     * existing data from user_form_designer_access table.
     */
    public function up(): void
    {
        // 1. Add 'form_designer' to the subscription_type enum
        DB::statement("ALTER TABLE subscriptions MODIFY COLUMN subscription_type ENUM('project', 'schema', 'team', 'template', 'cli', 'service', 'bundle', 'form_designer')");

        // 2. Migrate existing data from user_form_designer_access
        if (Schema::hasTable('user_form_designer_access')) {
            $existingAccess = DB::table('user_form_designer_access')->get();

            foreach ($existingAccess as $access) {
                // Check if subscription already exists
                $exists = DB::table('subscriptions')
                    ->where('user_id', $access->user_id)
                    ->where('subscription_type', 'form_designer')
                    ->exists();

                if (!$exists) {
                    DB::table('subscriptions')->insert([
                        'user_id' => $access->user_id,
                        'subscription_type' => 'form_designer',
                        'entity_id' => null, // Form Designer is a feature, not entity-based
                        'is_free_tier' => $access->access_type === 'patron',
                        'is_active' => true,
                        'is_soft_locked' => false,
                        'expires_at' => $access->expires_at,
                        'created_at' => $access->granted_at ?? $access->created_at ?? now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // 3. Drop the old table
            Schema::dropIfExists('user_form_designer_access');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Recreate the old table
        Schema::create('user_form_designer_access', function ($table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->enum('access_type', ['credits', 'patron']);
            $table->integer('credits_paid')->default(0);
            $table->string('patron_level', 50)->nullable();
            $table->timestamp('granted_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique('user_id');
        });

        // 2. Migrate data back
        $subscriptions = DB::table('subscriptions')
            ->where('subscription_type', 'form_designer')
            ->get();

        foreach ($subscriptions as $sub) {
            DB::table('user_form_designer_access')->insert([
                'user_id' => $sub->user_id,
                'access_type' => $sub->is_free_tier ? 'patron' : 'credits',
                'credits_paid' => $sub->is_free_tier ? 0 : 50,
                'patron_level' => $sub->is_free_tier ? 'monthly' : null,
                'granted_at' => $sub->created_at,
                'expires_at' => $sub->expires_at,
                'created_at' => $sub->created_at,
                'updated_at' => $sub->updated_at,
            ]);
        }

        // 3. Delete form_designer subscriptions
        DB::table('subscriptions')->where('subscription_type', 'form_designer')->delete();

        // 4. Remove 'form_designer' from enum
        DB::statement("ALTER TABLE subscriptions MODIFY COLUMN subscription_type ENUM('project', 'schema', 'team', 'template', 'cli', 'service', 'bundle')");
    }
};
