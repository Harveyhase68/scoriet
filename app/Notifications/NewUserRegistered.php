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
        $registrationTime = $this->user->created_at->format('Y-m-d H:i:s');

        return (new MailMessage)
            ->subject('New Registration on Scoriet')
            ->greeting('Hello Admin!')
            ->line('A new user has registered on Scoriet:')
            ->line('')
            ->line('**User Information:**')
            ->line('• **Name:** ' . $this->user->name)
            ->line('• **Username:** ' . ($this->user->username ?? 'Not specified'))
            ->line('• **Email:** ' . $this->user->email)
            ->line('• **User ID:** ' . $this->user->id)
            ->line('• **Registered at:** ' . $registrationTime)
            ->line('')
            ->line('**Email Status:** ' . ($this->user->hasVerifiedEmail() ? 'Verified' : 'Not yet verified'))
            ->line('')
            ->action('View User in Admin Panel', config('app.url'))
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
            //
        ];
    }
}
