// resources/js/app.tsx
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import AdminLayout from '@/components/AdminLayout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        const page = resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx')
        );
        
        // Automatisch AdminLayout für alle Seiten außer Auth-Seiten UND Index
        page.then((module) => {
            if (!name.startsWith('Auth/') && 
                !name.startsWith('Guest/') && 
                name !== 'Index') { // Index verwendet RC Dock Layout
                module.default.layout = module.default.layout || ((page) => (
                    <AdminLayout>{page}</AdminLayout>
                ));
            }
        });
        
        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#4f46e5',
    },
});