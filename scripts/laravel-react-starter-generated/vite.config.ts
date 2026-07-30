import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            valetTls: false,
            detectTls: false,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
        },
    },
    server: {
        port: 5174,
        host: '0.0.0.0',
        cors: true,
        hmr: {
            host: '10.0.0.8',
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        if (id.includes('rc-dock')) return 'rc-dock';
                        if (id.includes('primereact')) return 'primereact';
                        return 'vendor';
                    }
                    if (id.includes('/Components/Panels/')) return 'panels';
                },
            },
        },
        chunkSizeWarningLimit: 1500,
    },
});
