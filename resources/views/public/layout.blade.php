{{--
    Public (crawlable) site layout: home, CMS pages, public projects.

    Everything search engines need is plain server-rendered HTML. The React
    island (resources/js/public.tsx) only adds behaviour on top: auth modals,
    demo access, plans, video, CMS popups. Without JavaScript the page still
    shows its complete content.

    Expected view data: $locale, $seo (SeoMeta), $isDemo, $languageLinks, $islandContext
--}}
<!DOCTYPE html>
<html lang="{{ $locale }}" data-theme="dark" data-auth="guest">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        @include('public.partials.preferences-script')
        @include('public.partials.seo-head')

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="theme-color" content="#3b82f6">
        <meta name="application-name" content="Scoriet">

        @if(app()->environment('local'))
            @viteReactRefresh
        @endif
        @vite(['resources/css/app.css', 'resources/css/public.css', 'resources/js/public.tsx'])
    </head>
    <body class="public-body font-sans antialiased">
        @include('public.partials.header')

        <main id="main">
            @yield('content')
        </main>

        @include('public.partials.footer')

        {{-- Data for the React island; @json escapes <, >, & and quotes so it is safe inside <script>. --}}
        <script type="application/json" id="public-page-context">@json($islandContext)</script>
        <div id="public-island"></div>
    </body>
</html>
