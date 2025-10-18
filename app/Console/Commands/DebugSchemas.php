<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DebugSchemas extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'debug:schemas';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Debug all schemas and their tables';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("🔍 Debugging all schemas and tables");
        $this->info("====================================");

        // Get all schema versions
        $allVersions = DB::table('schema_versions')
            ->orderBy('schema_id')
            ->orderBy('version_number', 'desc')
            ->get();
        
        $this->info("Found " . $allVersions->count() . " schema versions");
        
        // Group by schema_id to get only the latest version per schema
        $latestVersionsBySchema = [];
        foreach ($allVersions as $version) {
            if (!isset($latestVersionsBySchema[$version->schema_id]) || 
                $version->version_number > $latestVersionsBySchema[$version->schema_id]->version_number) {
                $latestVersionsBySchema[$version->schema_id] = $version;
            }
        }

        $this->info("\nLatest versions per schema:");
        foreach ($latestVersionsBySchema as $schemaId => $version) {
            $tables = DB::table('schema_tables')
                ->where('schema_version_id', $version->id)
                ->orderBy('table_name')
                ->get();
            
            $this->info("Schema ID: {$schemaId}, Version: {$version->version_number} - {$tables->count()} tables");
            foreach ($tables as $table) {
                $this->info("  - {$table->table_name}");
            }
        }

        $totalTables = 0;
        foreach ($latestVersionsBySchema as $schemaId => $version) {
            $tables = DB::table('schema_tables')
                ->where('schema_version_id', $version->id)
                ->count();
            $totalTables += $tables;
        }

        $this->info("\nSummary: " . count($latestVersionsBySchema) . " schemas with {$totalTables} total tables");

        return 0;
    }
}