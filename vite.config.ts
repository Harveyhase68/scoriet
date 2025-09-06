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
                manualChunks: (id) => {
                    // Vendor libraries in separate chunks
                    if (id.includes('node_modules')) {
                        if (id.includes('primereact') || id.includes('primeicons')) {
                            return 'ui-prime';
                        }
                        if (id.includes('antd') || id.includes('@ant-design/icons')) {
                            return 'ui-ant';
                        }
                        if (id.includes('rc-dock')) {
                            return 'dock';
                        }
                        if (id.includes('reactflow')) {
                            return 'flowchart';
                        }
                        // Keep React together with other core vendors for compatibility
                        return 'vendor';
                    }
                    
                    // App chunks
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
        // Increase chunk size warning limit since we now have proper splitting
        chunkSizeWarningLimit: 1000,
    }
});
