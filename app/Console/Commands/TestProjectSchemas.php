<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TestProjectSchemas extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:schemas {project_id}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test schema connections for a project';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $projectId = $this->argument('project_id');
        
        $this->info("🔍 Testing schema connections for project {$projectId}");
        $this->info("===========================================");

        // Get all available schemas
        $allSchemas = DB::table('schemas')->get();
        $this->info("All available schemas: " . $allSchemas->count());
        foreach ($allSchemas as $schema) {
            $this->info("  - Schema ID: {$schema->id}, Name: {$schema->name}");
        }

        // Get schemas connected to this project
        $projectSchemas = DB::table('project_schemas')
            ->where('project_id', $projectId)
            ->get();
        
        $this->info("\nProject schemas for project {$projectId}: " . $projectSchemas->count());
        foreach ($projectSchemas as $schema) {
            $schemaInfo = DB::table('schemas')->where('id', $schema->schema_id)->first();
            $this->info("  - Schema ID: {$schema->schema_id}, Name: " . ($schemaInfo->name ?? 'Unknown'));
        }

        // Get tables from connected schemas
        $this->info("\nTables from connected schemas:");
        $totalTables = 0;
        
        foreach ($projectSchemas as $projectSchema) {
            $schemaInfo = DB::table('schemas')->where('id', $projectSchema->schema_id)->first();
            $schemaName = $schemaInfo->name ?? 'Unknown';
            
            // Get the latest version for this schema
            $latestVersion = DB::table('schema_versions')
                ->where('schema_id', $projectSchema->schema_id)
                ->orderBy('version_number', 'desc')
                ->first();

            if ($latestVersion) {
                $tables = DB::table('schema_tables')
                    ->where('schema_version_id', $latestVersion->id)
                    ->orderBy('table_name')
                    ->get();
                
                $this->info("  Schema '{$schemaName}' (v{$latestVersion->version_number}): " . $tables->count() . " tables");
                foreach ($tables as $table) {
                    $this->info("    - {$table->table_name}");
                }
                $totalTables += $tables->count();
            } else {
                $this->info("  Schema '{$schemaName}': No versions found");
            }
        }

        $this->info("\nTotal tables from all connected schemas: {$totalTables}");

        return 0;
    }
}