<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>" class="<?php echo \Illuminate\Support\Arr::toCssClasses(['dark' => ($appearance ?? 'system') == 'dark']); ?>">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        
        <script>
            (function() {
                const appearance = '<?php echo e($appearance ?? "system"); ?>';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia><?php echo e(config('app.name', 'Scoriet')); ?> – Enterprise Code Generator</title>

        
        <meta name="description" content="Scoriet is an Enterprise Code Generator that automates code generation through intelligent templating. Generate PHP, Laravel, React, and more from your database schemas.">
        <meta name="keywords" content="code generator, template engine, PHP generator, Laravel generator, database schema, enterprise development, automation">
        <meta name="author" content="Scoriet">
        <meta name="robots" content="index, follow">
        <link rel="canonical" href="<?php echo e(url()->current()); ?>">

        
        <meta property="og:type" content="website">
        <meta property="og:url" content="<?php echo e(url()->current()); ?>">
        <meta property="og:title" content="<?php echo e(config('app.name', 'Scoriet')); ?> – Enterprise Code Generator">
        <meta property="og:description" content="Automate code generation through intelligent templating. Generate PHP, Laravel, React, and more from your database schemas.">
        <meta property="og:image" content="<?php echo e(asset('images/logos/scoriet-logo.png')); ?>">
        <meta property="og:site_name" content="Scoriet">
        <meta property="og:locale" content="en_US">

        
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="<?php echo e(url()->current()); ?>">
        <meta name="twitter:title" content="<?php echo e(config('app.name', 'Scoriet')); ?> – Enterprise Code Generator">
        <meta name="twitter:description" content="Automate code generation through intelligent templating. Generate PHP, Laravel, React, and more from your database schemas.">
        <meta name="twitter:image" content="<?php echo e(asset('images/logos/scoriet-logo.png')); ?>">

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="theme-color" content="#3b82f6">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="Scoriet">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="application-name" content="Scoriet">

        <?php echo app('Tighten\Ziggy\BladeRouteGenerator')->generate(); ?>
        <?php if(app()->environment('local')): ?>
            <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
        <?php endif; ?>
        <?php echo app('Illuminate\Foundation\Vite')(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"]); ?>
        <?php if (!isset($__inertiaSsrDispatched)) { $__inertiaSsrDispatched = true; $__inertiaSsrResponse = app(\Inertia\Ssr\Gateway::class)->dispatch($page); }  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->head; } ?>
    </head>
    <body class="font-sans antialiased">
        <?php if (!isset($__inertiaSsrDispatched)) { $__inertiaSsrDispatched = true; $__inertiaSsrResponse = app(\Inertia\Ssr\Gateway::class)->dispatch($page); }  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->body; } elseif (config('inertia.use_script_element_for_initial_page')) { ?><script data-page="app" type="application/json"><?php echo json_encode($page); ?></script><div id="app"></div><?php } else { ?><div id="app" data-page="<?php echo e(json_encode($page)); ?>"></div><?php } ?>
    </body>
</html>
<?php /**PATH C:\wamp\www\scoriet\resources\views/app.blade.php ENDPATH**/ ?>