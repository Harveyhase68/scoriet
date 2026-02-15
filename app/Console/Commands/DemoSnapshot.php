<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class DemoSnapshot extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'demo:snapshot {--force : Overwrite existing snapshot without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a snapshot of the current database state for demo reset';

    /**
     * The path where the snapshot will be stored.
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
        // Safety check - should only run when demo mode is OFF
        if (config('scoriet.demo')) {
            $this->error('Cannot create snapshot while demo mode is active!');
            $this->info('Set SCORIET_DEMO=false in .env, configure your demo data, then run this command.');
            return 1;
        }

        // Check if snapshot already exists
        if (File::exists($this->snapshotPath) && !$this->option('force')) {
            if (!$this->confirm('A snapshot already exists. Do you want to overwrite it?')) {
                $this->info('Snapshot creation cancelled.');
                return 0;
            }
        }

        $this->info('Creating demo database snapshot...');

        // Ensure dumps directory exists
        $dumpsDir = database_path('dumps');
        if (!File::isDirectory($dumpsDir)) {
            File::makeDirectory($dumpsDir, 0755, true);
        }

        // Get database credentials
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');
        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port', 3306);

        // Build mysqldump command
        $command = sprintf(
            'mysqldump -h%s -P%s -u%s -p%s --single-transaction --routines --triggers %s > %s 2>&1',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($database),
            escapeshellarg($this->snapshotPath)
        );

        // Execute mysqldump
        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            $this->error('Failed to create snapshot!');
            $this->error(implode("\n", $output));
            return 1;
        }

        // Verify snapshot was created and has content
        if (!File::exists($this->snapshotPath) || File::size($this->snapshotPath) < 1000) {
            $this->error('Snapshot file is empty or too small. Something went wrong.');
            return 1;
        }

        $sizeKb = round(File::size($this->snapshotPath) / 1024, 2);
        $this->info("Snapshot created successfully: {$this->snapshotPath}");
        $this->info("Snapshot size: {$sizeKb} KB");
        $this->newLine();
        $this->info('Next steps:');
        $this->info('1. Set SCORIET_DEMO=true in .env');
        $this->info('2. The scheduler will now restore this snapshot daily at 05:00');
        $this->info('3. Or run manually: php artisan demo:reset');

        return 0;
    }
}
