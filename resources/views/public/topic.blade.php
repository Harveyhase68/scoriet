@extends('public.layout')

{{--
    Keyword landing page ("use case"). One template for all topics; content from
    lang/{locale}/topics.php (pages.{slug} + shared). Controller: TopicPageController.
--}}

@section('content')
    {{-- ============ Header ============ --}}
    <section class="py-20 sm:py-24" style="background: linear-gradient(to bottom right, var(--theme-bg-primary), var(--theme-bg-secondary), color-mix(in srgb, var(--theme-accent) 25%, transparent));">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <nav class="mb-6 text-base text-(--theme-text-muted)" aria-label="Breadcrumb">
                <a href="{{ \App\Support\Seo\PublicLocales::homeUrl($locale) }}" class="pub-link">Scoriet</a>
                <span aria-hidden="true"> / </span>
                <span>{{ $content['nav'] }}</span>
            </nav>
            <span class="pub-feature-icon mb-6" style="width: 4.5rem; height: 4.5rem;"><i class="pi {{ $icon }} pub-icon--lg" aria-hidden="true"></i></span>
            <p class="pub-kicker">{{ __('topics.shared.kicker') }}</p>
            <h1 class="text-4xl sm:text-5xl font-extrabold leading-tight mb-8 text-(--theme-accent)">{{ $content['h1'] }}</h1>
            <p class="text-xl sm:text-2xl leading-relaxed mb-10 max-w-4xl mx-auto text-(--theme-text-primary)">{{ $content['intro'] }}</p>
            <div class="flex flex-wrap justify-center gap-3">
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
            </div>
        </div>
    </section>

    {{-- ============ Benefits ============ --}}
    <section class="py-20 sm:py-24 bg-(--theme-bg-secondary)">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="pub-section-title text-center mb-12">{{ $content['benefits_title'] }}</h2>
            <div class="grid md:grid-cols-2 gap-5">
                @foreach ($content['benefits'] as $benefit)
                    <article class="pub-card pub-card--tertiary p-6 flex items-start gap-5">
                        <span class="pub-feature-icon"><i class="pi pi-check pub-icon--md" aria-hidden="true"></i></span>
                        <div>
                            <h3 class="text-xl font-bold mb-2 text-(--theme-text-primary)">{{ $benefit['title'] }}</h3>
                            <p class="text-lg leading-relaxed text-(--theme-text-secondary)">{{ $benefit['text'] }}</p>
                        </div>
                    </article>
                @endforeach
            </div>
        </div>
    </section>

    {{-- ============ What is generated + workflow ============ --}}
    <section class="py-20 sm:py-24 bg-(--theme-bg-primary)">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12">
            <div>
                <p class="pub-kicker">{{ __('topics.shared.included_kicker') }}</p>
                <h2 class="pub-section-title">{{ $content['included_title'] }}</h2>
                <ul class="space-y-4 mt-8">
                    @foreach ($content['included'] as $item)
                        <li class="flex items-start gap-3 text-lg text-(--theme-text-primary)">
                            <i class="pi pi-check-circle text-(--theme-success-text) pub-icon--md" aria-hidden="true"></i>{{ $item }}
                        </li>
                    @endforeach
                </ul>
            </div>
            <div>
                <p class="pub-kicker">{{ __('topics.shared.workflow_kicker') }}</p>
                <h2 class="pub-section-title">{{ $content['workflow_title'] }}</h2>
                <ol class="space-y-5 mt-8">
                    @foreach ($content['workflow'] as $index => $step)
                        <li class="pub-card p-6 flex items-start gap-5">
                            <span class="pub-step-number shrink-0">{{ $index + 1 }}</span>
                            <div>
                                <h3 class="text-xl font-bold mb-2 text-(--theme-text-primary)">{{ $step['title'] }}</h3>
                                <p class="text-lg leading-relaxed text-(--theme-text-secondary)">{{ $step['text'] }}</p>
                            </div>
                        </li>
                    @endforeach
                </ol>
            </div>
        </div>
    </section>

    {{-- ============ FAQ (also emitted as FAQPage JSON-LD) ============ --}}
    <section class="py-20 sm:py-24 bg-(--theme-bg-secondary)">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="pub-section-title text-center mb-12">{{ __('topics.shared.faq_title') }}</h2>
            <div class="space-y-4">
                @foreach ($content['faq'] as $entry)
                    <details class="pub-faq pub-card pub-card--raised" @if ($loop->first) open @endif>
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

    {{-- ============ Related use cases (internal links) ============ --}}
    <section class="py-20 sm:py-24 bg-(--theme-bg-primary)">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="pub-section-title text-center mb-12">{{ __('topics.shared.related_title') }}</h2>
            <ul class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                @foreach ($related as $link)
                    <li>
                        <a href="{{ $link['url'] }}" class="pub-card pub-topic-link p-5 flex items-center gap-4">
                            <span class="pub-feature-icon"><i class="pi {{ $link['icon'] }} pub-icon--md" aria-hidden="true"></i></span>
                            <span class="text-lg font-semibold">{{ $link['label'] }}</span>
                            <i class="pi pi-arrow-right ml-auto" aria-hidden="true"></i>
                        </a>
                    </li>
                @endforeach
            </ul>
        </div>
    </section>

    {{-- ============ Call to action ============ --}}
    <section class="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 class="text-3xl sm:text-4xl font-bold mb-4">{{ __('topics.shared.cta_title') }}</h2>
            <p class="text-xl mb-8 text-blue-100">{{ __('topics.shared.cta_text') }}</p>
            <div class="flex flex-wrap justify-center gap-3">
                <a href="/app" data-auth-show="user" class="pub-btn pub-btn--lg pub-btn--orange">
                    <i class="pi pi-arrow-right" aria-hidden="true"></i>{{ __('landing.goto_app') }}
                </a>
                <span data-auth-show="guest" class="contents">
                    <button type="button" class="pub-btn pub-btn--lg pub-btn--orange" data-public-action="{{ $isDemo ? 'login' : 'register' }}">
                        <i class="pi pi-flag" aria-hidden="true"></i>{{ $isDemo ? __('landing.try_demo_now') : __('landing.start_free') }}
                    </button>
                </span>
                <a href="https://github.com/Harveyhase68/scoriet" class="pub-btn pub-btn--lg pub-btn--on-gradient-outline" target="_blank" rel="noopener noreferrer">
                    <i class="pi pi-github" aria-hidden="true"></i>GitHub
                </a>
            </div>
        </div>
    </section>
@endsection
