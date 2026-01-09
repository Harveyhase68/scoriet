<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LETZTE WARNUNG: Konto wird deaktiviert!</title>
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
            color: #dc2626;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .danger-banner {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            border-left: 4px solid #dc2626;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 10px 10px 0;
        }
        .danger-title {
            font-size: 18px;
            font-weight: bold;
            color: #991b1b;
            margin-bottom: 10px;
        }
        .countdown {
            font-size: 72px;
            font-weight: bold;
            color: #dc2626;
            text-align: center;
            margin: 20px 0;
        }
        .countdown-label {
            font-size: 16px;
            font-weight: bold;
            color: #dc2626;
            text-align: center;
        }
        .actions {
            text-align: center;
            margin: 30px 0;
        }
        .btn {
            display: inline-block;
            padding: 20px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 700;
            font-size: 20px;
        }
        .btn-danger {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
        }
        .reassurance-box {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border: 2px solid #10b981;
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        .reassurance-title {
            font-weight: bold;
            color: #047857;
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
            <h1 class="title">LETZTE WARNUNG!</h1>
        </div>

        <p>Hallo {{ $user->name }},</p>

        <p>
            Dies ist unsere <strong>letzte Warnung</strong> bevor Ihr Konto deaktiviert wird.
            Ihr letzter Login war am <strong>{{ $lastLoginAt }}</strong> - das ist fast 4 Monate her!
        </p>

        <div class="danger-banner">
            <div class="danger-title">
                IHR KONTO WIRD IN WENIGEN TAGEN DEAKTIVIERT!
            </div>
            <p style="margin: 0; color: #991b1b;">
                Bitte loggen Sie sich <strong>JETZT</strong> ein, um Ihr Konto zu behalten.
                Ein einziger Klick genügt!
            </p>
        </div>

        <div class="countdown">{{ $daysRemaining }}</div>
        <div class="countdown-label">TAGE VERBLEIBEND</div>

        <div class="actions">
            <a href="{{ $loginUrl }}" class="btn btn-danger">JETZT EINLOGGEN</a>
        </div>

        <div class="reassurance-box">
            <div class="reassurance-title">Keine Sorge!</div>
            <p style="margin: 5px 0; color: #047857;">
                Auch nach einer Deaktivierung können Sie sich jederzeit wieder einloggen.
                Ihr Konto wird dann automatisch reaktiviert und alle Ihre Daten bleiben erhalten.
            </p>
        </div>

        <p style="text-align: center; color: #6b7280; font-size: 14px;">
            Wir würden Sie ungern verlieren! Ein Login dauert nur wenige Sekunden.
        </p>

        <div class="footer">
            <p>
                Dies ist eine automatische Nachricht von <strong>Scoriet</strong>.<br>
                Sie erhalten diese E-Mail, weil Ihr Konto seit fast 4 Monaten inaktiv ist.
            </p>
        </div>
    </div>
</body>
</html>
