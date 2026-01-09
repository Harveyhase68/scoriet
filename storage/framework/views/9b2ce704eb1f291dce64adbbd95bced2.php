<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wir vermissen Sie!</title>
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
        .info-banner {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 10px 10px 0;
        }
        .info-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }
        .countdown {
            font-size: 48px;
            font-weight: bold;
            color: #3b82f6;
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
        .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
        }
        .features-box {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .features-title {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .features-list {
            margin: 0;
            padding-left: 20px;
            color: #4b5563;
        }
        .features-list li {
            margin-bottom: 8px;
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
            <h1 class="title">Wir vermissen Sie!</h1>
        </div>

        <p>Hallo <?php echo e($user->name); ?>,</p>

        <p>
            Sie haben sich seit dem <strong><?php echo e($lastLoginAt); ?></strong> nicht mehr bei Scoriet eingeloggt.
            Das sind schon eine ganze Weile! Wir wollten nur sicherstellen, dass alles in Ordnung ist.
        </p>

        <div class="info-banner">
            <div class="info-title">
                Hinweis zur Kontosicherheit
            </div>
            <p style="margin: 0; color: #1e40af;">
                Aus Sicherheitsgründen werden inaktive Konten nach 4 Monaten automatisch deaktiviert.
                Ein einfacher Login genügt, um Ihr Konto aktiv zu halten!
            </p>
        </div>

        <div class="countdown"><?php echo e($daysRemaining); ?></div>
        <div class="countdown-label">Tage bis zur automatischen Deaktivierung</div>

        <div class="features-box">
            <div class="features-title">Was Sie verpassen:</div>
            <ul class="features-list">
                <li>Ihre gespeicherten Projekte und Templates</li>
                <li>Monatlich 50 Gratis-Credits (bei Login)</li>
                <li>Alle neuen Features und Verbesserungen</li>
                <li>Ihre Team-Mitgliedschaften</li>
            </ul>
        </div>

        <div class="actions">
            <a href="<?php echo e($loginUrl); ?>" class="btn btn-primary">Jetzt einloggen</a>
        </div>

        <p style="text-align: center; color: #6b7280; font-size: 14px;">
            Ein Login setzt den Inaktivitätszähler zurück und sichert Ihre monatlichen Credits!
        </p>

        <div class="footer">
            <p>
                Dies ist eine automatische Nachricht von <strong>Scoriet</strong>.<br>
                Sie erhalten diese E-Mail, weil Sie sich länger nicht eingeloggt haben.
            </p>
        </div>
    </div>
</body>
</html>
<?php /**PATH C:\wamp\www\scoriet\resources\views/emails/inactivity-warning-1.blade.php ENDPATH**/ ?>