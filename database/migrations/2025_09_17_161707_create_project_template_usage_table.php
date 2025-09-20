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
        if (!Schema::hasTable('project_template_usage')) {
            Schema::create('project_template_usage', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
                $table->foreignId('template_id')->constrained('templates')->onDelete('cascade');
                $table->enum('usage_type', ['linked', 'cloned']); // linked = use, cloned = clone
                $table->string('alias')->nullable(); // Optional custom name for the template in this project
                $table->json('config')->nullable(); // Template-specific configuration
                $table->boolean('is_active')->default(true);
                $table->timestamp('used_at')->useCurrent();
                $table->timestamps();

                // Indexes for performance
                $table->index(['project_id', 'usage_type']);
                $table->index(['template_id', 'usage_type']);
            });

            // Add unique constraint separately with existence check
            $indexName = 'project_template_unique';
            if (!$this->indexExists('project_template_usage', $indexName)) {
                Schema::table('project_template_usage', function (Blueprint $table) use ($indexName) {
                    $table->unique(['project_id', 'template_id'], $indexName);
                });
            }
        }
    }

    /**
     * Check if an index exists on a table
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $connection = Schema::getConnection();

        switch ($connection->getDriverName()) {
            case 'sqlite':
                $indexes = $connection->select("PRAGMA index_list($table)");
                foreach ($indexes as $index) {
                    if ($index->name === $indexName) {
                        return true;
                    }
                }
                return false;

            case 'mysql':
                $indexes = $connection->select("SHOW INDEX FROM $table WHERE Key_name = ?", [$indexName]);
                return count($indexes) > 0;

            case 'pgsql':
                $indexes = $connection->select("SELECT indexname FROM pg_indexes WHERE tablename = ? AND indexname = ?", [$table, $indexName]);
                return count($indexes) > 0;

            default:
                return false;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_template_usage');
    }
};
