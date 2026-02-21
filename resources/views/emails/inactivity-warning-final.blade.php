<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{__('inactivity-warning-finalbladephp6')}}</title>
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
            <h1 class="title">{{__('inactivity-warning-finalbladephp107')}}</h1>
        </div>

        <p>{{__('inactivity-warning-finalbladephp110')}}{{ $user->name }},</p>

        <p>
            {{__('inactivity-warning-finalbladephp113')}}<strong>{{__('inactivity-warning-finalbladephp113_2')}}</strong>{{__('inactivity-warning-finalbladephp113_3')}}
            {{__('inactivity-warning-finalbladephp114')}}<strong>{{ $lastLoginAt }}</strong>{{__('inactivity-warning-finalbladephp114_2')}}
        </p>

        <div class="danger-banner">
            <div class="danger-title">
                {{__('inactivity-warning-finalbladephp119')}}
            </div>
            <p style="margin: 0; color: #991b1b;">
                {{__('inactivity-warning-finalbladephp122')}}<strong>{{__('inactivity-warning-finalbladephp122_2')}}</strong>{{__('inactivity-warning-finalbladephp122_3')}}
                {{__('inactivity-warning-finalbladephp123')}}
            </p>
        </div>

        <div class="countdown">{{ $daysRemaining }}</div>
        <div class="countdown-label">{{__('inactivity-warning-finalbladephp128')}}</div>

        <div class="actions">
            <a href="{{ $loginUrl }}" class="btn btn-danger">{{__('inactivity-warning-finalbladephp131')}}</a>
        </div>

        <div class="reassurance-box">
            <div class="reassurance-title">Keine Sorge!</div>
            <p style="margin: 5px 0; color: #047857;">
                {{__('inactivity-warning-finalbladephp137')}}
                {{__('inactivity-warning-finalbladephp138')}}
            </p>
        </div>

        <p style="text-align: center; color: #6b7280; font-size: 14px;">
            {{__('inactivity-warning-finalbladephp143')}}
        </p>

        <div class="footer">
            <p>
                {{__('inactivity-warning-finalbladephp148')}}<strong>Scoriet</strong>.<br>
                {{__('inactivity-warning-finalbladephp149')}}
            </p>
        </div>
    </div>
</body>
</html>
