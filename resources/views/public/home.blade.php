@extends('public.layout')

@php
    $currency = $pricing['currency'];
    $prices = $pricing['prices'];
    $money = fn (float $amount) => $currency . ' ' . number_format($amount, 2, '.', '');

    $features = [
        ['icon' => 'pi-database', 'color' => 'text-blue-500', 'title' => 'landing.feature_sql_title', 'desc' => 'landing.feature_sql_desc'],
        ['icon' => 'pi-file-edit', 'color' => 'text-green-500', 'title' => 'landing.feature_template_title', 'desc' => 'landing.feature_template_desc'],
        ['icon' => 'pi-code', 'color' => 'text-purple-500', 'title' => 'landing.feature_multilang_title', 'desc' => 'landing.feature_multilang_desc'],
        ['icon' => 'pi-sparkles', 'color' => 'text-yellow-500', 'title' => 'landing.feature_ui_title', 'desc' => 'landing.feature_ui_desc'],
    ];

    $tiers = [
        [
            'name' => 'Free',
            'price' => $money(0.0),
            'period' => __('landing.free_period'),
            'yearly' => null,
            'description' => __('landing.free_desc'),
            'features' => array_map(fn ($i) => __('landing.free_f' . $i), range(1, 6)),
            'button' => __('landing.free_button'),
            'popular' => false,
            'patron' => false,
        ],
        [
            'name' => 'Patron Annual',
            'price' => $money($prices['patron_annual']),
            'period' => __('landing.annual_period'),
            'yearly' => null,
            'description' => __('landing.annual_desc'),
            'features' => array_map(fn ($i) => __('landing.annual_f' . $i), range(1, 5)),
            'button' => __('landing.register_first'),
            'popular' => true,
            'patron' => true,
        ],
        [
            'name' => 'Patron Monthly',
            'price' => $money($prices['patron_monthly']),
            'period' => __('landing.monthly_period'),
            'yearly' => __('landing.or_yearly') . $money($prices['patron_annual']) . __('landing.annual_period'),
            'description' => __('landing.monthly_desc'),
            'features' => array_map(fn ($i) => __('landing.monthly_f' . $i), range(1, 5)),
            'button' => __('landing.register_first'),
            'popular' => false,
            'patron' => true,
        ],
    ];
@endphp

@section('content')
    {{-- Hero --}}
    <section class="py-20" style="background: linear-gradient(to bottom right, var(--theme-bg-primary), var(--theme-bg-secondary), color-mix(in srgb, var(--theme-accent) 25%, transparent));">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 class="text-4xl sm:text-5xl font-bold mb-6 text-(--theme-accent)">{{ __('landing.hero_title') }}</h1>
            <p class="text-xl mb-4 max-w-3xl mx-auto text-(--theme-text-secondary)">{{ __('landing.hero_subtitle') }}</p>
            <p class="mb-8 max-w-3xl mx-auto italic text-(--theme-text-muted)">{{ __('landing.hero_tagline') }}</p>

            <div class="flex flex-wrap justify-center gap-2">
                @if ($isDemo)
                    <button type="button" class="pub-btn pub-btn--primary" data-public-action="login">
                        <i class="pi pi-desktop" aria-hidden="true"></i>{{ __('landing.try_demo') }}
                    </button>
                @else
                    <button type="button" class="pub-btn pub-btn--primary" data-public-action="register">
                        <i class="pi pi-flag" aria-hidden="true"></i>{{ __('landing.start_free') }}
                    </button>
                    <button type="button" class="pub-btn pub-btn--outline" data-public-action="demo">
                        <i class="pi pi-desktop" aria-hidden="true"></i>{{ __('landing.try_demo') }}
                    </button>
                @endif
                <button type="button" class="pub-btn pub-btn--outline" data-public-action="video">
                    <i class="pi pi-play" aria-hidden="true"></i>{{ __('landing.watch_demo') }}
                </button>
                {{-- Revealed by the island only when the browser offers PWA installation. --}}
                <button type="button" class="pub-btn pub-btn--success" data-public-action="install" hidden>
                    <i class="pi pi-download" aria-hidden="true"></i>{{ __('landing.install_app') }}
                </button>
            </div>
        </div>
    </section>

    {{-- Features --}}
    <section id="features" class="py-20 bg-(--theme-bg-secondary)">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="text-3xl font-bold text-center mb-12 text-(--theme-text-primary)">{{ __('landing.features_title') }}</h2>

            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                @foreach ($features as $feature)
                    <article class="pub-card bg-(--theme-bg-tertiary) text-center p-6 flex flex-col items-center">
                        <i class="pi {{ $feature['icon'] }} {{ $feature['color'] }} pub-icon--lg mb-4" aria-hidden="true"></i>
                        <h3 class="text-xl font-semibold mb-3 text-(--theme-text-primary)">{{ __($feature['title']) }}</h3>
                        <p class="text-(--theme-text-secondary)">{{ __($feature['desc']) }}</p>
                    </article>
                @endforeach
            </div>
        </div>
    </section>

    {{-- Signed-in visitors: greeting (name filled in by the island). --}}
    <section data-auth-show="user" class="py-12 text-center bg-(--theme-bg-primary) border-b border-(--theme-border-secondary)">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="text-3xl font-bold mb-4 text-(--theme-text-primary)">
                {{ __('landing.welcome_back') }}<span data-user-name></span>! 👋
            </h2>
            <button type="button" class="pub-btn pub-btn--outline" data-public-action="plans">
                <i class="pi pi-credit-card" aria-hidden="true"></i>{{ __('landing.change_plan') }}
            </button>
        </div>
    </section>

    {{-- Pricing --}}
    <section id="pricing" class="py-20 bg-(--theme-bg-primary)">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="text-3xl font-bold text-center mb-4 text-(--theme-text-primary)">{{ __('landing.pricing_title') }}</h2>
            <p class="text-center mb-12 text-(--theme-text-muted)">{{ __('landing.pricing_subtitle') }}</p>

            <div class="grid md:grid-cols-3 gap-6">
                @foreach ($tiers as $tier)
                    <article class="pub-card relative p-6 text-center flex flex-col {{ $tier['popular'] ? 'pub-card--popular' : '' }}">
                        @if ($tier['popular'])
                            <span class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold bg-(--theme-accent) text-white">{{ __('landing.most_popular') }}</span>
                        @endif

                        <h3 class="text-2xl font-bold mb-2 flex items-center justify-center gap-2 text-(--theme-text-primary)">
                            {{ $tier['name'] }}
                            @if ($tier['patron'])
                                <i class="pi pi-heart-fill text-red-500" aria-hidden="true"></i>
                            @endif
                        </h3>

                        <div class="mb-4">
                            <span class="text-4xl font-bold text-(--theme-text-primary)">{{ $tier['price'] }}</span>
                            <span class="text-(--theme-text-muted)">{{ $tier['period'] }}</span>
                            @if ($tier['yearly'])
                                <div class="text-sm mt-1 text-(--theme-success-text)">{{ $tier['yearly'] }}</div>
                            @endif
                        </div>

                        <p class="mb-6 text-(--theme-text-muted)">{{ $tier['description'] }}</p>

                        <ul class="space-y-3 mb-8 text-left grow">
                            @foreach ($tier['features'] as $line)
                                <li class="flex items-center gap-2 text-(--theme-text-secondary)">
                                    <i class="pi pi-check text-(--theme-success-text)" aria-hidden="true"></i>{{ $line }}
                                </li>
                            @endforeach
                        </ul>

                        {{-- Guests: register (login on the demo site); signed-in users: plan dialog. --}}
                        <button type="button" class="pub-btn {{ $tier['popular'] ? 'pub-btn--primary' : 'pub-btn--outline' }} w-full" data-public-action="pricing">
                            {{ $tier['button'] }}
                        </button>
                    </article>
                @endforeach
            </div>
        </div>
    </section>

    {{-- Call to action --}}
    <section class="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 class="text-3xl font-bold mb-4">{{ __('landing.cta_title') }}</h2>
            <p class="text-xl mb-8 text-blue-100">{{ __('landing.cta_subtitle') }}</p>
            <div class="flex flex-wrap justify-center gap-2">
                <a href="/app" data-auth-show="user" class="pub-btn pub-btn--orange">
                    <i class="pi pi-arrow-right" aria-hidden="true"></i>{{ __('landing.goto_app') }}
                </a>
                <span data-auth-show="guest" class="contents">
                    @if ($isDemo)
                        <button type="button" class="pub-btn pub-btn--orange" data-public-action="login">
                            <i class="pi pi-play" aria-hidden="true"></i>{{ __('landing.try_demo_now') }}
                        </button>
                    @else
                        <button type="button" class="pub-btn pub-btn--orange" data-public-action="register">
                            <i class="pi pi-flag" aria-hidden="true"></i>{{ __('landing.start_free_trial') }}
                        </button>
                    @endif
                </span>
                <a href="https://scoriet.com/pages/kontakt?lang={{ $locale }}" class="pub-btn pub-btn--on-gradient-outline">{{ __('landing.contact_sales') }}</a>
            </div>
        </div>
    </section>
@endsection
