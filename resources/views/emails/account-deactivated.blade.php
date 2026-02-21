<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{__('account-deactivatedbladephp6')}}</title>
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
            color: #6b7280;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .info-banner {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border-left: 4px solid #6b7280;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 10px 10px 0;
        }
        .info-title {
            font-size: 18px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 10px;
        }
        .reactivation-box {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border: 2px solid #10b981;
            border-radius: 10px;
            padding: 25px;
            margin: 25px 0;
            text-align: center;
        }
        .reactivation-title {
            font-size: 20px;
            font-weight: bold;
            color: #047857;
            margin-bottom: 15px;
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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
        }
        .info-box {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .info-box-title {
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
            <h1 class="title">{{__('account-deactivatedbladephp106')}}</h1>
        </div>

        <p>Hallo {{ $user->name }},</p>

        <p>
            {{__('account-deactivatedbladephp112')}}
            {{__('account-deactivatedbladephp113')}}<strong>{{ $lastLoginAt }}</strong>{{__('account-deactivatedbladephp113_2')}}
        </p>

        <div class="info-banner">
            <div class="info-title">
                {{__('account-deactivatedbladephp118')}}
            </div>
            <ul style="margin: 0; padding-left: 20px; color: #374151;">
                <li>{{__('account-deactivatedbladephp121')}}</li>
                <li>{{__('account-deactivatedbladephp122')}}</li>
                <li>{{__('account-deactivatedbladephp123')}}</li>
            </ul>
        </div>

        <div class="reactivation-box">
            <div class="reactivation-title">Konto reaktivieren?</div>
            <p style="margin: 5px 0; color: #047857;">
                {{__('account-deactivatedbladephp130')}}<strong>{{__('account-deactivatedbladephp130_2')}}</strong>{{__('account-deactivatedbladephp130_3')}}
                {{__('account-deactivatedbladephp131')}}
            </p>
        </div>

        <div class="actions">
            <a href="{{ $loginUrl }}" class="btn btn-primary">{{__('account-deactivatedbladephp136')}}</a>
        </div>

        <div class="info-box">
            <div class="info-box-title">Gut zu wissen:</div>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                <li>{{__('account-deactivatedbladephp142')}}</li>
                <li>{{__('account-deactivatedbladephp143')}}</li>
                <li>{{__('account-deactivatedbladephp144')}}</li>
                <li>{{__('account-deactivatedbladephp145')}}</li>
            </ul>
        </div>

        <p style="text-align: center; color: #6b7280; font-size: 14px;">
            {{__('account-deactivatedbladephp150')}}
        </p>

        <div class="footer">
            <p>
                {{__('account-deactivatedbladephp155')}}<strong>Scoriet</strong>.<br>
                {{__('account-deactivatedbladephp156')}}
            </p>
        </div>
    </div>
</body>
</html>
