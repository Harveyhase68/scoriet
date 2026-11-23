<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the owner of an existing account when someone tries to register
 * a new account with the same email address.
 *
 * The registration endpoint answers such attempts exactly like a successful
 * registration (no "already registered" oracle), so this mail is the only
 * place where the information appears - and it only reaches the real owner.
 */
class RegistrationAttemptForExistingAccount extends Notification
{
    use Queueable;

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
        return (new MailMessage)
            ->subject(__('registrationattempt_subject'))
            ->greeting(__('registrationattempt_greeting', ['name' => $notifiable->name]))
            ->line(__('registrationattempt_line1'))
            ->line(__('registrationattempt_line2'))
            ->action(__('registrationattempt_action'), url('/'))
            ->line(__('registrationattempt_line3'));
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [];
    }
}
