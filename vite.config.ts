import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'logo.svg'],
            manifest: {
                name: 'Scoriet - Schema-to-Stack Studio',
                short_name: 'Scoriet',
                description: 'Automate code generation through intelligent templating. Generate PHP, Laravel, React, and more from your database schemas.',
                theme_color: '#3b82f6',
                background_color: '#0f172a',
                display: 'standalone',
                orientation: 'any',
                start_url: '/',
                scope: '/',
                categories: ['developer tools', 'productivity', 'utilities'],
                icons: [
                    {
                        src: '/icons/icon-72x72.png',
                        sizes: '72x72',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/icon-96x96.png',
                        sizes: '96x96',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/icon-128x128.png',
                        sizes: '128x128',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/icon-144x144.png',
                        sizes: '144x144',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/icon-152x152.png',
                        sizes: '152x152',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: '/icons/icon-384x384.png',
                        sizes: '384x384',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: '/icons/icon-maskable-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                    {
                        src: '/icons/icon-maskable-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
            },
            devOptions: {
                enabled: false, // Disable in dev mode to not interfere with HMR
            },
        }),
    ],
    server: {
        host: true,  // Listen on all network interfaces (0.0.0.0) — allows LAN access from phone
        port: 5173,
        origin: 'http://10.0.0.8:5173',  // Use network IP so phone can load assets
        cors: true,
        watch: {
            // Ignore directories where PHP writes files at runtime — prevents Vite from
            // triggering a full-reload when e.g. the template import wizard extracts archives
            ignored: ['**/storage/**', '**/vendor/**', '**/public/build/**'],
        },
    },    
    esbuild: {
        jsx: 'automatic',
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
            },
        },
    },
    resolve: {
        alias: {
			'@': resolve(__dirname, 'resources/js'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // Large libraries get their own chunks (lazy loaded when needed)
                    if (id.includes('node_modules')) {
                        // CodeMirror - all packages together
                        if (id.includes('@codemirror') || id.includes('codemirror')) {
                            return 'codemirror';
                        }
                        // xyflow (formerly ReactFlow) - diagram library (~400KB)
                        if (id.includes('@xyflow')) {
                            return 'xyflow';
                        }
                        // JSZip
                        if (id.includes('jszip')) {
                            return 'jszip';
                        }
                        // PrismJS
                        if (id.includes('prismjs')) {
                            return 'prism';
                        }
                        // Quill editor
                        if (id.includes('quill')) {
                            return 'quill';
                        }
                        // rc-dock
                        if (id.includes('rc-dock')) {
                            return 'rc-dock';
                        }
                        // PrimeReact
                        if (id.includes('primereact')) {
                            return 'primereact';
                        }
                        // i18next - internationalization
                        if (id.includes('i18next')) {
                            return 'i18n';
                        }
                        // Icon libraries
                        if (id.includes('lucide-react') || id.includes('@heroicons')) {
                            return 'icons';
                        }
                        // All other node_modules go to vendor
                        return 'vendor';
                    }

                    // App code splitting
                    if (id.includes('/Components/Panels/')) {
                        return 'panels';
                    }
                    if (id.includes('/Components/Modals/')) {
                        return 'modals';
                    }
                    if (id.includes('/Components/AuthModals/')) {
                        return 'auth';
                    }
                },
            },
        },
        chunkSizeWarningLimit: 1500,
    }
});
