import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { TabPanel } from 'primereact/tabview';
import TabViewSideMenu from '@/Components/TabViewSideMenu';
import { Message } from 'primereact/message';
import { CheckIcon, HeartIcon, CurrencyEuroIcon } from '@heroicons/react/24/outline';
import { pricingUtils } from '@/lib/api';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';
import { PLAN_NAMES, PlanKey, planNameForUser, DEFAULT_BILLING_INTERVAL, getSubscriptionPrices } from '@/lib/plans';
import type { BillingInterval, SubscriptionPlanKey } from '@/lib/plans';
import BillingIntervalToggle from '@/Components/Pricing/BillingIntervalToggle';
import PlanPrice from '@/Components/Pricing/PlanPrice';

interface PlanModalProps {
  visible: boolean;
  onHide: () => void;
  initialTab?: number; // 0 = Subscriptions, 1 = Buy Credits
  /** Interval preselected when the dialog opens (e.g. the one chosen on the public pricing section). */
  initialInterval?: BillingInterval;
}

export default function PlanModal({ visible, onHide, initialTab = 0, initialInterval = DEFAULT_BILLING_INTERVAL }: PlanModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();
  const [activeTabIndex, setActiveTabIndex] = useState(initialTab);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(initialInterval);
  const [userStatus, setUserStatus] = useState<{
    user_type: string;
    patron_type: string | null;
  }>({ user_type: 'free', patron_type: null });

  // Load user status when modal opens
  React.useEffect(() => {
    const loadUserStatus = async () => {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      try {
        const response = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUserStatus({
            user_type: userData.user_type || 'free',
            patron_type: userData.patron_type || null,
          });
        }
      } catch (err) {
        console.error('Error loading user status:', err);
      }
    };

    if (visible) {
      loadUserStatus();
      setActiveTabIndex(initialTab);
      setBillingInterval(initialInterval);
      setError(null);
    }
  }, [visible, initialTab, initialInterval]);

  // Helper to check if user is on a specific plan (compared by key, never by display name)
  const isCurrentPlan = (plan: PlanKey): boolean => {
    if (plan === 'free') {
      return userStatus.user_type === 'free';
    }
    if (plan === 'patron_annual') {
      return userStatus.user_type === 'patron' && userStatus.patron_type === 'annual';
    }
    if (plan === 'patron_monthly') {
      return userStatus.user_type === 'patron' && userStatus.patron_type === 'monthly';
    }
    return false;
  };

  // Get display name for current plan
  const getCurrentPlanName = (): string => planNameForUser(userStatus.user_type, userStatus.patron_type);

  // Handle Stripe checkout for credits
  const handleBuyCredits = async (packageName: string) => {
    setLoading(packageName);
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError(t.planmodal95);
        return;
      }

      const response = await fetch('/api/stripe/checkout/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ package: packageName }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t.planmodal112);
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Stripe checkout error:', err);
      setError(err instanceof Error ? err.message : t.planmodal121);
    } finally {
      setLoading(null);
    }
  };

  // Handle Stripe checkout for Patron subscription
  const handlePatronUpgrade = async (planType: SubscriptionPlanKey) => {
    setLoading(planType);
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError(t.planmodal135);
        return;
      }

      const response = await fetch('/api/stripe/checkout/patron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ plan: planType, interval: billingInterval }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t.planmodal152);
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(t.planmodal160, err);
      setError(err instanceof Error ? err.message : t.planmodal161);
    } finally {
      setLoading(null);
    }
  };

  // Handle PayPal checkout for credits
  const handlePayPalCredits = async (packageName: string) => {
    setLoading(`paypal_${packageName}`);
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError(t.planmodal175);
        return;
      }

      const response = await fetch('/api/paypal/order/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ package: packageName }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t.planmodal192);
      }

      // Redirect to PayPal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('PayPal checkout error:', err);
      setError(err instanceof Error ? err.message : t.planmodal201);
    } finally {
      setLoading(null);
    }
  };

  // Handle PayPal checkout for Patron subscription
  const handlePayPalPatron = async (planType: SubscriptionPlanKey) => {
    setLoading(`paypal_${planType}`);
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError(t.planmodal215);
        return;
      }

      const response = await fetch('/api/paypal/order/patron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ plan: planType, interval: billingInterval }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t.planmodal232);
      }

      // Redirect to PayPal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(t.planmodal240, err);
      setError(err instanceof Error ? err.message : t.planmodal241);
    } finally {
      setLoading(null);
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!window.confirm(t.planmodal249)) {
      return;
    }

    setLoading('cancel');
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError(t.planmodal259);
        return;
      }

      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t.planmodal275);
      }

      // Show success message
      alert(t.planmodal279);

      // Reload user status
      window.location.reload();
    } catch (err) {
      console.error(t.planmodal284, err);
      setError(err instanceof Error ? err.message : t.planmodal285);
    } finally {
      setLoading(null);
    }
  };

  // Get pricing data from localStorage
  const getPricingData = () => {
    const prices = pricingUtils.getPricingData();
    const currency = pricingUtils.getCurrency();

    // Fallback to defaults if no pricing data available
    if (!prices) {
      return {
        credits_500: 9.90,
        credits_1000: 17.90,
        credits_2500: 29.90,
        currency: t.app48
      };
    }

    return {
      credits_500: prices.credits_500 || 9.90,
      credits_1000: prices.credits_1000 || 17.90,
      credits_2500: prices.credits_2500 || 29.90,
      currency: currency
    };
  };

  // Get pricing data
  const pricingData = getPricingData();
  const subscriptionPrices = getSubscriptionPrices();

  const pricingTiers: Array<{
    plan: PlanKey;
    name: string;
    description: string;
    features: string[];
    buttonText: string;
    buttonClass: string;
    popular: boolean;
  }> = [
    {
      plan: 'free',
      name: PLAN_NAMES.free,
      description: t.planmodal326,
      features: [
        t.planmodal328,
        t.planmodal329,
        t.planmodal330,
        t.planmodal331,
        t.planmodal332
      ],
      buttonText: t.planmodal334,
      buttonClass: "p-button-secondary",
      popular: false
    },
    {
      plan: 'patron_annual',
      name: PLAN_NAMES.patron_annual,
      description: t.planmodal342,
      features: [
        t.planmodal344,
        t.planmodal345,
        t.planmodal346,
        t.planmodal347,
        t.planmodal348
      ],
      buttonText: t.planmodal350,
      buttonClass: "p-button-primary",
      popular: true
    },
    {
      plan: 'patron_monthly',
      name: PLAN_NAMES.patron_monthly,
      description: t.planmodal358,
      features: [
        t.planmodal360,
        t.planmodal361,
        t.planmodal362,
        t.planmodal363,
        t.planmodal364,
        t.planmodal365
      ],
      buttonText: t.planmodal367,
      buttonClass: "p-button-help",
      popular: false
    }
  ];

  const creditPackages = [
    {
      credits: 500,
      price: pricingData.credits_500,
      pricePerCredit: (pricingData.credits_500 / 500).toFixed(4),
      popular: false,
      bestValue: false,
      packageKey: 'credits_500'
    },
    {
      credits: 1000,
      price: pricingData.credits_1000,
      pricePerCredit: (pricingData.credits_1000 / 1000).toFixed(4),
      popular: true,
      bestValue: false,
      packageKey: 'credits_1000'
    },
    {
      credits: 2500,
      price: pricingData.credits_2500,
      pricePerCredit: (pricingData.credits_2500 / 2500).toFixed(4),
      popular: false,
      bestValue: true,
      packageKey: 'credits_2500'
    }
  ];

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      header={t.planmodal116}
      /* Fixed height (85vh) so the inner flex column has a real container
       * to distribute — Error + Current Plan banner take their natural
       * height, TabViewSideMenu absorbs the remainder. */
      style={{ width: '95vw', maxWidth: '1400px', height: '85vh' }}
      contentStyle={{ padding: '0' }}
      className="p-dialog-custom plan-modal"
    >
      <div className="h-full flex flex-col">
        {/* Error Message + Current Plan banner sit in a shared "top" band
         * with flex-shrink-0, so the TabView below gets the remaining
         * vertical space cleanly. */}
        <div className="p-5 pb-2 flex-shrink-0">
          {error && (
            <Message severity="error" text={error} className="w-full mb-4" />
          )}

          {/* Current Plan Status */}
          <div
            className="p-4 rounded-lg border-l-4"
            style={{
              backgroundColor: colors.bgSecondary,
              borderLeftColor: userStatus.user_type === 'patron' ? colors.successText : colors.accent
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{t.currentPlan}</h3>
              <Badge
                value={getCurrentPlanName()}
                severity={userStatus.user_type === 'patron' ? 'success' : 'info'}
              />
            </div>
            <p style={{ color: colors.textSecondary }}>
              {userStatus.user_type === 'patron' ? (
                <>{t.planmodal433} <strong style={{ color: colors.successText }}>{getCurrentPlanName()}</strong> {t.planmodal433_2}</>
              ) : (
                <>{t.planmodal435} <strong style={{ color: colors.accent }}>{t.freeLabel}</strong> {t.planmodal435_2}</>
              )}
            </p>
          </div>
        </div>

        {/* TabViewSideMenu region */}
        <div className="flex-1 min-h-0">
      <TabViewSideMenu
        storageKey="planModal"
        defaultWidth={200}
        activeIndex={activeTabIndex}
        onTabChange={(e) => setActiveTabIndex(e.index)}
      >
        {/* Subscriptions Tab */}
        <TabPanel header={<span><i className="pi pi-star mr-2" />{t.planmodal446}</span>}>
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {t.planmodal450}
              </p>
            </div>

            <div className="mb-6">
              <BillingIntervalToggle value={billingInterval} onChange={setBillingInterval} t={t} disabled={loading !== null} />
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {pricingTiers.map((plan, index) => (
                <Card
                  key={index}
                  className="text-center hover:shadow-xl transition-shadow"
                  style={{
                    backgroundColor: colors.bgTertiary,
                    border: plan.popular ? `2px solid ${colors.accent}` : `1px solid ${colors.borderSecondary}`
                  }}
                >
                  <div className="p-6">
                    {plan.popular && (
                      <Badge value={t.planmodal143} severity="info" className="mb-4" />
                    )}
                    <h3 className="text-2xl font-bold mb-2 flex items-center justify-center" style={{ color: colors.textPrimary }}>
                      {plan.name}
                      {plan.plan !== 'free' && <HeartIcon className="w-6 h-6 text-red-500 ml-2" />}
                    </h3>
                    <div className="mb-4">
                      {plan.plan === 'free' ? (
                        <span className="text-3xl font-bold" style={{ color: colors.accent }}>{pricingData.currency} 0</span>
                      ) : (
                        <PlanPrice
                          plan={plan.plan}
                          interval={billingInterval}
                          prices={subscriptionPrices}
                          currency={pricingData.currency}
                          t={t}
                          amountClassName="text-3xl font-bold"
                          amountColor={colors.accent}
                        />
                      )}
                    </div>
                    <p className="mb-6" style={{ color: colors.textSecondary }}>{plan.description}</p>

                    <ul className="text-left mb-8 space-y-2" style={{ color: colors.textSecondary }}>
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center">
                          <CheckIcon className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: colors.successText }} />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {plan.plan === 'free' && userStatus.user_type === 'free' ? (
                      /* User is free, Free is current plan */
                      <Button
                        label={t.planmodal496}
                        className="p-button-secondary w-full"
                        style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                        disabled={true}
                        icon="pi pi-check"
                      />
                    ) : plan.plan === 'free' && userStatus.user_type === 'patron' ? (
                      /* User is patron, Free plan is not selectable */
                      <Button
                        label={t.planmodal505}
                        className="p-button-secondary w-full"
                        style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px', fontSize: '0.85rem' }}
                        disabled={true}
                      />
                    ) : isCurrentPlan(plan.plan) ? (
                      /* Current patron plan - show cancel button */
                      <Button
                        label={loading === 'cancel' ? (t.planmodal513) : (t.planmodal513_2)}
                        className="p-button-danger w-full"
                        style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                        icon={loading === 'cancel' ? 'pi pi-spinner pi-spin' : 'pi pi-times'}
                        disabled={loading !== null}
                        onClick={handleCancelSubscription}
                      />
                    ) : userStatus.user_type === 'patron' ? (
                      /* User is patron but on different plan - disabled */
                      <Button
                        label={t.planmodal523}
                        className="p-button-secondary w-full"
                        style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px', fontSize: '0.85rem' }}
                        disabled={true}
                      />
                    ) : (
                      /* User is free - show upgrade buttons */
                      <div className="flex flex-col gap-2">
                        <Button
                          label={loading === plan.plan ? (t.planmodal546) : `${plan.buttonText} (Stripe)`}
                          icon={loading === plan.plan ? 'pi pi-spinner pi-spin' : 'pi pi-credit-card'}
                          className={`${plan.buttonClass} w-full`}
                          style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                          disabled={loading !== null}
                          onClick={() => {
                            if (plan.plan !== 'free') {
                              handlePatronUpgrade(plan.plan);
                            }
                          }}
                        />
                        <Button
                          label={loading === `paypal_${plan.plan}` ? (t.planmodal546) : 'PayPal'}
                          icon={loading === `paypal_${plan.plan}` ? 'pi pi-spinner pi-spin' : 'pi pi-paypal'}
                          className="p-button-outlined w-full"
                          style={{ borderRadius: '8px', paddingTop: '8px', paddingBottom: '8px', backgroundColor: '#ffc439', borderColor: '#ffc439', color: '#003087' }}
                          disabled={loading !== null}
                          onClick={() => {
                            if (plan.plan !== 'free') {
                              handlePayPalPatron(plan.plan);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Footer Note */}
            <div className="text-center text-sm mt-6" style={{ color: colors.textMuted }}>
              <p>{t.planmodal568}</p>
            </div>
          </div>
        </TabPanel>

        {/* Buy Credits Tab */}
        <TabPanel header={<span><i className="pi pi-wallet mr-2" />{t.planmodal574}</span>}>
          <div className="space-y-4">
            <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderSecondary}` }}>
              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                <strong style={{ color: colors.accent }}>{t.planmodal578}</strong> {t.planmodal578_2}
              </p>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                {t.planmodal581}
              </p>
            </div>

            {/* Credit Packages Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {creditPackages.map((pkg, index) => (
                <Card
                  key={index}
                  className="text-center hover:shadow-xl transition-shadow"
                  style={{
                    backgroundColor: colors.bgTertiary,
                    border: pkg.popular ? `2px solid ${colors.accent}` : pkg.bestValue ? `2px solid ${colors.successText}` : `1px solid ${colors.borderSecondary}`
                  }}
                >
                  <div className="p-6">
                    {pkg.popular && (
                      <Badge value={t.planmodal598} severity="info" className="mb-4" />
                    )}
                    {pkg.bestValue && (
                      <Badge value={t.planmodal601} severity="success" className="mb-4" />
                    )}

                    <div className="mb-4">
                      <CurrencyEuroIcon className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                      <h3 className="text-3xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                        {pkg.credits}
                      </h3>
                      <p className="text-sm" style={{ color: colors.textMuted }}>{t.planmodal609}</p>
                    </div>

                    <div className="text-4xl font-bold mb-2" style={{ color: colors.accent }}>
                      €{pkg.price.toFixed(2)}
                    </div>

                    <div className="rounded p-3 mb-6" style={{ backgroundColor: colors.bgSecondary }}>
                      <p className="text-xs" style={{ color: colors.textMuted }}>{t.planmodal617}</p>
                      <p className="text-lg font-semibold" style={{ color: colors.successText }}>
                        €{pkg.pricePerCredit}
                      </p>
                    </div>

                    <div className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                      <p>≈ {Math.floor(pkg.credits / 5)} {t.planmodal624}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        label={loading === pkg.packageKey ? (t.planmodal629) : 'Stripe'}
                        icon={loading === pkg.packageKey ? 'pi pi-spinner pi-spin' : 'pi pi-credit-card'}
                        className={pkg.bestValue ? 'p-button-success w-full' : pkg.popular ? 'p-button-primary w-full' : 'p-button-outlined w-full'}
                        style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                        disabled={loading !== null}
                        onClick={() => handleBuyCredits(pkg.packageKey)}
                      />
                      <Button
                        label={loading === `paypal_${pkg.packageKey}` ? (t.planmodal637) : 'PayPal'}
                        icon={loading === `paypal_${pkg.packageKey}` ? 'pi pi-spinner pi-spin' : 'pi pi-paypal'}
                        className="p-button-outlined w-full"
                        style={{ borderRadius: '8px', paddingTop: '8px', paddingBottom: '8px', backgroundColor: '#ffc439', borderColor: '#ffc439', color: '#003087' }}
                        disabled={loading !== null}
                        onClick={() => handlePayPalCredits(pkg.packageKey)}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Info Note */}
            <div className="text-center text-sm mt-6" style={{ color: colors.textMuted }}>
              <p>{t.planmodal652}</p>
            </div>
          </div>
        </TabPanel>
      </TabViewSideMenu>
        </div>
      </div>
    </Dialog>
  );
}