import { apiClient } from '@/lib/api';

/**
 * Loads the public prices into localStorage (read by pricingUtils / PlanModal).
 *
 * Shared by both entry points: the Inertia app (app.tsx) and the public
 * marketing island (public.tsx). Data younger than 10 minutes is reused.
 */
export async function loadPricingData(): Promise<void> {
    try {
        // Check if pricing data already exists and is not too old (10 minutes)
        const storedPricing = localStorage.getItem('pricing_data');
        const storedSubscriptions = localStorage.getItem('pricing_subscriptions');
        const storedTimestamp = localStorage.getItem('pricing_timestamp');

        // A cache written before subscription prices existed is reloaded at once.
        if (storedPricing && storedSubscriptions && storedTimestamp) {
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
            localStorage.setItem('pricing_subscriptions', JSON.stringify(pricingData.subscriptions ?? null));
            localStorage.setItem('pricing_currency', pricingData.currency || 'EUR');
            localStorage.setItem('pricing_timestamp', pricingData.updated_at || new Date().toISOString());
        } else {
            clearPricingCache();
        }
    } catch {
        clearPricingCache();
    }
}

/**
 * Nothing valid to cache: drop the cache so the next page load retries, and the
 * pricing views fall back to their documented defaults (lib/plans.ts) meanwhile.
 */
function clearPricingCache(): void {
    localStorage.removeItem('pricing_data');
    localStorage.removeItem('pricing_subscriptions');
    localStorage.removeItem('pricing_currency');
    localStorage.removeItem('pricing_timestamp');
}
