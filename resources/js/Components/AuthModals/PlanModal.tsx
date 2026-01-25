import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { TabView, TabPanel } from 'primereact/tabview';
import { Message } from 'primereact/message';
import { CheckIcon, HeartIcon, CurrencyEuroIcon } from '@heroicons/react/24/outline';
import { pricingUtils } from '@/lib/api';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

interface PlanModalProps {
  visible: boolean;
  onHide: () => void;
  initialTab?: number; // 0 = Subscriptions, 1 = Buy Credits
}

export default function PlanModal({ visible, onHide, initialTab = 0 }: PlanModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();
  const [activeTabIndex, setActiveTabIndex] = useState(initialTab);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
    }
  }, [visible, initialTab]);

  // Helper to check if user is on a specific plan
  const isCurrentPlan = (planName: string): boolean => {
    if (planName === 'Free') {
      return userStatus.user_type === 'free';
    }
    if (planName === 'Patron Annual') {
      return userStatus.user_type === 'patron' && userStatus.patron_type === 'annual';
    }
    if (planName === 'Patron Monthly') {
      return userStatus.user_type === 'patron' && userStatus.patron_type === 'monthly';
    }
    return false;
  };

  // Get display name for current plan
  const getCurrentPlanName = (): string => {
    if (userStatus.user_type === 'patron') {
      return userStatus.patron_type === 'annual' ? 'Patron Annual' : 'Patron Monthly';
    }
    return 'Free';
  };

  // Handle Stripe checkout for credits
  const handleBuyCredits = async (packageName: string) => {
    setLoading(packageName);
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError('Bitte melden Sie sich an um Credits zu kaufen.');
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
        throw new Error(data.error || 'Fehler beim Erstellen der Checkout-Session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Stripe checkout error:', err);
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(null);
    }
  };

  // Handle Stripe checkout for Patron subscription
  const handlePatronUpgrade = async (planType: 'patron_monthly' | 'patron_annual') => {
    setLoading(planType);
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError('Bitte melden Sie sich an um zu upgraden.');
        return;
      }

      const response = await fetch('/api/stripe/checkout/patron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ plan: planType }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Fehler beim Erstellen der Checkout-Session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Stripe patron checkout error:', err);
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
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
        setError('Bitte melden Sie sich an um Credits zu kaufen.');
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
        throw new Error(data.error || 'Fehler beim Erstellen der PayPal-Bestellung');
      }

      // Redirect to PayPal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('PayPal checkout error:', err);
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(null);
    }
  };

  // Handle PayPal checkout for Patron subscription
  const handlePayPalPatron = async (planType: 'patron_monthly' | 'patron_annual') => {
    setLoading(`paypal_${planType}`);
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError('Bitte melden Sie sich an um zu upgraden.');
        return;
      }

      const response = await fetch('/api/paypal/order/patron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ plan: planType }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Fehler beim Erstellen der PayPal-Bestellung');
      }

      // Redirect to PayPal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('PayPal patron checkout error:', err);
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(null);
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will remain a Patron until the end of your current billing period.')) {
      return;
    }

    setLoading('cancel');
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError('Bitte melden Sie sich an.');
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
        throw new Error(data.error || 'Fehler beim Kündigen des Abonnements');
      }

      // Show success message
      alert('Your subscription has been cancelled. You will remain a Patron until the end of your current billing period.');

      // Reload user status
      window.location.reload();
    } catch (err) {
      console.error('Cancel subscription error:', err);
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
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
        patron_annual: 34.90,
        patron_monthly: 49.90,
        credits_500: 9.90,
        credits_1000: 17.90,
        credits_2500: 29.90,
        currency: t.app48
      };
    }

    return {
      patron_annual: prices.patron_annual || 34.90,
      patron_monthly: prices.patron_monthly || 49.90,
      credits_500: prices.credits_500 || 9.90,
      credits_1000: prices.credits_1000 || 17.90,
      credits_2500: prices.credits_2500 || 29.90,
      currency: currency
    };
  };

  // Get pricing data
  const pricingData = getPricingData();
  
  const pricingTiers = [
    {
      name: "Free",
      price: `${pricingData.currency} 0`,
      period: "forever",
      description: "Perfect for trying out Scoriet",
      features: [
        "50 credits to start (10 generations)",
        "1 project included",
        "1 database included",
        "Public templates only",
        "Community support"
      ],
      buttonText: "Current Plan",
      buttonClass: "p-button-secondary",
      popular: false
    },
    {
      name: "Patron Annual",
      price: `${pricingData.currency} ${pricingData.patron_annual.toFixed(2)}`,
      period: "/year",
      description: "Best value for committed developers",
      features: [
        "Teams unlocked",
        "Private templates enabled",
        "Uses credits for generation (5 credits/gen)",
        "Buy credits as needed",
        "Priority support (5 tickets/month included)"
      ],
      buttonText: "Upgrade to Annual",
      buttonClass: "p-button-primary",
      popular: true
    },
    {
      name: "Patron Monthly",
      price: `${pricingData.currency} ${pricingData.patron_monthly.toFixed(2)}`,
      period: "/month",
      description: "Ultimate flexibility with unlimited access",
      features: [
        "Everything unlimited",
        "No credits needed for generation",
        "Unlimited private projects",
        "Unlimited databases",
        "Teams unlocked",
        "Priority support (5 tickets/month included)"
      ],
      buttonText: "Upgrade to Monthly",
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
      style={{ width: '95vw', maxWidth: '1400px' }}
      contentStyle={{ padding: '20px', backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
      headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary, border: 'none' }}
      className="plan-modal"
    >
      {/* Error Message */}
      {error && (
        <Message severity="error" text={error} className="w-full mb-4" />
      )}

      {/* Current Plan Status */}
      <div
        className="p-4 rounded-lg border-l-4 mb-4"
        style={{
          backgroundColor: colors.bgSecondary,
          borderLeftColor: userStatus.user_type === 'patron' ? colors.successText : colors.accent
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Current Plan</h3>
          <Badge
            value={getCurrentPlanName()}
            severity={userStatus.user_type === 'patron' ? 'success' : 'info'}
          />
        </div>
        <p style={{ color: colors.textSecondary }}>
          {userStatus.user_type === 'patron' ? (
            <>You're currently on the <strong style={{ color: colors.successText }}>{getCurrentPlanName()}</strong> plan. Thank you for being a Patron!</>
          ) : (
            <>You're currently on the <strong style={{ color: colors.accent }}>Free plan</strong>. Upgrade to unlock more features or buy credits on demand!</>
          )}
        </p>
      </div>

      {/* Tab View */}
      <TabView
        activeIndex={activeTabIndex}
        onTabChange={(e) => setActiveTabIndex(e.index)}
      >
        {/* Subscriptions Tab */}
        <TabPanel header="💎 Subscriptions" leftIcon="pi pi-star">
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Subscribe for unlimited access or credit-based usage with teams
              </p>
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
                      {(plan.name === "Patron Annual" || plan.name === "Patron Monthly") && <HeartIcon className="w-6 h-6 text-red-500 ml-2" />}
                    </h3>
                    <div className="text-3xl font-bold mb-2" style={{ color: colors.accent }}>
                      {plan.price}
                      {plan.name === "Patron Monthly" && plan.price !== '€0' && plan.price !== t.planmodal151 && (
                        <span className="text-lg" style={{ color: colors.textMuted }}>/Monthly</span>
                      )}
                      {plan.name === "Patron Annual" && plan.price !== '€0' && plan.price !== t.planmodal151 && (
                        <span className="text-lg" style={{ color: colors.textMuted }}>/Annually</span>
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

                    {plan.name === "Free" && userStatus.user_type === 'free' ? (
                      /* User is free, Free is current plan */
                      <Button
                        label="Current Plan"
                        className="p-button-secondary w-full"
                        style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                        disabled={true}
                        icon="pi pi-check"
                      />
                    ) : plan.name === "Free" && userStatus.user_type === 'patron' ? (
                      /* User is patron, Free plan is not selectable */
                      <Button
                        label="Cancel subscription to downgrade"
                        className="p-button-secondary w-full"
                        style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px', fontSize: '0.85rem' }}
                        disabled={true}
                      />
                    ) : isCurrentPlan(plan.name) ? (
                      /* Current patron plan - show cancel button */
                      <Button
                        label={loading === 'cancel' ? 'Wird gekündigt...' : 'Cancel Subscription'}
                        className="p-button-danger w-full"
                        style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                        icon={loading === 'cancel' ? 'pi pi-spinner pi-spin' : 'pi pi-times'}
                        disabled={loading !== null}
                        onClick={handleCancelSubscription}
                      />
                    ) : userStatus.user_type === 'patron' ? (
                      /* User is patron but on different plan - disabled */
                      <Button
                        label="Cancel current subscription first"
                        className="p-button-secondary w-full"
                        style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px', fontSize: '0.85rem' }}
                        disabled={true}
                      />
                    ) : (
                      /* User is free - show upgrade buttons */
                      <div className="flex flex-col gap-2">
                        <Button
                          label={loading === (plan.name === "Patron Annual" ? 'patron_annual' : 'patron_monthly') ? 'Wird geladen...' : `${plan.buttonText} (Stripe)`}
                          icon={loading === (plan.name === "Patron Annual" ? 'patron_annual' : 'patron_monthly') ? 'pi pi-spinner pi-spin' : 'pi pi-credit-card'}
                          className={`${plan.buttonClass} w-full`}
                          style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                          disabled={loading !== null}
                          onClick={() => {
                            if (plan.name === "Patron Annual") {
                              handlePatronUpgrade('patron_annual');
                            } else if (plan.name === "Patron Monthly") {
                              handlePatronUpgrade('patron_monthly');
                            }
                          }}
                        />
                        <Button
                          label={loading === `paypal_${plan.name === "Patron Annual" ? 'patron_annual' : 'patron_monthly'}` ? 'Wird geladen...' : 'PayPal'}
                          icon={loading === `paypal_${plan.name === "Patron Annual" ? 'patron_annual' : 'patron_monthly'}` ? 'pi pi-spinner pi-spin' : 'pi pi-paypal'}
                          className="p-button-outlined w-full"
                          style={{ borderRadius: '8px', paddingTop: '8px', paddingBottom: '8px', backgroundColor: '#ffc439', borderColor: '#ffc439', color: '#003087' }}
                          disabled={loading !== null}
                          onClick={() => {
                            if (plan.name === "Patron Annual") {
                              handlePayPalPatron('patron_annual');
                            } else if (plan.name === "Patron Monthly") {
                              handlePayPalPatron('patron_monthly');
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
              <p>You can change or cancel your plan at any time. All plans include a 30-day money-back guarantee.</p>
            </div>
          </div>
        </TabPanel>

        {/* Buy Credits Tab */}
        <TabPanel header="💳 Buy Credits" leftIcon="pi pi-wallet">
          <div className="space-y-4">
            <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderSecondary}` }}>
              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                <strong style={{ color: colors.accent }}>Pay as you go!</strong> Stay on the Free plan and buy credits when you need them.
              </p>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                Each code generation costs 5 credits. Credits never expire.
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
                      <Badge value="Most Popular" severity="info" className="mb-4" />
                    )}
                    {pkg.bestValue && (
                      <Badge value="💎 Best Value" severity="success" className="mb-4" />
                    )}

                    <div className="mb-4">
                      <CurrencyEuroIcon className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                      <h3 className="text-3xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                        {pkg.credits}
                      </h3>
                      <p className="text-sm" style={{ color: colors.textMuted }}>Credits</p>
                    </div>

                    <div className="text-4xl font-bold mb-2" style={{ color: colors.accent }}>
                      €{pkg.price.toFixed(2)}
                    </div>

                    <div className="rounded p-3 mb-6" style={{ backgroundColor: colors.bgSecondary }}>
                      <p className="text-xs" style={{ color: colors.textMuted }}>Price per credit</p>
                      <p className="text-lg font-semibold" style={{ color: colors.successText }}>
                        €{pkg.pricePerCredit}
                      </p>
                    </div>

                    <div className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                      <p>≈ {Math.floor(pkg.credits / 5)} code generations</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        label={loading === pkg.packageKey ? 'Wird geladen...' : 'Stripe'}
                        icon={loading === pkg.packageKey ? 'pi pi-spinner pi-spin' : 'pi pi-credit-card'}
                        className={pkg.bestValue ? 'p-button-success w-full' : pkg.popular ? 'p-button-primary w-full' : 'p-button-outlined w-full'}
                        style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                        disabled={loading !== null}
                        onClick={() => handleBuyCredits(pkg.packageKey)}
                      />
                      <Button
                        label={loading === `paypal_${pkg.packageKey}` ? 'Wird geladen...' : 'PayPal'}
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
              <p>💡 Credits are added to your account immediately and never expire.</p>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </Dialog>
  );
}