<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
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

        // Restore from snapshot
        $result = $this->restoreFromSnapshot();

        if ($result === 0) {
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

        $command = sprintf(
            'mysqldump -h%s -P%s -u%s -p%s --single-transaction %s > %s 2>&1',
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

        // Import the snapshot
        $command = sprintf(
            'mysql -h%s -P%s -u%s -p%s %s < %s 2>&1',
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
