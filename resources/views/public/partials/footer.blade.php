{{-- $footerPageLinks comes from App\View\Composers\PublicFooterComposer. --}}
@php
    $homeUrl = \App\Support\Seo\PublicLocales::homeUrl($locale);
    $langQuery = '?lang=' . $locale;
@endphp
<footer class="py-12 bg-(--theme-bg-secondary) border-t border-(--theme-border-secondary)">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
            <div>
                <h2 class="text-lg font-semibold mb-4 text-(--theme-text-primary)">Scoriet</h2>
                <p class="mb-4 text-(--theme-text-muted)">{{ __('landing.footer_tagline') }}</p>
                <div class="flex gap-3">
                    <a href="https://github.com/Harveyhase68/scoriet" class="pub-icon-btn" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
                        <i class="pi pi-github" aria-hidden="true"></i>
                    </a>
                    <a href="https://x.com/Harveyhase68" class="pub-icon-btn" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" title="X (Twitter)">
                        <i class="pi pi-twitter" aria-hidden="true"></i>
                    </a>
                    <a href="https://discord.gg/ZtmpPmda" class="pub-icon-btn" target="_blank" rel="noopener noreferrer" aria-label="Discord" title="Discord">
                        <i class="pi pi-discord" aria-hidden="true"></i>
                    </a>
                </div>
            </div>

            <div>
                <h2 class="font-semibold mb-4 text-(--theme-text-primary)">{{ __('landing.footer_product') }}</h2>
                <ul class="space-y-2">
                    <li><button type="button" class="pub-link" data-public-action="features">{{ __('landing.footer_features') }}</button></li>
                    <li><a href="{{ $homeUrl }}#pricing" class="pub-link">{{ __('landing.footer_pricing') }}</a></li>
                </ul>
            </div>

            <div>
                <h2 class="font-semibold mb-4 text-(--theme-text-primary)">{{ __('topics.shared.footer_title') }}</h2>
                <ul class="space-y-2">
                    @foreach (\App\Support\Seo\TopicPages::slugs() as $slug)
                        <li><a href="{{ \App\Support\Seo\TopicPages::url($locale, $slug) }}" class="pub-link">{{ __('topics.pages.' . $slug . '.nav') }}</a></li>
                    @endforeach
                </ul>
            </div>

            <div>
                <h2 class="font-semibold mb-4 text-(--theme-text-primary)">{{ __('landing.footer_resources') }}</h2>
                <ul class="space-y-2">
                    <li><a href="https://scoriet.com/docs/" class="pub-link" target="_blank" rel="noopener noreferrer">{{ __('landing.footer_docs') }}</a></li>
                    <li><a href="https://www.youtube.com/@Harveyhase68a" class="pub-link" target="_blank" rel="noopener noreferrer">{{ __('landing.footer_tutorials') }}</a></li>
                    <li><a href="https://scoriet.com/devlog/{{ $langQuery }}" class="pub-link" target="_blank" rel="noopener noreferrer">{{ __('landing.footer_devlog') }}</a></li>
                    @isset ($footerPageLinks['downloads'])
                        <li><a href="{{ $footerPageLinks['downloads'] }}" class="pub-link">{{ __('landing.footer_downloads') }}</a></li>
                    @endisset
                </ul>
            </div>

            <div>
                <h2 class="font-semibold mb-4 text-(--theme-text-primary)">{{ __('landing.footer_support') }}</h2>
                <ul class="space-y-2">
                    @isset ($footerPageLinks['help'])
                        <li><a href="{{ $footerPageLinks['help'] }}" class="pub-link">{{ __('landing.footer_help') }}</a></li>
                    @endisset
                    <li><a href="https://scoriet.com/pages/kontakt{{ $langQuery }}" class="pub-link">{{ __('landing.footer_contact') }}</a></li>
                    <li><a href="https://scoriet.com/forum/{{ $langQuery }}" class="pub-link" target="_blank" rel="noopener noreferrer">{{ __('landing.footer_community') }}</a></li>
                    <li><a href="https://scoriet.com/pages/tickets{{ $langQuery }}" class="pub-link" target="_blank" rel="noopener noreferrer">{{ __('landing.footer_tickets') }}</a></li>
                    <li><a href="https://scoriet.com/pages/issues{{ $langQuery }}" class="pub-link" target="_blank" rel="noopener noreferrer">{{ __('landing.footer_issues') }}</a></li>
                </ul>
            </div>
        </div>

        <hr class="my-8 border-(--theme-border-secondary)">

        <div class="flex flex-wrap justify-between items-center gap-4 text-(--theme-text-muted)">
            <p>{{ __('landing.all_rights_reserved') }}.</p>
            <div class="flex flex-wrap gap-6">
                <a href="https://scoriet.com/pages/datenschutz{{ $langQuery }}" class="pub-link" target="_blank" rel="noopener noreferrer">{{ __('landing.privacy_policy') }}</a>
                <a href="https://scoriet.com/pages/agb{{ $langQuery }}" class="pub-link" target="_blank" rel="noopener noreferrer">{{ __('landing.terms_of_service') }}</a>
                <a href="https://scoriet.com/pages/impressum{{ $langQuery }}" class="pub-link" target="_blank" rel="noopener noreferrer">{{ __('landing.imprint') }}</a>
            </div>
        </div>
    </div>
</footer>
