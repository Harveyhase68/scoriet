<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ __('demoaccess.email_subject') }}</title>
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
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
        .title { color: #1f2937; font-size: 24px; margin-bottom: 20px; }
        .actions { text-align: center; margin: 30px 0; }
        .btn {
            display: inline-block;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            background: #2563eb;
            color: white;
        }
        .expiry { color: #f59e0b; font-weight: 600; margin-top: 20px; text-align: center; }
        .fallback { word-break: break-all; font-size: 13px; color: #6b7280; margin-top: 20px; }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 13px;
            color: #6b7280;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀 Scoriet</div>
            <h1 class="title">{{ __('demoaccess.email_title') }}</h1>
        </div>

        <p>{{ __('demoaccess.email_intro') }}</p>

        <div class="actions">
            <a href="{{ $accessUrl }}" class="btn">{{ __('demoaccess.email_button') }}</a>
        </div>

        <div class="expiry">
            {{ __('demoaccess.email_expiry') }} {{ $expiresAt->format('Y-m-d H:i') }} UTC
        </div>

        <div class="fallback">
            {{ __('demoaccess.email_fallback') }}<br>
            {{ $accessUrl }}
        </div>

        <div class="footer">
            <p>{{ __('demoaccess.email_footer') }}</p>
        </div>
    </div>
</body>
</html>
