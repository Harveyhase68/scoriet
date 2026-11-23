<?php

namespace App\Console\Commands;

use App\Services\AuthFail2Ban;
use Illuminate\Console\Command;

class AuthBan extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'security:auth-ban
                            {ip : The client IP address}
                            {--unban : Lift an active ban}
                            {--reset : With --unban: also forget the escalation level}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Show or lift the auth fail2ban state of an IP address';

    /**
     * Execute the console command.
     */
    public function handle(AuthFail2Ban $fail2ban): int
    {
        $ip = (string) $this->argument('ip');

        if ($this->option('unban')) {
            $fail2ban->unban($ip, (bool) $this->option('reset'));
            $this->info("Unbanned {$ip}".($this->option('reset') ? ' (escalation level reset)' : '').'.');
        }

        $status = $fail2ban->status($ip);

        $this->table(['IP', 'Banned until', 'Bans so far', 'Recent failures'], [[
            $ip,
            $status['banned_until'] ? date('Y-m-d H:i:s', $status['banned_until']) : '-',
            $status['level'],
            $status['recent_failures'],
        ]]);

        return self::SUCCESS;
    }
}
