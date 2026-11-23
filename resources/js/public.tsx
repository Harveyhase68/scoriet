/**
 * Entry point of the public marketing pages (resources/views/public/*.blade.php).
 *
 * The pages are complete server-rendered HTML; this script only mounts the
 * PublicIsland (modals + click handling) into #public-island. It deliberately
 * does NOT use Inertia: the public pages must not depend on client rendering
 * to show their content.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts';
import './Components/Panels/styles.css'; // Global panel theming used inside the plan / profile modals
import './i18n'; // Initialize i18n
import { ThemeProvider } from '@/contexts/ThemeContext';
import { loadPricingData } from '@/lib/pricingBootstrap';
import PublicIsland, { PublicPageContext } from '@/Components/Public/PublicIsland';

function readContext(): PublicPageContext | null {
    const element = document.getElementById('public-page-context');
    if (!element?.textContent) {
        return null;
    }
    try {
        return JSON.parse(element.textContent) as PublicPageContext;
    } catch (error) {
        console.error('Invalid public page context:', error);
        return null;
    }
}

const mountPoint = document.getElementById('public-island');
const context = readContext();

if (mountPoint && context) {
    loadPricingData();

    createRoot(mountPoint).render(
        <ThemeProvider>
            <PublicIsland context={context} />
        </ThemeProvider>
    );
}
