<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{__('inactivity-warning-2bladephp6')}}</title>
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
            <h1 class="title">{{__('inactivity-warning-2bladephp104')}}</h1>
        </div>

        <p>{{__('inactivity-warning-2bladephp107')}}{{ $user->name }},</p>

        <p>
            {{__('inactivity-warning-2bladephp110')}}
            {{__('inactivity-warning-2bladephp111')}}<strong>{{ $lastLoginAt }}</strong>.
        </p>

        <div class="warning-banner">
            <div class="warning-title">
                {{__('inactivity-warning-2bladephp116')}}
            </div>
            <p style="margin: 0; color: #92400e;">
                {{__('inactivity-warning-2bladephp119')}}
                {{__('inactivity-warning-2bladephp120')}}
            </p>
        </div>

        <div class="countdown">{{ $daysRemaining }}</div>
        <div class="countdown-label">{{__('inactivity-warning-2bladephp125')}}</div>

        <div class="info-box">
            <div class="info-title">{{__('inactivity-warning-2bladephp128')}}</div>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                <li>{{__('inactivity-warning-2bladephp130')}}</li>
                <li>{{__('inactivity-warning-2bladephp131')}}</li>
                <li>{{__('inactivity-warning-2bladephp132')}}</li>
                <li>{{__('inactivity-warning-2bladephp133')}}</li>
            </ul>
        </div>

        <div class="actions">
            <a href="{{ $loginUrl }}" class="btn btn-warning">{{__('inactivity-warning-2bladephp138')}}</a>
        </div>

        <p style="text-align: center; color: #6b7280; font-size: 14px;">
            {{__('inactivity-warning-2bladephp142')}}
        </p>

        <div class="footer">
            <p>
                {{__('inactivity-warning-2bladephp147')}}<strong>Scoriet</strong>.<br>
                {{__('inactivity-warning-2bladephp148')}}
            </p>
        </div>
    </div>
</body>
</html>
