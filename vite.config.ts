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
                    if (id.includes('node_modules')) {
                        // SOLUTION: React core + Ant Design core together (but icons separate)
                        if (id.includes('react/') || id.includes('react-dom/')) {
                            return 'react-foundation';
                        }
                        if (id.includes('antd/') && !id.includes('icons')) {
                            return 'react-foundation'; // Share React context
                        }

                        // Ant Design Icons separate (large but not critical for context)
                        if (id.includes('@ant-design/icons')) {
                            return 'antd-icons';
                        }

                        // React 19 compatibility
                        if (id.includes('@ant-design/v5-patch-for-react-19')) {
                            return 'react-foundation';
                        }

                        // Inertia with React context
                        if (id.includes('@inertiajs/react')) {
                            return 'react-foundation';
                        }

                        // Other React-based libraries (use React context)
                        if (id.includes('react-hook-form') || id.includes('react-hotkeys-hook')) {
                            return 'react-foundation';
                        }

                        // Large UI libraries separate
                        if (id.includes('primereact') || id.includes('primeicons')) {
                            return 'ui-prime';
                        }
                        if (id.includes('rc-dock')) {
                            return 'dock';
                        }
                        if (id.includes('reactflow')) {
                            return 'flowchart';
                        }

                        // i18n libraries
                        if (id.includes('i18next')) {
                            return 'i18n';
                        }

                        // Utility libraries
                        if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
                            return 'utils';
                        }

                        // Everything else
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
        chunkSizeWarningLimit: 800,
    }
});
