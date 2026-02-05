<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Scoriet') }} – Enterprise Code Generator</title>

        {{-- SEO Meta Tags --}}
        <meta name="description" content="Scoriet is an Enterprise Code Generator that automates code generation through intelligent templating. Generate PHP, Laravel, React, and more from your database schemas.">
        <meta name="keywords" content="code generator, template engine, PHP generator, Laravel generator, database schema, enterprise development, automation">
        <meta name="author" content="Scoriet">
        <meta name="robots" content="index, follow">
        <link rel="canonical" href="{{ url()->current() }}">

        {{-- Open Graph / Facebook --}}
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:title" content="{{ config('app.name', 'Scoriet') }} – Enterprise Code Generator">
        <meta property="og:description" content="Automate code generation through intelligent templating. Generate PHP, Laravel, React, and more from your database schemas.">
        <meta property="og:image" content="{{ asset('images/logos/scoriet-logo.png') }}">
        <meta property="og:site_name" content="Scoriet">
        <meta property="og:locale" content="en_US">

        {{-- Twitter Card --}}
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="{{ url()->current() }}">
        <meta name="twitter:title" content="{{ config('app.name', 'Scoriet') }} – Enterprise Code Generator">
        <meta name="twitter:description" content="Automate code generation through intelligent templating. Generate PHP, Laravel, React, and more from your database schemas.">
        <meta name="twitter:image" content="{{ asset('images/logos/scoriet-logo.png') }}">

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        {{-- PWA Support --}}
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="theme-color" content="#3b82f6">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="Scoriet">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="application-name" content="Scoriet">

        @routes
        @if(app()->environment('local'))
            @viteReactRefresh
        @endif
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
