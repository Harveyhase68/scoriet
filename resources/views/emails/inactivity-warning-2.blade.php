<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dringend: Ihr Konto wird bald deaktiviert</title>
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
        .warning-banner {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 10px 10px 0;
        }
        .warning-title {
            font-size: 18px;
            font-weight: bold;
            color: #92400e;
            margin-bottom: 10px;
        }
        .countdown {
            font-size: 48px;
            font-weight: bold;
            color: #f59e0b;
            text-align: center;
            margin: 20px 0;
        }
        .countdown-label {
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .actions {
            text-align: center;
            margin: 30px 0;
        }
        .btn {
            display: inline-block;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 18px;
        }
        .btn-warning {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
        }
        .info-box {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .info-title {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
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
            <h1 class="title">Zweite Erinnerung</h1>
        </div>

        <p>Hallo {{ $user->name }},</p>

        <p>
            Wir haben Ihnen vor 2 Wochen eine Nachricht geschickt, aber Sie haben sich immer noch nicht eingeloggt.
            Ihr letzter Login war am <strong>{{ $lastLoginAt }}</strong>.
        </p>

        <div class="warning-banner">
            <div class="warning-title">
                Ihr Konto wird bald deaktiviert!
            </div>
            <p style="margin: 0; color: #92400e;">
                Bitte loggen Sie sich jetzt ein, um Ihr Konto und alle Ihre Daten zu behalten.
                Nach der Deaktivierung können Sie sich weiterhin einloggen - Ihr Konto wird dann automatisch reaktiviert.
            </p>
        </div>

        <div class="countdown">{{ $daysRemaining }}</div>
        <div class="countdown-label">Tage bis zur automatischen Deaktivierung</div>

        <div class="info-box">
            <div class="info-title">Was passiert bei der Deaktivierung?</div>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                <li>Ihr Konto wird vorübergehend gesperrt</li>
                <li>Ihre Daten bleiben erhalten</li>
                <li>Ein erneuter Login reaktiviert Ihr Konto sofort</li>
                <li>Sie verpassen bis dahin Ihre monatlichen Gratis-Credits</li>
            </ul>
        </div>

        <div class="actions">
            <a href="{{ $loginUrl }}" class="btn btn-warning">Jetzt einloggen</a>
        </div>

        <p style="text-align: center; color: #6b7280; font-size: 14px;">
            Ein einziger Login genügt, um Ihr Konto aktiv zu halten!
        </p>

        <div class="footer">
            <p>
                Dies ist eine automatische Nachricht von <strong>Scoriet</strong>.<br>
                Sie erhalten diese E-Mail, weil Ihr Konto seit über 3 Monaten inaktiv ist.
            </p>
        </div>
    </div>
</body>
</html>
