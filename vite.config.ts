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
                // ULTIMATE SOLUTION: No chunking for node_modules
                // This ensures perfect load order but creates one big vendor chunk
                manualChunks: (id) => {
                    // Only split our app code, not vendor libraries
                    if (!id.includes('node_modules')) {
                        if (id.includes('/Components/Panels/')) {
                            return 'panels';
                        }
                        if (id.includes('/Components/Modals/')) {
                            return 'modals';
                        }
                        if (id.includes('/Components/AuthModals/')) {
                            return 'auth';
                        }
                    }
                    // All node_modules go into default vendor chunk (no explicit return)
                },
            },
        },
        chunkSizeWarningLimit: 800,
    }
});
