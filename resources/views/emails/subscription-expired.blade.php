<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abo abgelaufen - {{ $displayName }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f3f4f6;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-top: 5px solid #6b7280;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #6b7280;
            margin-bottom: 10px;
        }
        .title {
            color: #374151;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .expired-banner {
            background: #f3f4f6;
            border: 2px solid #9ca3af;
            padding: 25px;
            margin: 20px 0;
            border-radius: 10px;
            text-align: center;
        }
        .expired-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .expired-title {
            font-size: 20px;
            font-weight: bold;
            color: #4b5563;
            margin-bottom: 10px;
        }
        .subscription-info {
            background: #fef2f2;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #dc2626;
        }
        .subscription-name {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 5px;
        }
        .subscription-expiry {
            color: #dc2626;
            font-weight: 600;
        }
        .info-box {
            background: #eff6ff;
            border: 1px solid #3b82f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .info-title {
            font-weight: bold;
            color: #1d4ed8;
            margin-bottom: 10px;
        }
        .info-box ul {
            margin: 0;
            padding-left: 20px;
            color: #1e40af;
        }
        .info-box li {
            margin-bottom: 5px;
        }
        .actions {
            text-align: center;
            margin: 30px 0;
        }
        .btn {
            display: inline-block;
            padding: 16px 36px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 18px;
            transition: all 0.2s ease;
        }
        .btn-reactivate {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
        }
        .btn-reactivate:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Scoriet</div>
            <h1 class="title">Abo abgelaufen</h1>
        </div>

        <p>Hallo {{ $user->name }},</p>

        <div class="expired-banner">
            <div class="expired-icon">⏰</div>
            <div class="expired-title">Ihr Abonnement ist abgelaufen</div>
            <p style="margin: 0; color: #6b7280;">
                Das Feature wurde vorübergehend gesperrt (Soft-Lock).
            </p>
        </div>

        <div class="subscription-info">
            <div class="subscription-name">{{ $displayName }}</div>
            <p class="subscription-expiry">
                Abgelaufen am: {{ $expiredAt }}
            </p>
        </div>

        <div class="info-box">
            <div class="info-title">Gute Nachrichten!</div>
            <ul>
                <li><strong>Ihre Daten sind sicher</strong> - Nichts wurde gelöscht</li>
                <li><strong>Reaktivierung jederzeit möglich</strong></li>
                <li><strong>Sofortiger Zugang</strong> nach Verlängerung</li>
            </ul>
        </div>

        <p style="text-align: center; margin: 25px 0;">
            Reaktivieren Sie Ihr Abo jetzt und arbeiten Sie nahtlos weiter.<br>
            <strong style="color: #059669;">Nur 50 Credits für ein ganzes Jahr!</strong>
        </p>

        <div class="actions">
            <a href="{{ $renewUrl }}" class="btn btn-reactivate">Jetzt reaktivieren</a>
        </div>

        <div class="footer">
            <p>
                Dies ist eine automatische Nachricht von <strong>Scoriet</strong>.<br>
                Bei Fragen antworten Sie einfach auf diese E-Mail.
            </p>
            <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                Subscription ID: {{ $subscription->id }}
            </p>
        </div>
    </div>
</body>
</html>
