import React from 'react';
import '../css/app.css';
import './styles/fonts';
import './Components/Panels/styles.css'; // Global panel theming (DataTables, Splitters, etc.)

import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import './i18n'; // Initialize i18n
import { ProjectProvider } from '@/contexts/ProjectContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { loadPricingData } from '@/lib/pricingBootstrap';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Initialize pricing data before app starts
loadPricingData();

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) =>
        resolvePageComponent<{ default: ResolvedComponent }>(
            `./pages/${name}.tsx`,
            import.meta.glob<{ default: ResolvedComponent }>('./pages/**/*.tsx'),
        ).then((module) => module.default),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ThemeProvider>
                <ToastProvider>
                    <ProjectProvider>
                        <App {...props} />
                    </ProjectProvider>
                </ToastProvider>
            </ThemeProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
