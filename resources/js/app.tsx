// resources/js/app.tsx
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import AdminLayout from '@/components/AdminLayout';

// PrimeReact CSS - hier hinzufügen!
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

// RC Dock CSS - das ist wichtig!
import 'rc-dock/dist/rc-dock.css';

// Deine anderen Imports...
import '../css/app.css';

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