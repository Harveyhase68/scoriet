<?php

namespace App\Jobs;

use App\Services\WebPushService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendPushNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        private array $userIds,
        private string $title,
        private string $body,
        private string $url = '/',
        private string $tag = ''
    ) {}

    public function handle(WebPushService $webPushService): void
    {
        try {
            $webPushService->sendToMultipleUsers(
                $this->userIds,
                $this->title,
                $this->body,
                $this->url,
                $this->tag
            );
        } catch (\Exception $e) {
            Log::error('Push notification job failed: ' . $e->getMessage());
            throw $e;
        }
    }
}
