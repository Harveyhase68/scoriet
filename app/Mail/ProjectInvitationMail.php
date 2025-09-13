<?php

namespace App\Mail;

use App\Models\ProjectInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProjectInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public ProjectInvitation $invitation;

    /**
     * Create a new message instance.
     */
    public function __construct(ProjectInvitation $invitation)
    {
        $this->invitation = $invitation->load(['project', 'inviter']);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "You're invited to join {$this->invitation->project->name} on Scoriet",
            from: config('mail.from.address'),
            replyTo: $this->invitation->inviter->email,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.project-invitation',
            with: [
                'invitation' => $this->invitation,
                'project' => $this->invitation->project,
                'inviter' => $this->invitation->inviter,
                'acceptUrl' => $this->invitation->getAcceptUrl(),
                'declineUrl' => $this->invitation->getDeclineUrl(),
                'expiresAt' => $this->invitation->expires_at,
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
