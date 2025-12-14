<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\User;

class NewPatronSubscription extends Notification implements ShouldQueue
{
    use Queueable;

    protected $user;
    protected $patronType;
    protected $provider;

    /**
     * Create a new notification instance.
     */
    public function __construct(User $user, string $patronType, string $provider)
    {
        $this->user = $user;
        $this->patronType = $patronType;
        $this->provider = $provider;
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
        $subscriptionTime = now()->format('d.m.Y H:i:s');
        $planName = $this->patronType === 'annual' ? 'Patron Annual' : 'Patron Monthly';
        $providerName = ucfirst($this->provider);
        $emoji = $this->patronType === 'annual' ? '🎊' : '💎';

        return (new MailMessage)
            ->subject("{$emoji} Neues Patron-Abo: {$planName} via {$providerName}")
            ->greeting('Hallo!')
            ->line("Ein Benutzer hat ein **{$planName}** Abo abgeschlossen!")
            ->line('')
            ->line('**Abo-Details:**')
            ->line("• **Plan:** {$planName}")
            ->line("• **Zahlungsanbieter:** {$providerName}")
            ->line("• **Abgeschlossen am:** {$subscriptionTime}")
            ->line('')
            ->line('**Benutzerinformationen:**')
            ->line('• **Name:** ' . $this->user->name)
            ->line('• **Username:** ' . ($this->user->username ?? 'Nicht angegeben'))
            ->line('• **E-Mail:** ' . $this->user->email)
            ->line('• **User-ID:** ' . $this->user->id)
            ->line('')
            ->action('Scoriet öffnen', config('app.url'))
            ->line('Diese E-Mail wurde automatisch generiert.')
            ->salutation('💰 Cha-Ching! Viele Grüße vom Scoriet-System');
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
