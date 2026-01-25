import React from 'react';
import '../css/app.css';
import './styles/fonts';
import './Components/Panels/styles.css'; // Global panel theming (DataTables, Splitters, etc.)

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import './i18n'; // Initialize i18n
import { ProjectProvider } from '@/contexts/ProjectContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { apiClient } from '@/lib/api';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Load pricing data on app startup
async function loadPricingData() {
    try {
        // Check if pricing data already exists and is not too old (10 minutes)
        const storedPricing = localStorage.getItem('pricing_data');
        const storedTimestamp = localStorage.getItem('pricing_timestamp');

        if (storedPricing && storedTimestamp) {
            const timestamp = new Date(storedTimestamp);
            const now = new Date();
            const minutesDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60);

            // If data is less than 10 minutes old, use it
            if (minutesDiff < 10) {
                return;
            }
        }
        
        // Fetch fresh pricing data
        const pricingData = await apiClient.getPricing();
        
        if (pricingData.success) {
            // Store pricing data in localStorage
            localStorage.setItem('pricing_data', JSON.stringify(pricingData.prices));
            localStorage.setItem('pricing_currency', pricingData.currency || t.app48);
            localStorage.setItem('pricing_timestamp', pricingData.updated_at || new Date().toISOString());
        } else {
            // Set fallback prices
            const fallbackPrices = {
                premium: 9.99,
                business: 29.99,
                patron: 99.99
            };
            localStorage.setItem('pricing_data', JSON.stringify(fallbackPrices));
            localStorage.setItem('pricing_currency', t.app48);
            localStorage.setItem('pricing_timestamp', new Date().toISOString());
        }
    } catch {
        // Set fallback prices on error
        const fallbackPrices = {
            premium: 9.99,
            business: 29.99,
            patron: 99.99
        };
        localStorage.setItem('pricing_data', JSON.stringify(fallbackPrices));
        localStorage.setItem('pricing_currency', t.app48);
        localStorage.setItem('pricing_timestamp', new Date().toISOString());
    }
}

// Initialize pricing data before app starts
loadPricingData();

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
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
