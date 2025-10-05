<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title') - {{ config('app.name', 'Scoriet') }}</title>
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    @vite('resources/css/app.css')
    <style>
        /* Inline critical styles */
        body {
            background-color: #111827;
            color: #ffffff;
        }
    </style>
</head>
<body style="font-family: ui-sans-serif, system-ui, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
    <div style="min-height: 100vh; display: flex; flex-direction: column; background-color: #111827; color: #ffffff;">

        <!-- Header - EXACTLY like LandingPage.tsx -->
        <header style="background-color: #1f2937; border-bottom: 1px solid #374151;">
            <div style="max-width: 80rem; margin: 0 auto; padding: 0 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; height: 4rem;">
                    <div style="display: flex; align-items: center;">
                        <img src="/images/logos/scoriet-logo.png" alt="Scoriet Logo" style="height: 2rem; width: auto;">
                        <span style="margin-left: 0.5rem; display: inline-flex; align-items: center; padding: 0.25rem 0.625rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">BETA</span>
                    </div>

                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <a href="/" style="color: rgba(255, 255, 255, 0.9); padding: 0.375rem 0.75rem; font-size: 0.875rem; font-weight: 500; text-decoration: none; border-radius: 0.5rem; transition: color 0.2s;">Home</a>

                        @if(str_contains(request()->path(), 'admin'))
                            <a href="/admin/pages" style="color: rgba(255, 255, 255, 0.9); padding: 0.375rem 0.75rem; font-size: 0.875rem; font-weight: 500; text-decoration: none; border-radius: 0.5rem; transition: color 0.2s;">Admin</a>
                        @else
                            <a href="/{{ app()->getLocale() }}/help" style="color: rgba(255, 255, 255, 0.9); padding: 0.375rem 0.75rem; font-size: 0.875rem; font-weight: 500; text-decoration: none; border-radius: 0.5rem; transition: color 0.2s;">{{ __('pages.help.title') ?? 'Help' }}</a>
                            <a href="/{{ app()->getLocale() }}/impressum" style="color: rgba(255, 255, 255, 0.9); padding: 0.375rem 0.75rem; font-size: 0.875rem; font-weight: 500; text-decoration: none; border-radius: 0.5rem; transition: color 0.2s;">Impressum</a>
                        @endif

                        <a href="/app" style="background-color: #2563eb; color: white; padding: 0.375rem 1rem; font-size: 0.875rem; font-weight: 600; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); text-decoration: none; display: inline-flex; align-items: center; border-radius: 0.5rem; transition: background-color 0.2s;">
                            Go to App
                            <svg style="margin-left: 0.5rem; margin-right: -0.125rem; width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content Area -->
        <main style="flex-grow: 1; padding: 5rem 0;">
            <div style="max-width: 80rem; margin: 0 auto; padding: 0 1rem;">
                @yield('content')
            </div>
        </main>

        <!-- Footer - EXACTLY like LandingPage.tsx -->
        <footer style="background-color: #1f2937; border-top: 1px solid #374151; padding: 3rem 0;">
            <div style="max-width: 80rem; margin: 0 auto; padding: 0 1rem;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
                    <div>
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: white;">Scoriet</h3>
                        <p style="color: #9ca3af; margin-bottom: 1rem;">
                            The future of code generation. Built by developers, for developers.
                        </p>
                        <div style="display: flex; gap: 1rem;">
                            <a href="#" style="color: rgba(255, 255, 255, 0.7); transition: color 0.2s;">
                                <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"/>
                                </svg>
                            </a>
                            <a href="#" style="color: rgba(255, 255, 255, 0.7); transition: color 0.2s;">
                                <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                                </svg>
                            </a>
                            <a href="#" style="color: rgba(255, 255, 255, 0.7); transition: color 0.2s;">
                                <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 style="font-weight: 600; margin-bottom: 1rem; color: white;">Product</h4>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Features</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Pricing</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Templates</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Examples</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 style="font-weight: 600; margin-bottom: 1rem; color: white;">Resources</h4>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Documentation</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">API Reference</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Tutorials</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Blog</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 style="font-weight: 600; margin-bottom: 1rem; color: white;">Support</h4>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li style="margin-bottom: 0.5rem;"><a href="/{{ app()->getLocale() }}/help" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">{{ __('pages.help.title') ?? 'Help' }}</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="/{{ app()->getLocale() }}/impressum" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Impressum</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Contact Us</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Community</a></li>
                        </ul>
                    </div>
                </div>

                <!-- Divider -->
                <div style="border-top: 1px solid #374151; margin: 2rem 0;"></div>

                <div style="display: flex; justify-content: space-between; align-items: center; color: #9ca3af;">
                    <p>&copy; {{ date('Y') }} Scoriet. All rights reserved.</p>
                    <div style="display: flex; gap: 1.5rem;">
                        <a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Privacy Policy</a>
                        <a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</body>
</html>