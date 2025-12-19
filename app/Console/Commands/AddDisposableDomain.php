<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\RegistrationValidationService;

class AddDisposableDomain extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'security:add-disposable {domain : The domain to block}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Add a disposable email domain to the blocklist';

    /**
     * Execute the console command.
     */
    public function handle(RegistrationValidationService $validationService)
    {
        $domain = $this->argument('domain');

        if ($validationService->addDisposableDomain($domain)) {
            $this->info("Successfully added '{$domain}' to disposable email blocklist.");
            return 0;
        } else {
            $this->warn("Domain '{$domain}' is already in the blocklist or invalid.");
            return 1;
        }
    }
}
