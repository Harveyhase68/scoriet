<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{__('subscription-expiry-finalbladephp6')}}{{ $daysUntilExpiry }}{{__('subscription-expiry-finalbladephp6_2')}}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fef2f2;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-top: 5px solid #dc2626;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 10px;
        }
        .title {
            color: #dc2626;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .urgent-banner {
            background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
            border: 2px solid #dc2626;
            padding: 25px;
            margin: 20px 0;
            border-radius: 10px;
            text-align: center;
        }
        .urgent-title {
            font-size: 24px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 10px;
        }
        .subscription-info {
            background: #f3f4f6;
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
            font-size: 18px;
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
            font-size: 16px;
            font-weight: bold;
            color: #047857;
            margin-bottom: 5px;
        }
        .bonus-days {
            font-size: 24px;
            font-weight: bold;
            color: #059669;
        }
        .actions {
            text-align: center;
            margin: 30px 0;
        }
        .btn {
            display: inline-block;
            padding: 18px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 700;
            font-size: 20px;
            transition: all 0.2s ease;
        }
        .btn-urgent {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            animation: pulse 2s infinite;
        }
        .btn-urgent:hover {
            background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
            color: white;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }
        .countdown {
            font-size: 72px;
            font-weight: bold;
            color: #dc2626;
            text-align: center;
            margin: 10px 0;
            text-shadow: 2px 2px 4px rgba(220, 38, 38, 0.2);
        }
        .countdown-label {
            font-size: 16px;
            color: #dc2626;
            text-align: center;
            font-weight: 600;
        }
        .consequences {
            background: #fff7ed;
            border: 1px solid #f97316;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .consequences-title {
            font-weight: bold;
            color: #c2410c;
            margin-bottom: 10px;
        }
        .consequences ul {
            margin: 0;
            padding-left: 20px;
            color: #9a3412;
        }
        .consequences li {
            margin-bottom: 5px;
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
            <div class="logo">{{__('subscription-expiry-finalbladephp163')}}</div>
            <h1 class="title">{{__('subscription-expiry-finalbladephp164')}}</h1>
        </div>

        <p>{__('subscription-expiry-finalbladephp167')}}{{ $user->name }},</p>

        <div class="urgent-banner">
            <div class="urgent-title">{__('subscription-expiry-finalbladephp170')}}</div>
            <div class="countdown">{{ $daysUntilExpiry }}</div>
            <div class="countdown-label">{{ $daysUntilExpiry == 1 ? __('subscription-expiry-finalbladephp172') : __('subscription-expiry-finalbladephp172_2') }} {__('subscription-expiry-finalbladephp172_3')}</div>
        </div>

        <div class="subscription-info">
            <div class="subscription-name">{{ $displayName }}</div>
            <p class="subscription-expiry">
                {{__('subscription-expiry-finalbladephp178')}}{{ $expiresAt }}
            </p>
        </div>

        <div class="consequences">
            <div class="consequences-title">{{__('subscription-expiry-finalbladephp183')}}</div>
            <ul>
                <li>{{__('subscription-expiry-finalbladephp185')}}</li>
                <li>{{__('subscription-expiry-finalbladephp186')}}</li>
                <li>{{__('subscription-expiry-finalbladephp187')}}</li>
            </ul>
        </div>

        <div class="bonus-box">
            <div class="bonus-title">{{__('subscription-expiry-finalbladephp192')}}</div>
            <div class="bonus-days">+{{ $bonusDays }}{{__('subscription-expiry-finalbladephp193')}}</div>
        </div>

        <div class="actions">
            <a href="{{ $renewUrl }}" class="btn btn-urgent">{{__('subscription-expiry-finalbladephp197')}}</a>
        </div>

        <p style="text-align: center; color: #6b7280; font-size: 14px;">
            {{__('subscription-expiry-finalbladephp201_2')}}<strong>{{__('subscription-expiry-finalbladephp201_4')}}</strong>{{__('subscription-expiry-finalbladephp201_3')}}
        </p>

        <div class="footer">
            <p>
                {{__('subscription-expiry-finalbladephp206')}}<strong>{{__('subscription-expiry-finalbladephp206_2')}}</strong>{{__('subscription-expiry-finalbladephp206_3')}}<strong>Scoriet</strong>.<br>
                {{__('subscription-expiry-finalbladephp207')}}
            </p>
            <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                {{__('subscription-expiry-finalbladephp210')}}{{ $subscription->id }}
            </p>
        </div>
    </div>
</body>
</html>
