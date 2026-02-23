<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{__('subscription-expiry-bundledbladephp6')}}</title>
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
        .summary-box {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 15px 20px;
            margin: 20px 0;
            text-align: center;
        }
        .summary-count {
            font-size: 36px;
            font-weight: bold;
            color: #1f2937;
        }
        .summary-label {
            color: #6b7280;
            font-size: 14px;
        }

        /* Section styles */
        .section {
            margin: 25px 0;
            border-radius: 10px;
            overflow: hidden;
        }
        .section-header {
            padding: 15px 20px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .section-content {
            padding: 0 20px 20px;
        }

        /* Expired section - Red */
        .section-expired {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border-left: 4px solid #dc2626;
        }
        .section-expired .section-header {
            color: #991b1b;
            background: rgba(220, 38, 38, 0.1);
        }

        /* Final warning section - Orange */
        .section-final {
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
            border-left: 4px solid #ea580c;
        }
        .section-final .section-header {
            color: #9a3412;
            background: rgba(234, 88, 12, 0.1);
        }

        /* Warning section - Yellow */
        .section-warning {
            background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
            border-left: 4px solid #ca8a04;
        }
        .section-warning .section-header {
            color: #854d0e;
            background: rgba(202, 138, 4, 0.1);
        }

        /* Subscription item */
        .subscription-item {
            background: white;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .subscription-name {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 5px;
        }
        .subscription-details {
            font-size: 14px;
            color: #6b7280;
        }
        .subscription-days {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
        }
        .days-expired {
            background: #fee2e2;
            color: #dc2626;
        }
        .days-urgent {
            background: #ffedd5;
            color: #ea580c;
        }
        .days-warning {
            background: #fef3c7;
            color: #ca8a04;
        }

        /* Bonus box */
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
            font-size: 28px;
            font-weight: bold;
            color: #059669;
        }
        .bonus-note {
            font-size: 13px;
            color: #059669;
            margin-top: 5px;
        }

        /* Actions */
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

        /* Footer */
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }

        /* Cost info */
        .cost-info {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Scoriet</div>
            @if($urgencyLevel === 'expired')
                <h1 class="title" style="color: #dc2626;">{{__('subscription-expiry-bundledbladephp213')}}</h1>
            @elseif($urgencyLevel === 'final')
                <h1 class="title" style="color: #ea580c;">{{__('subscription-expiry-bundledbladephp215')}}</h1>
            @else
                <h1 class="title">{{__('subscription-expiry-bundledbladephp217')}}</h1>
            @endif
        </div>

        <p>{{__('subscription-expiry-bundledbladephp221')}}{{ $user->name }},</p>

        <p>
            @if($totalCount === 1)
                {{__('subscription-expiry-bundledbladephp225')}}
            @else
                {{ $totalCount }}{{__('subscription-expiry-bundledbladephp227')}}
            @endif
        </p>

        {{-- EXPIRED SUBSCRIPTIONS --}}
        @if(count($expiredSubscriptions) > 0)
            <div class="section section-expired">
                <div class="section-header">
                    <span style="font-size: 20px;">&#x26A0;</span>
                    {{__('subscription-expiry-bundledbladephp236')}}({{ count($expiredSubscriptions) }})
                </div>
                <div class="section-content">
                    @foreach($expiredSubscriptions as $sub)
                        <div class="subscription-item">
                            <div class="subscription-name">
                                {{ $sub['displayName'] }}
                                <span class="subscription-days days-expired">{{__('subscription-expiry-bundledbladephp243')}}</span>
                            </div>
                            <div class="subscription-details">
                                {{__('subscription-expiry-bundledbladephp246')}}{{ $sub['expiredAt'] }}
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif

        {{-- FINAL WARNING SUBSCRIPTIONS --}}
        @if(count($finalSubscriptions) > 0)
            <div class="section section-final">
                <div class="section-header">
                    <span style="font-size: 20px;">&#x23F0;</span>
                    {{__('subscription-expiry-bundledbladephp259')}}({{ count($finalSubscriptions) }})
                </div>
                <div class="section-content">
                    @foreach($finalSubscriptions as $sub)
                        <div class="subscription-item">
                            <div class="subscription-name">
                                {{ $sub['displayName'] }}
                                <span class="subscription-days days-urgent">{{ $sub['daysUntilExpiry'] }} {{ $sub['daysUntilExpiry'] == 1 ? __('subscription-expiry-bundledbladephp266') : __('subscription-expiry-bundledbladephp266_2') }}</span>
                            </div>
                            <div class="subscription-details">
                                {{__('subscription-expiry-bundledbladephp269')}}{{ $sub['expiresAt'] }}
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif

        {{-- WARNING SUBSCRIPTIONS --}}
        @if(count($warningSubscriptions) > 0)
            <div class="section section-warning">
                <div class="section-header">
                    <span style="font-size: 20px;">&#x1F514;</span>
                    {{__('subscription-expiry-bundledbladephp282')}}({{ count($warningSubscriptions) }})
                </div>
                <div class="section-content">
                    @foreach($warningSubscriptions as $sub)
                        <div class="subscription-item">
                            <div class="subscription-name">
                                {{ $sub['displayName'] }}
                                <span class="subscription-days days-warning">{{ $sub['daysUntilExpiry'] }}{{__('subscription-expiry-bundledbladephp289')}}</span>
                            </div>
                            <div class="subscription-details">
                                {{__('subscription-expiry-bundledbladephp292')}}{{ $sub['expiresAt'] }}
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif

        {{-- Bonus Box only for non-expired --}}
        @if(count($warningSubscriptions) > 0 || count($finalSubscriptions) > 0)
            <div class="bonus-box">
                <div class="bonus-title">{{__('subscription-expiry-bundledbladephp303')}}</div>
                <p style="margin: 5px 0; color: #047857; font-size: 14px;">{{__('subscription-expiry-bundledbladephp304')}}</p>
                <div class="bonus-days">+{{ $bonusDays }}{{__('subscription-expiry-bundledbladephp305')}}</div>
                <p class="bonus-note">{{__('subscription-expiry-bundledbladephp306')}}</p>
            </div>
        @endif

        <div class="actions">
            <a href="{{ $renewUrl }}" class="btn btn-primary">{{__('subscription-expiry-bundledbladephp311')}}</a>
        </div>

        <p class="cost-info">
            {{__('subscription-expiry-bundledbladephp315')}}<strong>{{__('subscription-expiry-bundledbladephp315_2')}}</strong>{{__('subscription-expiry-bundledbladephp315_3')}}
        </p>

        <div class="footer">
            <p>
                {{__('subscription-expiry-bundledbladephp320')}}<strong>Scoriet</strong>.<br>
                {{__('subscription-expiry-bundledbladephp321')}}{{ $totalCount === 1 ? __('subscription-expiry-bundledbladephp321_2') : __('subscription-expiry-bundledbladephp321_3') }}{{__('subscription-expiry-bundledbladephp321_4')}}{{ $totalCount === 1 ? __('subscription-expiry-bundledbladephp321_5') : __('subscription-expiry-bundledbladephp321_6') }}.
            </p>
        </div>
    </div>
</body>
</html>
