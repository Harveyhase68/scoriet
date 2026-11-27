import type { Translations } from '@/i18n/types';
import { useTheme } from '@/contexts/ThemeContext';
import { formatMoney, planPriceView } from '@/lib/plans';
import type { BillingInterval, SubscriptionPlanKey, SubscriptionPrices } from '@/lib/plans';

interface PlanPriceProps {
  plan: SubscriptionPlanKey;
  interval: BillingInterval;
  prices: SubscriptionPrices;
  currency: string;
  t: Translations;
  /** Tailwind classes of the main amount (the cards differ in size and color). */
  amountClassName?: string;
  amountColor?: string;
}

/**
 * Price block of one subscription card: amount + unit, "billed yearly" total
 * and the yearly saving. Logic lives in planPriceView() (lib/plans.ts).
 * Server-rendered counterpart (public pages): the pricing cards in home.blade.php.
 */
export default function PlanPrice({ plan, interval, prices, currency, t, amountClassName = 'text-4xl font-bold', amountColor }: PlanPriceProps) {
  const { colors } = useTheme();
  const view = planPriceView(prices, plan, interval);

  const savingsText = view.savings === null
    ? null
    : view.savings.kind === 'percent'
      ? t.billingSavePercent.replace('{value}', String(view.savings.value))
      : t.billingSaveAmount.replace('{value}', formatMoney(currency, view.savings.value));

  return (
    <div>
      <span className={amountClassName} style={{ color: amountColor ?? colors.textPrimary }}>
        {currency} {view.amount.toFixed(2)}
      </span>
      <span className="ml-1" style={{ color: colors.textMuted }}>
        {view.per === 'year' ? t.billingPerYear : t.billingPerMonth}
      </span>
      {view.billedYearly !== null && (
        <div className="text-sm mt-1" style={{ color: colors.textMuted }}>
          {t.billingBilledYearly.replace('{amount}', `${currency} ${view.billedYearly.toFixed(2)}`)}
        </div>
      )}
      {savingsText !== null && (
        <div className="text-sm mt-1 font-semibold" style={{ color: colors.successText }}>
          {savingsText}
        </div>
      )}
    </div>
  );
}
