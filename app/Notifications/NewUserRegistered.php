<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\User;

class NewUserRegistered extends Notification
{
    use Queueable;

    protected $user;

    /**
     * Create a new notification instance.
     */
    public function __construct(User $user)
    {
        $this->user = $user;
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
        $registrationTime = $this->user->created_at->format('d.m.Y H:i:s');
        
        return (new MailMessage)
            ->subject('🎉 Neue Registrierung auf Scoriet')
            ->greeting('Hallo Admin!')
            ->line('Es hat sich ein neuer Benutzer auf Scoriet registriert:')
            ->line('')
            ->line('**Benutzerinformationen:**')
            ->line('• **Name:** ' . $this->user->name)
            ->line('• **Username:** ' . ($this->user->username ?? 'Nicht angegeben'))
            ->line('• **E-Mail:** ' . $this->user->email)
            ->line('• **User-ID:** ' . $this->user->id)
            ->line('• **Registriert am:** ' . $registrationTime)
            ->line('')
            ->line('**E-Mail Status:** ' . ($this->user->hasVerifiedEmail() ? '✅ Bestätigt' : '⏳ Noch nicht bestätigt'))
            ->line('')
            ->action('User in Admin-Panel anzeigen', config('app.url'))
            ->line('Diese E-Mail wurde automatisch generiert.')
            ->salutation('Viele Grüße vom Scoriet-System');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
