<?php

namespace App\Notifications;

use App\Models\User;
use App\Support\PricingCatalog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewPatronSubscription extends Notification implements ShouldQueue
{
    use Queueable;

    protected $user;

    protected $patronType;

    protected $provider;

    /** 'month' | 'year', null when unknown */
    protected $billingInterval;

    /**
     * Create a new notification instance.
     */
    public function __construct(User $user, string $patronType, string $provider, ?string $billingInterval = null)
    {
        $this->user = $user;
        $this->patronType = $patronType;
        $this->provider = $provider;
        $this->billingInterval = $billingInterval;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $subscriptionTime = now()->format('Y-m-d H:i:s');
        $plan = array_search($this->patronType, PricingCatalog::PATRON_TYPES, true);
        $planName = $plan !== false
            ? PricingCatalog::displayName($plan, $this->billingInterval)
            : PricingCatalog::nameForPatronType($this->patronType);
        $providerName = ucfirst($this->provider);

        return (new MailMessage)
            ->subject("New Subscription: {$planName} via {$providerName}")
            ->greeting('Hello!')
            ->line("A user has subscribed to **{$planName}**!")
            ->line('')
            ->line('**Subscription Details:**')
            ->line("• **Plan:** {$planName}")
            ->line("• **Payment Provider:** {$providerName}")
            ->line("• **Subscribed at:** {$subscriptionTime}")
            ->line('')
            ->line('**User Information:**')
            ->line('• **Name:** '.$this->user->name)
            ->line('• **Username:** '.($this->user->username ?? 'Not specified'))
            ->line('• **Email:** '.$this->user->email)
            ->line('• **User ID:** '.$this->user->id)
            ->line('')
            ->action('Open Scoriet', config('app.url'))
            ->line('This email was generated automatically.')
            ->salutation('Best regards, Scoriet System');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'user_id' => $this->user->id,
            'patron_type' => $this->patronType,
            'provider' => $this->provider,
        ];
    }
}
