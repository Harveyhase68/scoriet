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
    protected $signature = 'demo:reset {--backup : Create backup before reset}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset demo database to initial state with fresh demo data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!app()->environment('local', 'demo')) {
            $this->error('Demo reset can only be run in local or demo environment!');
            return 1;
        }

        $this->info('🚀 Starting Demo Database Reset...');

        // Create backup if requested
        if ($this->option('backup')) {
            $this->createBackup();
        }

        // Reset database
        $this->resetDatabase();

        $this->info('✅ Demo database has been reset successfully!');
        $this->info('📊 Demo users available: demo-admin, demo-user');
        
        return 0;
    }

    private function createBackup()
    {
        $this->info('📦 Creating database backup...');
        
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');
        $host = config('database.connections.mysql.host');
        
        $filename = storage_path('app/demo_backup_' . date('Y-m-d_H-i-s') . '.sql');
        
        $command = "mysqldump -h{$host} -u{$username} -p{$password} {$database} > {$filename}";
        exec($command);
        
        $this->info("✅ Backup created: {$filename}");
    }

    private function resetDatabase()
    {
        $this->info('🗄️ Dropping all tables...');
        
        // Get all tables
        $tables = DB::select('SHOW TABLES');
        $databaseName = config('database.connections.mysql.database');
        $tableColumn = "Tables_in_{$databaseName}";
        
        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        // Drop all tables
        foreach ($tables as $table) {
            $tableName = $table->$tableColumn;
            DB::statement("DROP TABLE IF EXISTS `{$tableName}`");
        }
        
        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
        
        $this->info('🔄 Running migrations...');
        $this->call('migrate', ['--force' => true]);
        
        $this->info('🌱 Seeding demo data...');
        
        // Check if demo seeder exists, if not use basic seeder
        if (File::exists(database_path('seeders/DemoSeeder.php'))) {
            $this->call('db:seed', ['--class' => 'DemoSeeder', '--force' => true]);
        } else {
            $this->call('db:seed', ['--force' => true]);
        }
    }
}
