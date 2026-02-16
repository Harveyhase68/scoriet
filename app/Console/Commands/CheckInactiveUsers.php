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
                            {--dry-run : Run without sending emails or updating database}
                            {--force : Force re-send notifications even if already sent}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for inactive free users and send warning emails before deactivation';

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

        $this->info('Checking for inactive users...');

        if ($dryRun) {
            $this->warn('DRY RUN MODE - No emails will be sent and no database changes will be made.');
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

        $this->info("Found {$users->count()} active free users to check.");

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

            $this->line("User {$user->email}: {$daysSinceLogin} days since last login");

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
                ['First warnings sent (90 days)', $stats['warning_1_sent']],
                ['Second warnings sent (105 days)', $stats['warning_2_sent']],
                ['Final warnings sent (117 days)', $stats['warning_final_sent']],
                ['Users deactivated (120 days)', $stats['deactivated']],
                ['Skipped (patron users)', $stats['skipped_patron']],
                ['Skipped (already notified)', $stats['skipped_already_notified']],
                ['Skipped (never logged in)', $stats['skipped_no_login']],
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
            $this->line("  - Already received first warning, skipping.");
            $stats['skipped_already_notified']++;
            return;
        }

        $daysRemaining = self::DAYS_DEACTIVATE - $user->getDaysSinceLastLogin();

        $this->info("  - Sending first inactivity warning ({$daysRemaining} days remaining)");

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
            $this->line("  - Already received second warning, skipping.");
            $stats['skipped_already_notified']++;
            return;
        }

        $daysRemaining = self::DAYS_DEACTIVATE - $user->getDaysSinceLastLogin();

        $this->info("  - Sending second inactivity warning ({$daysRemaining} days remaining)");

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
            $this->line("  - Already received final warning, skipping.");
            $stats['skipped_already_notified']++;
            return;
        }

        $daysRemaining = self::DAYS_DEACTIVATE - $user->getDaysSinceLastLogin();

        $this->warn("  - Sending FINAL inactivity warning ({$daysRemaining} days remaining!)");

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
        $this->error("  - DEACTIVATING user due to inactivity!");

        if (!$dryRun) {
            $user->deactivateDueToInactivity();
            $this->sendDeactivationEmail($user);

            Log::warning('User deactivated due to inactivity', [
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
            1 => 'Wir vermissen Sie! - Inaktivitätswarnung',
            2 => 'Dringend: Ihr Konto wird bald deaktiviert',
            'final' => "LETZTE WARNUNG: Konto wird in {$daysRemaining} Tagen deaktiviert!",
            default => 'Inaktivitätswarnung',
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
            Log::error('Failed to send inactivity warning email', [
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
                    ->subject('Ihr Konto wurde wegen Inaktivität deaktiviert');
            });

        } catch (\Exception $e) {
            $this->error(" Failed to send deactivation email: {$e->getMessage()}");
            Log::error('Failed to send deactivation email', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
