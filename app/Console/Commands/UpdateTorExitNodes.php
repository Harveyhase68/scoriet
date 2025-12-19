<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\RegistrationValidationService;

class UpdateTorExitNodes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'security:update-tor-nodes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update the Tor exit nodes list from torproject.org';

    /**
     * Execute the console command.
     */
    public function handle(RegistrationValidationService $validationService)
    {
        $this->info('Fetching Tor exit nodes from torproject.org...');

        try {
            $count = $validationService->updateTorExitNodes();

            if ($count > 0) {
                $this->info("Successfully updated Tor exit nodes list with {$count} nodes.");
                return 0;
            } else {
                $this->error('Failed to fetch Tor exit nodes or list is empty.');
                return 1;
            }
        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return 1;
        }
    }
}
