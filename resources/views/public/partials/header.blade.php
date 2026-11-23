@php
    $homeUrl = \App\Support\Seo\PublicLocales::homeUrl($locale);
    $isHome = ($islandContext['page'] ?? null) === 'home';
@endphp
<header class="bg-(--theme-bg-secondary) border-b border-(--theme-border-secondary)">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap justify-between items-center gap-3 py-3 min-h-16">
            <a href="{{ $homeUrl }}" class="flex items-center hover:opacity-80 transition-opacity">
                <img src="/images/logos/scoriet-logo.png" alt="Scoriet" width="320" height="70" class="h-8 w-auto">
            </a>

            <nav class="flex flex-wrap items-center gap-2">
                @unless ($isHome)
                    <a href="{{ $homeUrl }}" class="pub-btn pub-btn--outline">
                        <i class="pi pi-home" aria-hidden="true"></i>{{ __('landing.home') }}
                    </a>
                @endunless

                @if (count($languageLinks) > 1)
                    <details class="pub-lang">
                        <summary class="pub-btn pub-btn--outline" aria-label="{{ __('landing.language') }}">
                            <i class="pi pi-language" aria-hidden="true"></i>{{ strtoupper($locale) }}
                            <i class="pi pi-chevron-down text-xs" aria-hidden="true"></i>
                        </summary>
                        <div class="pub-lang__menu">
                            @foreach ($languageLinks as $code => $href)
                                <a href="{{ $href }}" hreflang="{{ $code }}" lang="{{ $code }}"
                                   data-locale-link="{{ $code }}"
                                   aria-current="{{ $code === $locale ? 'true' : 'false' }}">
                                    {{ \App\Support\Seo\PublicLocales::SUPPORTED[$code] }}
                                </a>
                            @endforeach
                        </div>
                    </details>
                @endif

                <span data-auth-show="guest" class="contents">
                    <button type="button" class="pub-btn pub-btn--outline" data-public-action="login">{{ __('landing.login') }}</button>
                    @unless ($isDemo)
                        <button type="button" class="pub-btn pub-btn--outline" data-public-action="register">{{ __('landing.register') }}</button>
                    @endunless
                </span>

                <span data-auth-show="user" class="contents">
                    <button type="button" class="pub-btn pub-btn--outline" data-public-action="profile">
                        <i class="pi pi-user" aria-hidden="true"></i>{{ __('landing.profile') }}
                    </button>
                    <button type="button" class="pub-btn pub-btn--outline" data-public-action="plans">
                        <i class="pi pi-credit-card" aria-hidden="true"></i>{{ __('landing.change_plan') }}
                    </button>
                    <button type="button" class="pub-btn pub-btn--outline" data-public-action="logout">
                        <i class="pi pi-sign-out" aria-hidden="true"></i>{{ __('landing.logout') }}
                    </button>
                </span>

                {{-- A real link so it works without JavaScript; the island turns it into "login first" for guests. --}}
                <a href="/app" class="pub-btn pub-btn--orange" data-public-action="goto-app">
                    <i class="pi pi-arrow-right" aria-hidden="true"></i>{{ __('landing.goto_app') }}
                </a>
            </nav>
        </div>
    </div>
</header>
