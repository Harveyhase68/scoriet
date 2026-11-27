import { InputSwitch } from 'primereact/inputswitch';
import type { Translations } from '@/i18n/types';
import { useTheme } from '@/contexts/ThemeContext';
import type { BillingInterval } from '@/lib/plans';

interface BillingIntervalToggleProps {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  t: Translations;
  disabled?: boolean;
}

/**
 * "Monthly ◯— Yearly [Save]" switch above the subscription plans.
 * Both labels are clickable as well; the switch itself is the accessible control.
 * Server-rendered counterpart (public pages): .pub-billing-toggle in home.blade.php.
 */
export default function BillingIntervalToggle({ value, onChange, t, disabled = false }: BillingIntervalToggleProps) {
  const { colors } = useTheme();

  const labelStyle = (interval: BillingInterval) => ({
    color: value === interval ? colors.textPrimary : colors.textMuted,
    fontWeight: value === interval ? 600 : 400,
  });

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap" role="group" aria-label={t.billingToggleLabel}>
      <button type="button" className="bg-transparent border-0 cursor-pointer" style={labelStyle('month')} disabled={disabled} onClick={() => onChange('month')}>
        {t.billingMonthly}
      </button>
      <InputSwitch
        checked={value === 'year'}
        onChange={(e) => onChange(e.value ? 'year' : 'month')}
        disabled={disabled}
        aria-label={t.billingToggleLabel}
      />
      <button type="button" className="bg-transparent border-0 cursor-pointer" style={labelStyle('year')} disabled={disabled} onClick={() => onChange('year')}>
        {t.billingYearly}
      </button>
      <span
        className="rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{ backgroundColor: colors.successText, color: colors.bgPrimary }}
      >
        {t.billingYearlyHint}
      </span>
    </div>
  );
}
