<?php

namespace App\Mail;

use App\Models\Message;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewMessageMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Message $message;
    public User $recipient;

    /**
     * Create a new message instance.
     */
    public function __construct(Message $message, User $recipient)
    {
        $this->message = $message->load(['sender', 'thread', 'attachments']);
        $this->recipient = $recipient;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $senderName = $this->message->sender->name ?? 'Ein Benutzer';
        $subject = $this->message->thread->is_broadcast
            ? "[Scoriet System] {$this->message->thread->subject}"
            : "Neue Nachricht von {$senderName}: {$this->message->thread->subject}";

        return new Envelope(
            subject: $subject,
            from: config('mail.from.address'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $viewUrl = config('app.url') . '?panel=messaging&thread=' . $this->message->thread_id;

        return new Content(
            view: 'emails.new-message',
            with: [
                'userMessage' => $this->message,  // Renamed: 'message' is reserved in Blade email templates
                'sender' => $this->message->sender,
                'recipient' => $this->recipient,
                'thread' => $this->message->thread,
                'viewUrl' => $viewUrl,
                'preview' => $this->message->getPreview(200),
                'attachments' => $this->message->attachments,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
