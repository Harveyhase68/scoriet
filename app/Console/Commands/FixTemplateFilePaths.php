<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FixTemplateFilePaths extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'templates:fix-file-paths';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix empty file_path values in template_files table';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for template files with empty file_path...');
        
        // Find all files with empty file_path
        $emptyFiles = DB::table('template_files')
            ->where(function($query) {
                $query->whereNull('file_path')
                      ->orWhere('file_path', '');
            })
            ->get();

        $totalFiles = DB::table('template_files')->count();
        $emptyCount = $emptyFiles->count();

        $this->info("Found {$emptyCount} files with empty file_path out of {$totalFiles} total files");

        if ($emptyCount === 0) {
            $this->info('All template files already have file_path values!');
            return 0;
        }

        $this->info('Fixing empty file_path values...');
        
        $fixedCount = 0;
        foreach ($emptyFiles as $file) {
            // Use file_name as fallback for file_path
            $path = $file->file_name;
            
            // Create a proper path based on template
            $template = DB::table('templates')->find($file->template_id);
            if ($template) {
                $path = "templates/{$template->id}/{$file->file_name}";
            }
            
            // Update the file_path
            $updated = DB::table('template_files')
                ->where('id', $file->id)
                ->update(['file_path' => $path]);
                
            if ($updated) {
                $fixedCount++;
                $this->line("Fixed file ID {$file->id}: {$file->file_name} -> {$path}");
            }
        }

        $this->info("Successfully fixed {$fixedCount} template file paths!");
        
        return 0;
    }
}