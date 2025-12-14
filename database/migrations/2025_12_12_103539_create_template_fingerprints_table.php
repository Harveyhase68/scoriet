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
        Schema::create('template_fingerprints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('templates')->onDelete('cascade');
            $table->foreignId('template_file_id')->constrained('template_files')->onDelete('cascade');

            // Fingerprint data
            $table->string('file_hash', 64); // SHA-256 hash of normalized content
            $table->longText('normalized_content')->nullable(); // Content without whitespace/comments for comparison
            $table->unsignedInteger('content_length'); // Length of normalized content
            $table->json('token_signature')->nullable(); // Array of significant tokens/patterns

            // Metadata for faster lookups
            $table->string('file_type', 50)->nullable(); // e.g., 'php', 'js', 'html'
            $table->boolean('is_significant')->default(true); // Skip trivial files

            $table->timestamps();

            // Indexes for fast plagiarism detection
            $table->index('file_hash');
            $table->index('template_id');
            $table->index(['file_hash', 'template_id']);
        });

        // Add fingerprint tracking to templates
        Schema::table('templates', function (Blueprint $table) {
            $table->boolean('fingerprints_generated')->default(false)->after('is_store_approved');
            $table->timestamp('fingerprints_generated_at')->nullable()->after('fingerprints_generated');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->dropColumn(['fingerprints_generated', 'fingerprints_generated_at']);
        });

        Schema::dropIfExists('template_fingerprints');
    }
};
