<?php

namespace App\Services;

use App\Models\PushSubscription;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use Illuminate\Support\Facades\Log;

class WebPushService
{
    private WebPush $webPush;

    public function __construct()
    {
        $auth = [
            'VAPID' => [
                'subject' => config('services.webpush.subject'),
                'publicKey' => config('services.webpush.public_key'),
                'privateKey' => config('services.webpush.private_key'),
            ],
        ];

        $this->webPush = new WebPush($auth);
        $this->webPush->setReuseVAPIDHeaders(true);
    }

    /**
     * Send push notification to a single user (all their devices)
     */
    public function sendToUser(int $userId, string $title, string $body, string $url = '/', string $tag = ''): void
    {
        $subscriptions = PushSubscription::where('user_id', $userId)->get();

        if ($subscriptions->isEmpty()) {
            return;
        }

        $payload = json_encode([
            'title' => $title,
            'body' => $body,
            'url' => $url,
            'tag' => $tag,
            'icon' => '/icons/icon-192x192.png',
            'badge' => '/icons/icon-96x96.png',
        ]);

        foreach ($subscriptions as $pushSub) {
            $subscription = Subscription::create([
                'endpoint' => $pushSub->endpoint,
                'publicKey' => $pushSub->p256dh_key,
                'authToken' => $pushSub->auth_token,
            ]);

            $this->webPush->queueNotification($subscription, $payload);
        }

        $this->processResults($subscriptions);
    }

    /**
     * Send push notification to multiple users
     */
    public function sendToMultipleUsers(array $userIds, string $title, string $body, string $url = '/', string $tag = ''): void
    {
        foreach ($userIds as $userId) {
            $this->sendToUser($userId, $title, $body, $url, $tag);
        }
    }

    /**
     * Process queued notifications and clean up expired subscriptions
     */
    private function processResults($subscriptions): void
    {
        $subscriptionsList = $subscriptions->values()->all();
        $index = 0;

        foreach ($this->webPush->flush() as $report) {
            if (!$report->isSuccess()) {
                $statusCode = $report->getResponse() ? $report->getResponse()->getStatusCode() : null;

                // 404 or 410 = subscription expired/invalid, remove it
                if ($statusCode === 404 || $statusCode === 410) {
                    if (isset($subscriptionsList[$index])) {
                        $subscriptionsList[$index]->delete();
                        Log::info('Removed expired push subscription', [
                            'user_id' => $subscriptionsList[$index]->user_id,
                            'status' => $statusCode,
                        ]);
                    }
                } else {
                    Log::warning('Push notification failed', [
                        'endpoint' => $report->getEndpoint(),
                        'reason' => $report->getReason(),
                        'status' => $statusCode,
                    ]);
                }
            }

            $index++;
        }
    }
}
