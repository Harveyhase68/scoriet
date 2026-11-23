{{--
    Runs synchronously before the first paint:
      1. data-theme  — the visitor's stored theme (same storage key and 'auto'
         rule as resources/js/contexts/ThemeContext.tsx), so public.css paints
         the right palette immediately instead of flashing dark → light.
      2. data-auth   — "user" when an access token is stored (same rule the
         React landing page used); the island verifies it against /api/user.
      3. Only on the English home page "/": visitors whose stored or browser
         language is another supported language are sent to their localized
         home page (/de, /fr, ...). Crawlers have no stored language and an
         English browser, so they always get the page they requested.
         Mirrors detectBrowserLanguage() in resources/js/i18n/index.ts.
--}}
<script>
    (function () {
        var root = document.documentElement;
        try {
            var theme = localStorage.getItem('scoriet_theme');
            if (theme === 'auto') {
                var hour = new Date().getHours();
                theme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
            }
            if (theme !== 'light' && theme !== 'green') {
                theme = 'dark';
            }
            root.setAttribute('data-theme', theme);

            var token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            root.setAttribute('data-auth', token ? 'user' : 'guest');
        } catch (e) {
            // Storage blocked (privacy mode): keep the server defaults.
        }

        @if (($islandContext['page'] ?? null) === 'home' && $locale === \App\Support\Seo\PublicLocales::DEFAULT && ($seo->indexable ?? false))
        try {
            if (window.location.pathname === '/') {
                var supported = @json(\App\Support\Seo\PublicLocales::codes());
                var fallback = @json(\App\Support\Seo\PublicLocales::DEFAULT);
                var preferred = localStorage.getItem('scoriet_language');
                if (supported.indexOf(preferred) === -1) {
                    preferred = fallback;
                    var browser = (navigator.language || '').toLowerCase();
                    for (var i = 0; i < supported.length; i++) {
                        if (browser === supported[i] || browser.indexOf(supported[i] + '-') === 0) {
                            preferred = supported[i];
                            break;
                        }
                    }
                }
                if (preferred !== fallback) {
                    window.location.replace('/' + preferred + window.location.search + window.location.hash);
                }
            }
        } catch (e) {
            // Storage blocked: stay on the English page.
        }
        @endif
    })();
</script>
