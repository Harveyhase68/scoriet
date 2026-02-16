<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CheckSubscriptionExpiry extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:check-expiry
                            {--dry-run : Run without sending emails or updating database}
                            {--force : Force re-send notifications even if already sent}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for expiring subscriptions and send bundled notification emails per user';

    // Maximum age of notification timestamps to be considered valid
    private const WARNING_MAX_AGE_DAYS = 30;      // First warning valid for 30 days
    private const FINAL_MAX_AGE_DAYS = 14;        // Final warning valid for 14 days
    private const EXPIRED_MAX_AGE_DAYS = 5;       // Expired notification valid for 5 days

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $force = $this->option('force');

        $this->info('Checking subscription expiry...');

        if ($dryRun) {
            $this->warn('DRY RUN MODE - No emails will be sent and no database changes will be made.');
        }

        $stats = [
            'users_notified' => 0,
            'warning_subscriptions' => 0,
            'final_subscriptions' => 0,
            'expired_subscriptions' => 0,
            'soft_locked' => 0,
            'skipped' => 0,
        ];

        // Get all active subscriptions with expiry dates, grouped by user
        $subscriptions = Subscription::where('is_active', true)
            ->whereNotNull('expires_at')
            ->where('is_free_tier', false) // Don't notify patrons (they have no expiry)
            ->with('user')
            ->get();

        $this->info("Found {$subscriptions->count()} active subscriptions to check.");

        // Group subscriptions by user and notification type
        $userNotifications = [];

        foreach ($subscriptions as $subscription) {
            if (!$subscription->user) {
                $this->warn("Subscription {$subscription->id} has no user, skipping.");
                $stats['skipped']++;
                continue;
            }

            $userId = $subscription->user_id;
            $daysUntilExpiry = $subscription->getDaysUntilExpiry();

            if (!isset($userNotifications[$userId])) {
                $userNotifications[$userId] = [
                    'user' => $subscription->user,
                    'warning' => [],    // 14 days before
                    'final' => [],      // 3 days before
                    'expired' => [],    // Already expired
                ];
            }

            // Already expired
            if ($daysUntilExpiry !== null && $daysUntilExpiry <= 0) {
                if (!$this->isExpiredNotificationValid($subscription) || $force) {
                    $userNotifications[$userId]['expired'][] = [
                        'subscription' => $subscription,
                        'days' => $daysUntilExpiry,
                    ];
                    $this->line("  - Subscription {$subscription->id} needs expired notification.");
                } else {
                    $this->line("  - Subscription {$subscription->id} already notified about expiry.");
                    $stats['skipped']++;
                }
                continue;
            }

            // Final warning (3 days before expiry)
            if ($daysUntilExpiry !== null && $daysUntilExpiry <= Subscription::EXPIRY_FINAL_DAYS) {
                if (!$this->isFinalWarningValid($subscription) || $force) {
                    $userNotifications[$userId]['final'][] = [
                        'subscription' => $subscription,
                        'days' => $daysUntilExpiry,
                    ];
                    $this->line("  - Subscription {$subscription->id} needs final warning.");
                } else {
                    $this->line("  - Subscription {$subscription->id} already received final warning.");
                    $stats['skipped']++;
                }
                continue;
            }

            // First warning (14 days before expiry)
            if ($daysUntilExpiry !== null && $daysUntilExpiry <= Subscription::EXPIRY_WARNING_DAYS) {
                if (!$this->isFirstWarningValid($subscription) || $force) {
                    $userNotifications[$userId]['warning'][] = [
                        'subscription' => $subscription,
                        'days' => $daysUntilExpiry,
                    ];
                    $this->line("  - Subscription {$subscription->id} needs first warning.");
                } else {
                    $this->line("  - Subscription {$subscription->id} already received first warning.");
                    $stats['skipped']++;
                }
                continue;
            }

            $stats['skipped']++;
        }

        // Now send bundled emails per user
        foreach ($userNotifications as $userId => $notifications) {
            $user = $notifications['user'];
            $hasNotifications = !empty($notifications['warning']) ||
                               !empty($notifications['final']) ||
                               !empty($notifications['expired']);

            if (!$hasNotifications) {
                continue;
            }

            $this->info("Processing notifications for user {$user->email}:");

            // Send bundled email for this user
            $emailSent = $this->sendBundledNotification(
                $user,
                $notifications['warning'],
                $notifications['final'],
                $notifications['expired'],
                $dryRun
            );

            if ($emailSent) {
                $stats['users_notified']++;
                $stats['warning_subscriptions'] += count($notifications['warning']);
                $stats['final_subscriptions'] += count($notifications['final']);
                $stats['expired_subscriptions'] += count($notifications['expired']);

                // Update timestamps for all subscriptions (even in bundled email)
                if (!$dryRun) {
                    $now = Carbon::now();

                    foreach ($notifications['warning'] as $item) {
                        $item['subscription']->update(['expiry_warning_sent_at' => $now]);
                    }

                    foreach ($notifications['final'] as $item) {
                        $item['subscription']->update(['expiry_final_sent_at' => $now]);
                    }

                    foreach ($notifications['expired'] as $item) {
                        $item['subscription']->update(['expired_notification_sent_at' => $now]);
                        $item['subscription']->checkAndApplySoftLock();
                        $stats['soft_locked']++;
                    }
                }
            }
        }

        $this->newLine();
        $this->info('Summary:');
        $this->table(
            ['Action', 'Count'],
            [
                ['Users notified (bundled emails)', $stats['users_notified']],
                ['Warning subscriptions (14 days)', $stats['warning_subscriptions']],
                ['Final warning subscriptions (3 days)', $stats['final_subscriptions']],
                ['Expired subscriptions', $stats['expired_subscriptions']],
                ['Subscriptions soft-locked', $stats['soft_locked']],
                ['Skipped', $stats['skipped']],
            ]
        );

        return Command::SUCCESS;
    }

    /**
     * Send a bundled notification email for all subscription types
     */
    private function sendBundledNotification(
        User $user,
        array $warningItems,
        array $finalItems,
        array $expiredItems,
        bool $dryRun
    ): bool {
        // Prepare subscription data for the email template
        $warningSubscriptions = array_map(fn($item) => [
            'subscription' => $item['subscription'],
            'displayName' => $this->getDisplayName($item['subscription']),
            'daysUntilExpiry' => $item['days'],
            'expiresAt' => $item['subscription']->expires_at->format('d.m.Y'),
        ], $warningItems);

        $finalSubscriptions = array_map(fn($item) => [
            'subscription' => $item['subscription'],
            'displayName' => $this->getDisplayName($item['subscription']),
            'daysUntilExpiry' => $item['days'],
            'expiresAt' => $item['subscription']->expires_at->format('d.m.Y'),
        ], $finalItems);

        $expiredSubscriptions = array_map(fn($item) => [
            'subscription' => $item['subscription'],
            'displayName' => $this->getDisplayName($item['subscription']),
            'expiredAt' => $item['subscription']->expires_at->format('d.m.Y'),
        ], $expiredItems);

        $totalCount = count($warningItems) + count($finalItems) + count($expiredItems);

        // Determine the most urgent level for subject line
        $urgencyLevel = 'warning';
        if (!empty($expiredItems)) {
            $urgencyLevel = 'expired';
        } elseif (!empty($finalItems)) {
            $urgencyLevel = 'final';
        }

        // Create appropriate subject line
        $subject = $this->getEmailSubject($urgencyLevel, $totalCount);

        $this->info(" Sending bundled email to {$user->email} ({$totalCount} subscriptions: " .
            count($warningItems) . " warning, " .
            count($finalItems) . " final, " .
            count($expiredItems) . " expired)");

        if ($dryRun) {
            return true;
        }

        try {
            Mail::send('emails.subscription-expiry-bundled', [
                'user' => $user,
                'warningSubscriptions' => $warningSubscriptions,
                'finalSubscriptions' => $finalSubscriptions,
                'expiredSubscriptions' => $expiredSubscriptions,
                'bonusDays' => Subscription::EARLY_RENEWAL_BONUS_DAYS,
                'renewUrl' => config('app.url') . '/app?action=renew-subscription',
                'totalCount' => $totalCount,
                'urgencyLevel' => $urgencyLevel,
            ], function ($message) use ($user, $subject) {
                $message->to($user->email, $user->name)
                    ->subject($subject);
            });

            return true;
        } catch (\Exception $e) {
            $this->error("  Failed to send email: {$e->getMessage()}");
            Log::error('Failed to send bundled subscription notification', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get the display name for a subscription
     */
    private function getDisplayName(Subscription $subscription): string
    {
        $typeName = $subscription->getTypeDisplayName();
        $entityName = $subscription->getEntityName();
        return $entityName ? "{$typeName}: {$entityName}" : $typeName;
    }

    /**
     * Get the email subject based on urgency level and count
     */
    private function getEmailSubject(string $urgencyLevel, int $totalCount): string
    {
        $countText = $totalCount === 1 ? 'Ein Abonnement' : "{$totalCount} Abonnements";

        return match ($urgencyLevel) {
            'expired' => "WICHTIG: {$countText} abgelaufen - Jetzt verlängern!",
            'final' => "DRINGEND: {$countText} läuft in Kürze ab!",
            default => "{$countText} läuft bald ab - Jetzt verlängern und Bonus sichern!",
        };
    }

    /**
     * Check if a notification timestamp is expired (too old to be considered valid)
     */
    private function isNotificationExpired(?Carbon $sentAt, int $maxAgeDays): bool
    {
        if (!$sentAt) {
            return false; // No timestamp = never sent, not "expired"
        }

        return $sentAt->diffInDays(Carbon::now()) > $maxAgeDays;
    }

    /**
     * Check if the first warning is still valid (sent within the last 30 days)
     */
    private function isFirstWarningValid(Subscription $subscription): bool
    {
        if (!$subscription->expiry_warning_sent_at) {
            return false;
        }

        return !$this->isNotificationExpired($subscription->expiry_warning_sent_at, self::WARNING_MAX_AGE_DAYS);
    }

    /**
     * Check if the final warning is still valid (sent within the last 14 days)
     */
    private function isFinalWarningValid(Subscription $subscription): bool
    {
        if (!$subscription->expiry_final_sent_at) {
            return false;
        }

        return !$this->isNotificationExpired($subscription->expiry_final_sent_at, self::FINAL_MAX_AGE_DAYS);
    }

    /**
     * Check if the expired notification is still valid (sent within the last 5 days)
     */
    private function isExpiredNotificationValid(Subscription $subscription): bool
    {
        if (!$subscription->expired_notification_sent_at) {
            return false;
        }

        return !$this->isNotificationExpired($subscription->expired_notification_sent_at, self::EXPIRED_MAX_AGE_DAYS);
    }
}
