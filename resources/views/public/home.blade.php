@extends('public.layout')

{{--
    Public home page. Story order: problem → solution (Scoriet + AI) → how it works →
    what is generated → platforms → after generation → features → open source →
    pricing → FAQ → call to action.
    Texts: lang/{locale}/home.php (+ landing.php for hero, pricing and CTA).
    Screenshots ($screenshots, see PublicSiteController) render only when the
    image file exists in public/images/landing/.
--}}

@php
    $currency = $pricing['currency'];
    $subscriptions = $pricing['subscriptions'];
    $defaultInterval = \App\Support\PricingCatalog::DEFAULT_INTERVAL;
    $money = fn (float $amount) => $currency . ' ' . number_format($amount, 2, '.', '');
    // Savings: "EUR 120" for whole amounts, "EUR 23.90" otherwise (same as formatMoney() in lib/plans.ts)
    $savedMoney = fn (float $amount) => $currency . ' ' . (floor($amount) == $amount ? number_format($amount, 0, '.', '') : number_format($amount, 2, '.', ''));

    // Icons in the order of the translated lists in lang/{locale}/home.php
    $lifecycleIcons = ['pi-cloud-upload', 'pi-arrow-right-arrow-left', 'pi-replay', 'pi-database'];
    $featureIcons = [
        'pi-database', 'pi-th-large', 'pi-chart-bar', 'pi-window-maximize', 'pi-users',
        'pi-objects-column', 'pi-comments', 'pi-language', 'pi-file-import', 'pi-shop',
    ];
    $technologies = ['C# / .NET', 'Java / Spring Boot', 'Laravel / PHP', 'Rust', 'Flutter / Dart', 'React / React Native'];

    $tiers = [
        [
            'plan' => 'free',
            'name' => \App\Support\PricingCatalog::PLAN_NAMES['free'],
            'description' => __('landing.free_desc'),
            'features' => array_map(fn ($i) => __('landing.free_f' . $i), range(1, 6)),
            'button' => __('landing.free_button'),
            'popular' => false,
            'patron' => false,
        ],
        [
            'plan' => 'patron_annual',
            'name' => \App\Support\PricingCatalog::PLAN_NAMES['patron_annual'],
            'description' => __('landing.annual_desc'),
            'features' => array_map(fn ($i) => __('landing.annual_f' . $i), range(1, 5)),
            'button' => __('landing.register_first'),
            'popular' => true,
            'patron' => true,
        ],
        [
            'plan' => 'patron_monthly',
            'name' => \App\Support\PricingCatalog::PLAN_NAMES['patron_monthly'],
            'description' => __('landing.monthly_desc'),
            'features' => array_map(fn ($i) => __('landing.monthly_f' . $i), range(1, 5)),
            'button' => __('landing.register_first'),
            'popular' => false,
            'patron' => true,
        ],
    ];
@endphp

@section('content')
    {{-- ============ Hero ============ --}}
    <section class="py-20 sm:py-28" style="background: linear-gradient(to bottom right, var(--theme-bg-primary), var(--theme-bg-secondary), color-mix(in srgb, var(--theme-accent) 25%, transparent));">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p class="pub-eyebrow mb-6">{{ __('home.hero_eyebrow') }}</p>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-8 text-(--theme-accent)">{{ __('landing.hero_title') }}</h1>
            <p class="text-xl sm:text-2xl leading-relaxed mb-5 max-w-4xl mx-auto text-(--theme-text-primary)">{{ __('landing.hero_subtitle') }}</p>
            <p class="text-lg mb-10 max-w-3xl mx-auto italic text-(--theme-text-muted)">{{ __('landing.hero_tagline') }}</p>

            <div class="flex flex-wrap justify-center gap-3 mb-10">
                @if ($isDemo)
                    <button type="button" class="pub-btn pub-btn--lg pub-btn--orange" data-public-action="login">
                        <i class="pi pi-desktop" aria-hidden="true"></i>{{ __('landing.try_demo') }}
                    </button>
                @else
                    {{-- One primary action in the header: try the demo. Registration stays in pricing and the CTA. --}}
                    <button type="button" class="pub-btn pub-btn--lg pub-btn--orange" data-public-action="demo">
                        <i class="pi pi-desktop" aria-hidden="true"></i>{{ __('landing.try_demo') }}
                    </button>
                @endif
                <button type="button" class="pub-btn pub-btn--lg pub-btn--outline" data-public-action="video">
                    <i class="pi pi-play" aria-hidden="true"></i>{{ __('landing.watch_demo') }}
                </button>
                {{-- Revealed by the island only when the browser offers PWA installation. --}}
                <button type="button" class="pub-btn pub-btn--lg pub-btn--success" data-public-action="install" hidden>
                    <i class="pi pi-download" aria-hidden="true"></i>{{ __('landing.install_app') }}
                </button>
            </div>

            <ul class="flex flex-wrap justify-center gap-x-8 gap-y-3 text-lg text-(--theme-text-secondary) mb-14">
                @foreach (__('home.hero_points') as $point)
                    <li class="flex items-center gap-2"><i class="pi pi-check-circle text-(--theme-success-text)" aria-hidden="true"></i>{{ $point }}</li>
                @endforeach
            </ul>

            {{-- The core idea in one line: schema → template → app → AI --}}
            <ol class="pub-pipeline" aria-label="{{ __('home.solution_title') }}">
                @foreach (__('home.pipeline') as $index => $stage)
                    <li class="pub-pipeline__stage {{ $loop->last ? 'pub-pipeline__stage--ai' : '' }}">
                        <span class="pub-pipeline__number">{{ $index + 1 }}</span>{{ $stage }}
                    </li>
                @endforeach
            </ol>

            @if ($screenshots['studio'])
                <img src="{{ $screenshots['studio'] }}" alt="{{ __('home.features_title') }}" class="pub-screenshot mt-14" loading="eager">
            @endif
        </div>
    </section>

    {{-- ============ Problem ============ --}}
    <section class="py-20 sm:py-24 bg-(--theme-bg-secondary)">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <div>
                <p class="pub-kicker">{{ __('home.problem_kicker') }}</p>
                <h2 class="pub-section-title">{{ __('home.problem_title') }}</h2>
                <p class="pub-lead">{{ __('home.problem_text') }}</p>
            </div>
            <ul class="space-y-4">
                @foreach (__('home.problem_items') as $item)
                    <li class="pub-card p-5 flex items-start gap-4 text-lg text-(--theme-text-primary)">
                        <i class="pi pi-times-circle text-red-500 pub-icon--md mt-1" aria-hidden="true"></i>{{ $item }}
                    </li>
                @endforeach
            </ul>
        </div>
    </section>

    {{-- ============ Solution: Scoriet builds the foundation, AI builds on it ============ --}}
    <section class="py-20 sm:py-24 bg-(--theme-bg-primary)">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-4xl mx-auto mb-14">
                <p class="pub-kicker">{{ __('home.solution_kicker') }}</p>
                <h2 class="pub-section-title">{{ __('home.solution_title') }}</h2>
                <p class="pub-lead">{{ __('home.solution_text') }}</p>
            </div>

            <h3 class="text-2xl sm:text-3xl font-bold text-center mb-8 text-(--theme-text-primary)">{{ __('home.compare_title') }}</h3>
            <div class="grid md:grid-cols-2 gap-6">
                <div class="pub-card pub-card--negative p-8">
                    <h4 class="text-xl font-bold mb-5 flex items-center gap-3 text-(--theme-text-primary)">
                        <i class="pi pi-folder-open text-red-500 pub-icon--md" aria-hidden="true"></i>{{ __('home.compare_bad_title') }}
                    </h4>
                    <ul class="space-y-3">
                        @foreach (__('home.compare_bad') as $item)
                            <li class="flex items-start gap-3 text-lg text-(--theme-text-secondary)">
                                <i class="pi pi-times text-red-500 mt-1.5" aria-hidden="true"></i>{{ $item }}
                            </li>
                        @endforeach
                    </ul>
                </div>
                <div class="pub-card pub-card--positive p-8">
                    <h4 class="text-xl font-bold mb-5 flex items-center gap-3 text-(--theme-text-primary)">
                        <i class="pi pi-bolt text-(--theme-success-text) pub-icon--md" aria-hidden="true"></i>{{ __('home.compare_good_title') }}
                    </h4>
                    <ul class="space-y-3">
                        @foreach (__('home.compare_good') as $item)
                            <li class="flex items-start gap-3 text-lg text-(--theme-text-secondary)">
                                <i class="pi pi-check text-(--theme-success-text) mt-1.5" aria-hidden="true"></i>{{ $item }}
                            </li>
                        @endforeach
                    </ul>
                </div>
            </div>
        </div>
    </section>

    {{-- ============ How it works ============ --}}
    <section id="how-it-works" class="py-20 sm:py-24 bg-(--theme-bg-secondary)">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-4xl mx-auto mb-14">
                <p class="pub-kicker">{{ __('home.steps_kicker') }}</p>
                <h2 class="pub-section-title">{{ __('home.steps_title') }}</h2>
            </div>
            <ol class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                @foreach (__('home.steps') as $index => $step)
                    <li class="pub-card pub-card--tertiary p-6">
                        <span class="pub-step-number">{{ $index + 1 }}</span>
                        <h3 class="text-xl font-bold mt-4 mb-3 text-(--theme-text-primary)">{{ $step['title'] }}</h3>
                        <p class="text-lg leading-relaxed text-(--theme-text-secondary)">{{ $step['text'] }}</p>
                    </li>
                @endforeach
            </ol>
        </div>
    </section>

    {{-- ============ What the generated app contains ============ --}}
    <section class="py-20 sm:py-24 bg-(--theme-bg-primary)">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <div>
                <p class="pub-kicker">{{ __('home.generated_kicker') }}</p>
                <h2 class="pub-section-title">{{ __('home.generated_title') }}</h2>
                <ul class="grid sm:grid-cols-2 gap-x-6 gap-y-4 mt-8">
                    @foreach (__('home.generated_items') as $item)
                        <li class="flex items-start gap-3 text-lg text-(--theme-text-primary)">
                            <i class="pi pi-check-circle text-(--theme-success-text) pub-icon--md" aria-hidden="true"></i>{{ $item }}
                        </li>
                    @endforeach
                </ul>
            </div>
            @if ($screenshots['generated'])
                <img src="{{ $screenshots['generated'] }}" alt="{{ __('home.generated_title') }}" class="pub-screenshot" loading="lazy">
            @else
                {{-- Until a screenshot exists: the platforms the schema turns into. --}}
                <div class="pub-card p-8">
                    <p class="pub-kicker">{{ __('home.tech_kicker') }}</p>
                    <ul class="flex flex-wrap gap-3">
                        @foreach ($technologies as $technology)
                            <li class="pub-chip"><i class="pi pi-code" aria-hidden="true"></i>{{ $technology }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif
        </div>
    </section>

    {{-- ============ Platforms ============ --}}
    <section class="py-20 sm:py-24 bg-(--theme-bg-secondary)">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p class="pub-kicker">{{ __('home.tech_kicker') }}</p>
            <h2 class="pub-section-title">{{ __('home.tech_title') }}</h2>
            <p class="pub-lead mb-10">{{ __('home.tech_text') }}</p>
            <ul class="flex flex-wrap justify-center gap-3">
                @foreach ($technologies as $technology)
                    <li class="pub-chip pub-chip--lg"><i class="pi pi-code" aria-hidden="true"></i>{{ $technology }}</li>
                @endforeach
                <li class="pub-chip pub-chip--lg pub-chip--dashed"><i class="pi pi-plus" aria-hidden="true"></i>{{ __('home.tech_more') }}</li>
            </ul>
        </div>
    </section>

    {{-- ============ Use cases: internal links to the keyword landing pages ============ --}}
    <section id="use-cases" class="py-20 sm:py-24 bg-(--theme-bg-primary)">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-4xl mx-auto mb-12">
                <h2 class="pub-section-title">{{ __('topics.shared.home_title') }}</h2>
                <p class="pub-lead">{{ __('topics.shared.home_text') }}</p>
            </div>
            <ul class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                @foreach (\App\Support\Seo\TopicPages::slugs() as $slug)
                    <li>
                        <a href="{{ \App\Support\Seo\TopicPages::url($locale, $slug) }}" class="pub-card pub-topic-link p-5 flex items-center gap-4 h-full">
                            <span class="pub-feature-icon"><i class="pi {{ \App\Support\Seo\TopicPages::icon($slug) }} pub-icon--md" aria-hidden="true"></i></span>
                            <span class="text-lg font-semibold">{{ __('topics.pages.' . $slug . '.nav') }}</span>
                        </a>
                    </li>
                @endforeach
            </ul>
        </div>
    </section>

    {{-- ============ After generation ============ --}}
    <section class="py-20 sm:py-24 bg-(--theme-bg-secondary)">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-4xl mx-auto mb-14">
                <p class="pub-kicker">{{ __('home.lifecycle_kicker') }}</p>
                <h2 class="pub-section-title">{{ __('home.lifecycle_title') }}</h2>
                <p class="pub-lead">{{ __('home.lifecycle_text') }}</p>
            </div>
            <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                @foreach (__('home.lifecycle') as $index => $entry)
                    <article class="pub-card p-6">
                        <i class="pi {{ $lifecycleIcons[$index] ?? 'pi-check' }} text-(--theme-accent) pub-icon--lg" aria-hidden="true"></i>
                        <h3 class="text-xl font-bold mt-4 mb-3 text-(--theme-text-primary)">{{ $entry['title'] }}</h3>
                        <p class="text-lg leading-relaxed text-(--theme-text-secondary)">{{ $entry['text'] }}</p>
                    </article>
                @endforeach
            </div>
        </div>
    </section>

    {{-- ============ Features ============ --}}
    <section id="features" class="py-20 sm:py-24 bg-(--theme-bg-primary)">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-4xl mx-auto mb-14">
                <p class="pub-kicker">{{ __('home.features_kicker') }}</p>
                <h2 class="pub-section-title">{{ __('home.features_title') }}</h2>
            </div>
            @if ($screenshots['editor'])
                <img src="{{ $screenshots['editor'] }}" alt="{{ __('home.features_title') }}" class="pub-screenshot mb-14" loading="lazy">
            @endif
            <div class="grid md:grid-cols-2 gap-5">
                @foreach (__('home.features') as $index => $feature)
                    <article class="pub-card pub-card--tertiary p-6 flex items-start gap-5">
                        <span class="pub-feature-icon"><i class="pi {{ $featureIcons[$index] ?? 'pi-check' }} pub-icon--md" aria-hidden="true"></i></span>
                        <div>
                            <h3 class="text-xl font-bold mb-2 text-(--theme-text-primary)">{{ $feature['title'] }}</h3>
                            <p class="text-lg leading-relaxed text-(--theme-text-secondary)">{{ $feature['text'] }}</p>
                        </div>
                    </article>
                @endforeach
            </div>
        </div>
    </section>

    {{-- ============ Open source & trust ============ --}}
    <section class="py-20 sm:py-24 bg-(--theme-bg-secondary)">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <i class="pi pi-shield text-(--theme-accent) pub-icon--xl" aria-hidden="true"></i>
            <p class="pub-kicker mt-6">{{ __('home.trust_kicker') }}</p>
            <h2 class="pub-section-title">{{ __('home.trust_title') }}</h2>
            <p class="pub-lead mb-10">{{ __('home.trust_text') }}</p>
            <a href="https://github.com/Harveyhase68/scoriet" class="pub-btn pub-btn--lg pub-btn--outline" target="_blank" rel="noopener noreferrer">
                <i class="pi pi-github" aria-hidden="true"></i>{{ __('home.trust_github') }}
            </a>
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
    {{--
        Both intervals are in the HTML (crawlable, no layout shift); public.css shows the
        prices of the interval in data-billing-interval, PublicIsland flips the attribute.
    --}}
    <section id="pricing" class="py-20 sm:py-24 bg-(--theme-bg-primary)" data-billing-interval="{{ $defaultInterval }}">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="pub-section-title text-center">{{ __('landing.pricing_title') }}</h2>
            <p class="pub-lead text-center mb-8">{{ __('landing.pricing_subtitle') }}</p>

            <div class="pub-billing-toggle mb-12" role="group" aria-label="{{ __('landing.billing_toggle_label') }}">
                <button type="button" class="pub-billing-toggle__label" data-public-action="billing-interval" data-interval="month">{{ __('landing.billing_monthly') }}</button>
                <button type="button" class="pub-billing-toggle__switch" role="switch" aria-checked="{{ $defaultInterval === 'year' ? 'true' : 'false' }}" aria-label="{{ __('landing.billing_yearly') }}" data-public-action="billing-interval" data-interval="toggle">
                    <span class="pub-billing-toggle__knob" aria-hidden="true"></span>
                </button>
                <button type="button" class="pub-billing-toggle__label" data-public-action="billing-interval" data-interval="year">{{ __('landing.billing_yearly') }}</button>
                <span class="pub-billing-toggle__hint">{{ __('landing.billing_yearly_hint') }}</span>
            </div>

            <div class="grid md:grid-cols-3 gap-6">
                @foreach ($tiers as $tier)
                    <article class="pub-card pub-card--raised relative p-6 text-center flex flex-col {{ $tier['popular'] ? 'pub-card--popular' : '' }}">
                        @if ($tier['popular'])
                            <span class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold bg-(--theme-accent) text-white">{{ __('landing.most_popular') }}</span>
                        @endif

                        <h3 class="text-2xl font-bold mb-2 flex items-center justify-center gap-2 text-(--theme-text-primary)">
                            {{ $tier['name'] }}
                            @if ($tier['patron'])
                                <i class="pi pi-heart-fill text-red-500" aria-hidden="true"></i>
                            @endif
                        </h3>

                        @if ($tier['plan'] === 'free')
                            <div class="mb-4">
                                <span class="text-4xl font-bold text-(--theme-text-primary)">{{ $money(0.0) }}</span>
                                <span class="text-(--theme-text-muted)">{{ __('landing.free_period') }}</span>
                            </div>
                        @else
                            @foreach (\App\Support\PricingCatalog::INTERVALS as $interval)
                                @php($view = \App\Support\PricingCatalog::priceView($tier['plan'], $subscriptions[$tier['plan']], $interval))
                                <div class="mb-4" data-billing-only="{{ $interval }}">
                                    <span class="text-4xl font-bold text-(--theme-text-primary)">{{ $money($view['amount']) }}</span>
                                    <span class="text-(--theme-text-muted)">{{ $view['per'] === 'year' ? __('landing.annual_period') : __('landing.monthly_period') }}</span>
                                    @if ($view['billed_yearly'] !== null)
                                        <div class="text-sm mt-1 text-(--theme-text-muted)">{{ __('landing.billing_billed_yearly', ['amount' => $money($view['billed_yearly'])]) }}</div>
                                    @endif
                                    @if ($view['savings'] !== null)
                                        <div class="text-sm mt-1 font-semibold text-(--theme-success-text)">
                                            {{ $view['savings']['kind'] === 'percent'
                                                ? __('landing.billing_save_percent', ['value' => $view['savings']['value']])
                                                : __('landing.billing_save_amount', ['value' => $savedMoney($view['savings']['value'])]) }}
                                        </div>
                                    @endif
                                </div>
                            @endforeach
                        @endif

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

    {{-- ============ FAQ (also emitted as FAQPage JSON-LD by PublicSiteController) ============ --}}
    <section id="faq" class="py-20 sm:py-24 bg-(--theme-bg-secondary)">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="pub-section-title text-center mb-12">{{ __('home.faq_title') }}</h2>
            <div class="space-y-4">
                @foreach (__('home.faq') as $entry)
                    <details class="pub-faq pub-card" @if ($loop->first) open @endif>
                        <summary>
                            <h3>{{ $entry['q'] }}</h3>
                            <i class="pi pi-chevron-down" aria-hidden="true"></i>
                        </summary>
                        <p>{{ $entry['a'] }}</p>
                    </details>
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
