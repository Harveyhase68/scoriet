<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class DemoReset extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'demo:reset
                            {--backup : Create backup before reset}
                            {--fallback : Use migrate+seed if no snapshot exists}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset demo database to initial state from snapshot';

    /**
     * The path to the demo snapshot.
     */
    protected string $snapshotPath;

    /**
     * Tables that should be preserved across demo resets.
     * Their data is backed up before reset and restored after.
     */
    protected array $preserveTables = [
        'visitor_logs',
        'performance_metrics',
    ];

    public function __construct()
    {
        parent::__construct();
        $this->snapshotPath = database_path('dumps/demo_snapshot.sql');
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!app()->environment('local', 'demo') && !config('scoriet.demo')) {
            $this->error('Demo reset can only be run in local or demo environment!');
            return 1;
        }

        $this->info('');
        $this->info('=== Demo Reset: ' . now()->format('Y-m-d H:i:s') . ' ===');
        $this->info('Starting Demo Database Reset...');

        // Check if snapshot exists
        if (!File::exists($this->snapshotPath)) {
            if ($this->option('fallback')) {
                $this->warn('No snapshot found. Using fallback method (migrate + seed)...');
                return $this->resetWithMigrations();
            }

            $this->error("No snapshot found at: {$this->snapshotPath}");
            $this->info('Create a snapshot first with: php artisan demo:snapshot');
            $this->info('Or use --fallback to reset with migrations instead.');
            return 1;
        }

        // Create backup if requested
        if ($this->option('backup')) {
            $this->createBackup();
        }

        // Preserve analytics data before reset
        $preservedData = $this->preserveTableData();

        // Restore from snapshot
        $result = $this->restoreFromSnapshot();

        if ($result === 0) {
            // Restore preserved analytics data
            $this->restoreTableData($preservedData);
            // Flush all caches (application cache, Redis, etc.)
            $this->info('Clearing all caches...');
            $this->callSilently('cache:clear');
            $this->callSilently('optimize:clear');
            Cache::flush();

            $this->info('Demo database has been reset successfully!');
            $this->info('Demo user available: demo-user / demo1234');
        }

        return $result;
    }

    /**
     * Create a backup of the current database state.
     */
    private function createBackup(): void
    {
        $this->info('Creating database backup...');

        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');
        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port', 3306);

        $filename = storage_path('app/demo_backup_' . date('Y-m-d_H-i-s') . '.sql');

        // Detect dump binary: prefer mariadb-dump, fallback to mysqldump
        $dumpBin = 'mysqldump';
        exec('which mariadb-dump 2>/dev/null', $whichOutput, $whichCode);
        if ($whichCode === 0) {
            $dumpBin = 'mariadb-dump';
        }

        $command = sprintf(
            '%s -h%s -P%s -u%s -p%s --single-transaction %s 2>/dev/null > %s',
            $dumpBin,
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($database),
            escapeshellarg($filename)
        );

        exec($command);
        $this->info("Backup created: {$filename}");
    }

    /**
     * Restore database from the snapshot file.
     */
    private function restoreFromSnapshot(): int
    {
        $this->info('Restoring database from snapshot...');

        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');
        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port', 3306);

        // First, drop all existing tables
        $this->dropAllTables();

        // Detect mysql binary: prefer mariadb, fallback to mysql
        $mysqlBin = 'mysql';
        exec('which mariadb 2>/dev/null', $whichOutput, $whichCode);
        if ($whichCode === 0) {
            $mysqlBin = 'mariadb';
        }

        // Import the snapshot — stderr separate to avoid deprecation warnings breaking output
        $command = sprintf(
            '%s -h%s -P%s -u%s -p%s %s < %s 2>&1',
            $mysqlBin,
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($database),
            escapeshellarg($this->snapshotPath)
        );

        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            $this->error('Failed to restore from snapshot!');
            $this->error(implode("\n", $output));
            return 1;
        }

        $this->info('Snapshot restored successfully.');
        return 0;
    }

    /**
     * Preserve data from tables that should survive the reset.
     *
     * @return array<string, array> Table name => rows
     */
    private function preserveTableData(): array
    {
        $preserved = [];

        foreach ($this->preserveTables as $table) {
            try {
                $rows = DB::table($table)->get()->map(fn ($row) => (array) $row)->all();
                $count = count($rows);
                if ($count > 0) {
                    $preserved[$table] = $rows;
                    $this->info("Preserved {$count} rows from {$table}.");
                }
            } catch (\Exception $e) {
                $this->warn("Could not preserve {$table}: {$e->getMessage()}");
            }
        }

        return $preserved;
    }

    /**
     * Restore previously preserved table data after reset.
     *
     * @param array<string, array> $preservedData
     */
    private function restoreTableData(array $preservedData): void
    {
        if (empty($preservedData)) {
            return;
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        foreach ($preservedData as $table => $rows) {
            try {
                // Clear any data the snapshot may have inserted
                DB::table($table)->truncate();

                // Insert in chunks to avoid memory issues with large datasets
                foreach (array_chunk($rows, 500) as $chunk) {
                    DB::table($table)->insert($chunk);
                }

                $this->info("Restored " . count($rows) . " rows to {$table}.");
            } catch (\Exception $e) {
                $this->warn("Could not restore {$table}: {$e->getMessage()}");
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    /**
     * Drop all tables in the database.
     */
    private function dropAllTables(): void
    {
        $this->info('Dropping existing tables...');

        $tables = DB::select('SHOW TABLES');
        $databaseName = config('database.connections.mysql.database');
        $tableColumn = "Tables_in_{$databaseName}";

        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        foreach ($tables as $table) {
            $tableName = $table->$tableColumn;
            DB::statement("DROP TABLE IF EXISTS `{$tableName}`");
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    /**
     * Fallback: Reset using migrations and seeders.
     */
    private function resetWithMigrations(): int
    {
        $this->info('Dropping all tables...');
        $this->dropAllTables();

        $this->info('Running migrations...');
        $this->call('migrate', ['--force' => true]);

        $this->info('Seeding demo data...');
        if (File::exists(database_path('seeders/DemoSeeder.php'))) {
            $this->call('db:seed', ['--class' => 'DemoSeeder', '--force' => true]);
        } else {
            $this->call('db:seed', ['--force' => true]);
        }

        $this->info('Demo database has been reset successfully (via migrations)!');
        $this->info('Demo user available: demo-user / demo1234');

        return 0;
    }
}
