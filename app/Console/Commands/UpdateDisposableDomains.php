<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class UpdateDisposableDomains extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'security:update-disposable-domains';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update disposable email domains list from GitHub repository';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fetching disposable email domains from GitHub...');

        try {
            $url = 'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf';

            $context = stream_context_create([
                'http' => [
                    'timeout' => 30,
                    'user_agent' => 'Scoriet/1.0',
                ],
            ]);

            $content = file_get_contents($url, false, $context);

            if (!$content) {
                $this->error('Failed to fetch disposable domains list.');
                return 1;
            }

            // Parse domains (one per line, skip comments and empty lines)
            $lines = explode("\n", $content);
            $domains = [];

            foreach ($lines as $line) {
                $line = trim($line);
                // Skip empty lines and comments
                if (empty($line) || str_starts_with($line, '#')) {
                    continue;
                }
                $domains[] = strtolower($line);
            }

            if (empty($domains)) {
                $this->error('No domains found in the list.');
                return 1;
            }

            // Save to file
            $filePath = storage_path('app/disposable_email_domains.txt');
            file_put_contents($filePath, implode("\n", $domains));

            // Clear cache
            cache()->forget('disposable_email_domains');

            $count = count($domains);
            $this->info("Successfully updated disposable email domains list with {$count} domains.");

            // Show some stats
            $this->line('');
            $this->line("File saved to: {$filePath}");
            $this->line("First 10 domains: " . implode(', ', array_slice($domains, 0, 10)) . '...');

            return 0;
        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return 1;
        }
    }
}
