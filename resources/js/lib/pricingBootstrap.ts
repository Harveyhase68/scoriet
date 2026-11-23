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
            localStorage.setItem('pricing_currency', pricingData.currency || 'EUR');
            localStorage.setItem('pricing_timestamp', pricingData.updated_at || new Date().toISOString());
        } else {
            storeFallbackPrices();
        }
    } catch {
        storeFallbackPrices();
    }
}

function storeFallbackPrices(): void {
    const fallbackPrices = {
        premium: 9.99,
        business: 29.99,
        patron: 99.99,
    };
    localStorage.setItem('pricing_data', JSON.stringify(fallbackPrices));
    localStorage.setItem('pricing_currency', 'EUR');
    localStorage.setItem('pricing_timestamp', new Date().toISOString());
}
