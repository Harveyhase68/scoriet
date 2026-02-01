import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    server: {
        host: 'scoriet.local',
        port: 5173,
        origin: 'http://scoriet.local:5173',
        cors: true,
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
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
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
