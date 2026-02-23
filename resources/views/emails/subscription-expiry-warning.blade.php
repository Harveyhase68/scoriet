<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{__('subscription-expiry-warningbladephp6')}}{{ $displayName }}</title>
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
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .subscription-info {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
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
        .bonus-box {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border: 2px solid #10b981;
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        .bonus-title {
            font-size: 18px;
            font-weight: bold;
            color: #047857;
            margin-bottom: 10px;
        }
        .bonus-days {
            font-size: 32px;
            font-weight: bold;
            color: #059669;
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
            transition: all 0.2s ease;
        }
        .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
        }
        .btn-primary:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Scoriet</div>
            <h1 class="title">{{__('subscription-expiry-warningbladephp136')}}</h1>
        </div>

        <p>{{__('subscription-expiry-warningbladephp139')}}{{ $user->name }},</p>

        <div class="warning-banner">
            <div class="warning-title">
                {{__('subscription-expiry-warningbladephp143')}}
            </div>
            <p style="margin: 0; color: #92400e;">
                {{__('subscription-expiry-warningbladephp146')}}<strong>{{ $bonusDays }}{{__('subscription-expiry-warningbladephp146_2')}}</strong>{{__('subscription-expiry-warningbladephp146_3')}}
            </p>
        </div>

        <div class="countdown">{{ $daysUntilExpiry }}</div>
        <div class="countdown-label">{{__('subscription-expiry-warningbladephp151')}}</div>

        <div class="subscription-info">
            <div class="subscription-name">{{ $displayName }}</div>
            <p class="subscription-expiry">
                {{__('subscription-expiry-warningbladephp156')}}{{ $expiresAt }}
            </p>
        </div>

        <div class="bonus-box">
            <div class="bonus-title">{__('subscription-expiry-warningbladephp161')}}</div>
            <p style="margin: 5px 0; color: #047857;">{{__('subscription-expiry-warningbladephp162')}}</p>
            <div class="bonus-days">+{{ $bonusDays }}{{__('subscription-expiry-warningbladephp163')}}</div>
            <p style="margin: 10px 0 0; font-size: 14px; color: #059669;">
                {{__('subscription-expiry-warningbladephp165')}}
            </p>
        </div>

        <div class="actions">
            <a href="{{ $renewUrl }}" class="btn btn-primary">{{__('subscription-expiry-warningbladephp170')}}</a>
        </div>

        <p style="text-align: center; color: #6b7280; font-size: 14px;">
            {{__('subscription-expiry-warningbladephp174')}}<strong>{{__('subscription-expiry-warningbladephp174_2')}}</strong>{{__('subscription-expiry-warningbladephp174_3')}}
        </p>

        <div class="footer">
            <p>
                {{__('subscription-expiry-warningbladephp179')}}<strong>Scoriet</strong>.<br>
                {{__('subscription-expiry-warningbladephp180')}}
            </p>
            <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                {{__('subscription-expiry-warningbladephp183')}}{{ $subscription->id }}
            </p>
        </div>
    </div>
</body>
</html>
