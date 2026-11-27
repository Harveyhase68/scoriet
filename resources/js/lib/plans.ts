/**
 * Plans, billing intervals and their prices — single source of truth on the client.
 * Server-side counterpart: App\Support\PricingCatalog.
 *
 * The plan keys are the technical identifiers used by the backend, Stripe, PayPal
 * and the database (patron_annual / patron_monthly) and must never change. They
 * name the PLAN (Team & Studio / Pro Unlimited), not the billing interval: since
 * both plans are sold monthly and yearly, the interval is a separate value.
 * The display names are product branding and identical in every language.
 *
 * Always compare plans by key, never by display name.
 */
import { pricingUtils } from '@/lib/api';

export type PlanKey = 'free' | 'patron_annual' | 'patron_monthly';
export type SubscriptionPlanKey = Exclude<PlanKey, 'free'>;
export type BillingInterval = 'month' | 'year';
export type SubscriptionPrices = Record<SubscriptionPlanKey, Record<BillingInterval, number>>;

export const PLAN_NAMES: Record<PlanKey, string> = {
  free: 'Starter / Pay-as-you-go',
  patron_annual: 'Team & Studio',
  patron_monthly: 'Pro Unlimited',
};

/** Interval preselected in every pricing view. */
export const DEFAULT_BILLING_INTERVAL: BillingInterval = 'year';

/** Used until /api/pricing has answered (same values as PricingCatalog::DEFAULT_PRICES). */
export const DEFAULT_SUBSCRIPTION_PRICES: SubscriptionPrices = {
  patron_annual: { month: 4.9, year: 34.9 },
  patron_monthly: { month: 49.9, year: 478.8 },
};

/**
 * How each plan presents its yearly price — a product decision, kept here:
 *  - yearlyAs 'year':  "34.90 /year";  'month': "39.90 /month" + "478.80 billed yearly"
 *  - savingsAs 'percent': "Save 40%";  'amount': "Save EUR 120"
 */
const YEARLY_PRESENTATION: Record<SubscriptionPlanKey, { yearlyAs: BillingInterval; savingsAs: 'percent' | 'amount' }> = {
  patron_annual: { yearlyAs: 'year', savingsAs: 'percent' },
  patron_monthly: { yearlyAs: 'month', savingsAs: 'amount' },
};

/** Display name of the plan a user is on, from user_type / patron_type of /api/user. */
export function planNameForUser(userType: string | undefined, patronType: string | null | undefined): string {
  if (userType === 'patron') {
    return patronType === 'annual' ? PLAN_NAMES.patron_annual : PLAN_NAMES.patron_monthly;
  }
  return PLAN_NAMES.free;
}

/** Subscription prices from the pricing cache (filled by loadPricingData), with defaults. */
export function getSubscriptionPrices(): SubscriptionPrices {
  const cached = pricingUtils.getSubscriptionPrices();
  if (!cached) return DEFAULT_SUBSCRIPTION_PRICES;

  const read = (plan: SubscriptionPlanKey, interval: BillingInterval): number => {
    const value = Number(cached[plan]?.[interval]);
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_SUBSCRIPTION_PRICES[plan][interval];
  };

  return {
    patron_annual: { month: read('patron_annual', 'month'), year: read('patron_annual', 'year') },
    patron_monthly: { month: read('patron_monthly', 'month'), year: read('patron_monthly', 'year') },
  };
}

export interface PlanPriceView {
  /** Main amount shown on the card. */
  amount: number;
  /** Unit of `amount`. */
  per: BillingInterval;
  /** Yearly total when `amount` is a monthly equivalent of a yearly price, otherwise null. */
  billedYearly: number | null;
  /** Saving of yearly vs. twelve monthly payments; only set for the yearly interval. */
  savings: { kind: 'percent' | 'amount'; value: number } | null;
}

/**
 * What a pricing card shows for one plan in one interval.
 * Mirrors PricingCatalog::yearlySavings(): computed in cents, percentage rounded
 * down so the page never promises more than is actually saved.
 */
export function planPriceView(prices: SubscriptionPrices, plan: SubscriptionPlanKey, interval: BillingInterval): PlanPriceView {
  const { month, year } = prices[plan];
  if (interval === 'month') {
    return { amount: month, per: 'month', billedYearly: null, savings: null };
  }

  const presentation = YEARLY_PRESENTATION[plan];
  const twelveMonthsCents = Math.round(month * 100) * 12;
  const savedCents = Math.max(0, twelveMonthsCents - Math.round(year * 100));
  const savings = savedCents === 0
    ? null
    : presentation.savingsAs === 'percent'
      ? { kind: 'percent' as const, value: Math.floor((savedCents * 100) / twelveMonthsCents) }
      : { kind: 'amount' as const, value: savedCents / 100 };

  return presentation.yearlyAs === 'month'
    ? { amount: Math.round((year * 100) / 12) / 100, per: 'month', billedYearly: year, savings }
    : { amount: year, per: 'year', billedYearly: null, savings };
}

/** "EUR 120" for whole amounts, "EUR 23.90" otherwise. */
export function formatMoney(currency: string, amount: number): string {
  return `${currency} ${Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2)}`;
}
