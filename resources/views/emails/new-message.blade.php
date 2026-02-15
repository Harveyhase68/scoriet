<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Neue Nachricht - {{ $thread->subject }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .sender-info {
            background: #f3f4f6;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 6px 6px 0;
        }
        .sender-name {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 5px;
        }
        .subject {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 10px;
        }
        .message-preview {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
            color: #1f2937;
            font-style: italic;
        }
        .broadcast-badge {
            display: inline-block;
            background: #ef4444;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .actions {
            text-align: center;
            margin: 30px 0;
        }
        .btn {
            display: inline-block;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.2s ease;
            background: #2563eb;
            color: white;
        }
        .btn:hover {
            background: #1d4ed8;
            color: white;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .timestamp {
            color: #9ca3af;
            font-size: 14px;
            margin-top: 10px;
        }
        .attachments {
            background: #eff6ff;
            border: 1px solid #3b82f6;
            border-radius: 6px;
            padding: 15px 20px;
            margin: 20px 0;
        }
        .attachments-title {
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .attachment-item {
            display: flex;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #dbeafe;
        }
        .attachment-item:last-child {
            border-bottom: none;
        }
        .attachment-link {
            text-decoration: none;
            color: inherit;
            display: flex;
            align-items: center;
            width: 100%;
        }
        .attachment-link:hover {
            color: #2563eb;
        }
        .attachment-link:hover .attachment-name {
            color: #2563eb;
            text-decoration: underline;
        }
        .attachment-icon {
            width: 32px;
            height: 32px;
            background: #3b82f6;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            margin-right: 12px;
            flex-shrink: 0;
        }
        .attachment-info {
            flex: 1;
        }
        .attachment-name {
            font-weight: 500;
            color: #1f2937;
            word-break: break-word;
        }
        .attachment-size {
            font-size: 12px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Scoriet</div>
            @if($thread->is_broadcast)
                <span class="broadcast-badge">SYSTEM-NACHRICHT</span>
            @endif
            <h1 class="title">{{__('new-messagebladephp179')}}</h1>
        </div>

        <p>Hallo {{ $recipient->name }},</p>

        <p>{{ __('new-messagebladephp184') }}</p>

        <div class="sender-info">
            <div class="sender-name">{{ __('new-messagebladephp187') }}{{ $sender->name ?? 'Scoriet System' }}</div>
            @if($sender->username)
                <div style="color: #6b7280; font-size: 14px;">@{{ $sender->username }}</div>
            @endif
            <div class="subject" style="margin-top: 15px;">
                <strong>{{ __('new-messagebladephp192') }}</strong> {{ $thread->subject }}
            </div>
        </div>

        <div class="message-preview">
            "{{ $preview }}"
        </div>

        @if($attachments && count($attachments) > 0)
        <div class="attachments">
            <div class="attachments-title">
                📎 {{ count($attachments) }} {{ count($attachments) === 1 ? 'Anhang' : 'Anhänge' }}
            </div>
            @foreach($attachments as $attachment)
            <div class="attachment-item">
                <a href="{!! $attachment->getSignedDownloadUrl() !!}" class="attachment-link" target="_blank">
                    <div class="attachment-icon">
                        @if($attachment->isImage())
                            🖼
                        @elseif($attachment->isPdf())
                            📄
                        @elseif($attachment->isDocument())
                            📝
                        @else
                            📁
                        @endif
                    </div>
                    <div class="attachment-info">
                        <div class="attachment-name">{{ $attachment->original_filename }}</div>
                        <div class="attachment-size">{{ $attachment->getFormattedSize() }} - Klicken zum Herunterladen</div>
                    </div>
                </a>
            </div>
            @endforeach
            <div style="margin-top: 10px; font-size: 12px; color: #6b7280;">
                Die Download-Links sind 7 Tage gültig.
            </div>
        </div>
        @endif

        <div class="timestamp">
            Gesendet am {{ $userMessage->created_at->format('d.m.Y \u\m H:i') }} Uhr
        </div>

        <div class="actions">
            <a href="{{ $viewUrl }}" class="btn">Nachricht lesen</a>
        </div>

        <div class="footer">
            <p>
                Dies ist eine automatische Benachrichtigung von <strong>Scoriet</strong>.<br>
                Sie erhalten diese E-Mail, weil Ihnen jemand eine Nachricht gesendet hat.
            </p>
            <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                Thread ID: {{ $thread->id }}
            </p>
        </div>
    </div>
</body>
</html>
