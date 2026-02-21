<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{__('inactivity-warning-1bladephp6')}}</title>
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
            <h1 class="title">{{__('inactivity-warning-1bladephp112')}}</h1>
        </div>

        <p>{{__('inactivity-warning-1bladephp115')}}{{ $user->name }},</p>

        <p>
            {{__('inactivity-warning-1bladephp118')}}<strong>{{ $lastLoginAt }}</strong>{{__('inactivity-warning-1bladephp118_2')}}
            {{__('inactivity-warning-1bladephp119')}}
        </p>

        <div class="info-banner">
            <div class="info-title">
                {{__('inactivity-warning-1bladephp124')}}
            </div>
            <p style="margin: 0; color: #1e40af;">
                {{__('inactivity-warning-1bladephp127')}}
                {{__('inactivity-warning-1bladephp128')}}
            </p>
        </div>

        <div class="countdown">{{ $daysRemaining }}</div>
        <div class="countdown-label">{{__('inactivity-warning-1bladephp133')}}</div>

        <div class="features-box">
            <div class="features-title">{{__('inactivity-warning-1bladephp136')}}</div>
            <ul class="features-list">
                <li>{{__('inactivity-warning-1bladephp138')}}</li>
                <li>{{__('inactivity-warning-1bladephp139')}}</li>
                <li>{{__('inactivity-warning-1bladephp140')}}</li>
                <li>{{__('inactivity-warning-1bladephp141')}}</li>
            </ul>
        </div>

        <div class="actions">
            <a href="{{ $loginUrl }}" class="btn btn-primary">{{__('inactivity-warning-1bladephp146')}}</a>
        </div>

        <p style="text-align: center; color: #6b7280; font-size: 14px;">
            {{__('inactivity-warning-1bladephp150')}}
        </p>

        <div class="footer">
            <p>
                {{__('inactivity-warning-1bladephp155')}}<strong>Scoriet</strong>.<br>
                {{__('inactivity-warning-1bladephp156')}}
            </p>
        </div>
    </div>
</body>
</html>
