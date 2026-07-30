<?php

namespace App\Mail;

use App\Models\DemoAccessRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DemoAccessMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public DemoAccessRequest $accessRequest;

    public function __construct(DemoAccessRequest $accessRequest)
    {
        $this->accessRequest = $accessRequest;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __('demoaccess.email_subject'),
            from: config('mail.from.address'),
        );
    }

    public function content(): Content
    {
        // Link points at the DEMO deployment (this mail is sent by main).
        $accessUrl = config('scoriet.demo_url') . '/demo-access/' . $this->accessRequest->token;

        return new Content(
            view: 'emails.demo-access',
            with: [
                'accessUrl' => $accessUrl,
                'expiresAt' => $this->accessRequest->expires_at,
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
