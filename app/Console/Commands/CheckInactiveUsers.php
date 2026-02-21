<?php

namespace App\Console\Commands;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CheckInactiveUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:check-inactive
                            {--dry-run : Only simulate, do not send emails or deactivate}
                            {--force : Skip already-notified check and resend warnings}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for inactive users and send warning emails or deactivate accounts';

    // Inactivity thresholds (days since last login)
    private const DAYS_WARNING_1 = 90;     // First warning: 3 months
    private const DAYS_WARNING_2 = 105;    // Second warning: ~3.5 months (2 weeks later)
    private const DAYS_WARNING_FINAL = 117; // Final warning: ~4 months - 3 days
    private const DAYS_DEACTIVATE = 120;   // Deactivation: 4 months

    // Maximum age of notification timestamps to be considered valid
    private const WARNING_1_MAX_AGE_DAYS = 30;
    private const WARNING_2_MAX_AGE_DAYS = 14;
    private const WARNING_FINAL_MAX_AGE_DAYS = 7;

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $force = $this->option('force');

        $this->info(__('checkinactiveusersphp48'));

        if ($dryRun) {
            $this->warn(__('checkinactiveusersphp51'));
        }

        $stats = [
            'warning_1_sent' => 0,
            'warning_2_sent' => 0,
            'warning_final_sent' => 0,
            'deactivated' => 0,
            'skipped_patron' => 0,
            'skipped_already_notified' => 0,
            'skipped_no_login' => 0,
        ];

        // Get all active free users who have logged in at least once
        // Exclude: patrons, admins, system users, already deactivated users
        $users = User::where('is_active', true)
            ->whereNotNull('last_login_at')
            ->where(function ($query) {
                $query->where('user_type', 'free')
                    ->orWhereNull('user_type');
            })
            ->get();

        $this->info(__('checkinactiveusersphp74')."{$users->count()}".__('checkinactiveusersphp74_2'));

        foreach ($users as $user) {
            // Double-check: skip patrons (in case user_type changed)
            if ($user->isPatron()) {
                $stats['skipped_patron']++;
                continue;
            }

            $daysSinceLogin = $user->getDaysSinceLastLogin();

            if ($daysSinceLogin === null) {
                $stats['skipped_no_login']++;
                continue;
            }

            $this->line(__('checkinactiveusersphp90')."{$user->email}: {$daysSinceLogin}".__('checkinactiveusersphp90_2'));

            // Check which action to take based on inactivity period
            if ($daysSinceLogin >= self::DAYS_DEACTIVATE) {
                // Deactivate user
                $this->handleDeactivation($user, $dryRun, $stats);
            } elseif ($daysSinceLogin >= self::DAYS_WARNING_FINAL) {
                // Final warning (3 days before deactivation)
                $this->handleFinalWarning($user, $dryRun, $force, $stats);
            } elseif ($daysSinceLogin >= self::DAYS_WARNING_2) {
                // Second warning (2 weeks before deactivation)
                $this->handleWarning2($user, $dryRun, $force, $stats);
            } elseif ($daysSinceLogin >= self::DAYS_WARNING_1) {
                // First warning (4 weeks before deactivation)
                $this->handleWarning1($user, $dryRun, $force, $stats);
            }
        }

        $this->newLine();
        $this->info('Summary:');
        $this->table(
            ['Action', 'Count'],
            [
                [__('checkinactiveusersphp113'), $stats['warning_1_sent']],
                [__('checkinactiveusersphp114'), $stats['warning_2_sent']],
                [__('checkinactiveusersphp115'), $stats['warning_final_sent']],
                [__('checkinactiveusersphp116'), $stats['deactivated']],
                [__('checkinactiveusersphp117'), $stats['skipped_patron']],
                [__('checkinactiveusersphp118'), $stats['skipped_already_notified']],
                [__('checkinactiveusersphp119'), $stats['skipped_no_login']],
            ]
        );

        return Command::SUCCESS;
    }

    /**
     * Handle first warning (90 days)
     */
    private function handleWarning1(User $user, bool $dryRun, bool $force, array &$stats): void
    {
        // Check if already sent and still valid
        if (!$force && $this->isWarningValid($user->inactivity_warning_1_sent_at, self::WARNING_1_MAX_AGE_DAYS)) {
            $this->line(__('checkinactiveusersphp133'));
            $stats['skipped_already_notified']++;
            return;
        }

        $daysRemaining = self::DAYS_DEACTIVATE - $user->getDaysSinceLastLogin();

        $this->info(__('checkinactiveusersphp140')."({$daysRemaining}".__('checkinactiveusersphp140_2'));

        if (!$dryRun) {
            $this->sendWarningEmail($user, 1, $daysRemaining);
            $user->update(['inactivity_warning_1_sent_at' => now()]);
        }

        $stats['warning_1_sent']++;
    }

    /**
     * Handle second warning (105 days)
     */
    private function handleWarning2(User $user, bool $dryRun, bool $force, array &$stats): void
    {
        // Check if already sent and still valid
        if (!$force && $this->isWarningValid($user->inactivity_warning_2_sent_at, self::WARNING_2_MAX_AGE_DAYS)) {
            $this->line(__('checkinactiveusersphp157'));
            $stats['skipped_already_notified']++;
            return;
        }

        $daysRemaining = self::DAYS_DEACTIVATE - $user->getDaysSinceLastLogin();

        $this->info(__('checkinactiveusersphp164')."({$daysRemaining}".__('checkinactiveusersphp164_2'));

        if (!$dryRun) {
            $this->sendWarningEmail($user, 2, $daysRemaining);
            $user->update(['inactivity_warning_2_sent_at' => now()]);
        }

        $stats['warning_2_sent']++;
    }

    /**
     * Handle final warning (117 days)
     */
    private function handleFinalWarning(User $user, bool $dryRun, bool $force, array &$stats): void
    {
        // Check if already sent and still valid
        if (!$force && $this->isWarningValid($user->inactivity_warning_final_sent_at, self::WARNING_FINAL_MAX_AGE_DAYS)) {
            $this->line(__('checkinactiveusersphp181'));
            $stats['skipped_already_notified']++;
            return;
        }

        $daysRemaining = self::DAYS_DEACTIVATE - $user->getDaysSinceLastLogin();

        $this->warn(__('checkinactiveusersphp188')."({$daysRemaining}".__('checkinactiveusersphp188_2').")");

        if (!$dryRun) {
            $this->sendWarningEmail($user, 'final', $daysRemaining);
            $user->update(['inactivity_warning_final_sent_at' => now()]);
        }

        $stats['warning_final_sent']++;
    }

    /**
     * Handle deactivation (120 days)
     */
    private function handleDeactivation(User $user, bool $dryRun, array &$stats): void
    {
        $this->error(__('checkinactiveusersphp203'));

        if (!$dryRun) {
            $user->deactivateDueToInactivity();
            $this->sendDeactivationEmail($user);

            Log::warning(__('checkinactiveusersphp209'), [
                'user_id' => $user->id,
                'email' => $user->email,
                'last_login_at' => $user->last_login_at,
                'days_inactive' => $user->getDaysSinceLastLogin(),
            ]);
        }

        $stats['deactivated']++;
    }

    /**
     * Check if a warning notification is still valid (not too old)
     */
    private function isWarningValid(?Carbon $sentAt, int $maxAgeDays): bool
    {
        if (!$sentAt) {
            return false; // Never sent
        }

        return $sentAt->diffInDays(Carbon::now()) <= $maxAgeDays;
    }

    /**
     * Send inactivity warning email
     */
    private function sendWarningEmail(User $user, int|string $warningLevel, int $daysRemaining): void
    {
        $templateName = match ($warningLevel) {
            1 => 'emails.inactivity-warning-1',
            2 => 'emails.inactivity-warning-2',
            'final' => 'emails.inactivity-warning-final',
            default => 'emails.inactivity-warning-1',
        };

        $subject = match ($warningLevel) {
            1 => __('checkinactiveusersphp245'),
            2 => __('checkinactiveusersphp246'),
            'final' => __('checkinactiveusersphp247')."{$daysRemaining}".__('checkinactiveusersphp247_2'),
            default => __('checkinactiveusersphp248'),
        };

        try {
            Mail::send($templateName, [
                'user' => $user,
                'daysRemaining' => $daysRemaining,
                'lastLoginAt' => $user->last_login_at->format('d.m.Y'),
                'loginUrl' => config('app.url'),
                'warningLevel' => $warningLevel,
            ], function ($message) use ($user, $subject) {
                $message->to($user->email, $user->name)
                    ->subject($subject);
            });

        } catch (\Exception $e) {
            $this->error(" Failed to send email: {$e->getMessage()}");
            Log::error(__('checkinactiveusersphp265'), [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send deactivation notification email
     */
    private function sendDeactivationEmail(User $user): void
    {
        try {
            Mail::send('emails.account-deactivated', [
                'user' => $user,
                'lastLoginAt' => $user->last_login_at->format('d.m.Y'),
                'loginUrl' => config('app.url'),
            ], function ($message) use ($user) {
                $message->to($user->email, $user->name)
                    ->subject(__('checkinactiveusersphp284'));
            });

        } catch (\Exception $e) {
            $this->error(__('checkinactiveusersphp288')."{$e->getMessage()}");
            Log::error(__('checkinactiveusersphp289'), [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
