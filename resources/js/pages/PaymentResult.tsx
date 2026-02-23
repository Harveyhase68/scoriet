import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

interface PaymentResultProps {
  status: 'success' | 'cancelled' | 'pending_capture';
  session_id?: string;
  provider?: 'stripe' | 'paypal';
  token?: string;
  payer_id?: string;
  type?: 'credits' | 'subscription' | 'template';
}

export default function PaymentResult({ status, session_id, provider = 'stripe', token, payer_id: _payer_id, type }: PaymentResultProps) {
  const [paymentDetails, setPaymentDetails] = useState<{
    status: string;
    customer_email?: string;
  } | null>(null);
  // Start with loading=true for all non-cancelled states to avoid "Zahlung abgebrochen" flash
  const [loading, setLoading] = useState(status !== 'cancelled');
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isSubscription, setIsSubscription] = useState(type === 'subscription');
  const [isTemplatePurchase, _setIsTemplatePurchase] = useState(type === 'template');
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();

  useEffect(() => {
    const processPayment = async () => {
      const authToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

      // PayPal Subscription success - already processed on server
      if (status === 'success' && type === 'subscription') {
        setPaymentSuccess(true);
        setIsSubscription(true);
        setLoading(false);
        // Notify other components about user status change
        window.dispatchEvent(new CustomEvent('creditsChanged'));
        window.dispatchEvent(new CustomEvent('userStatusChanged'));
        return;
      }

      if (status === 'success' && session_id && provider === 'stripe') {
        // Stripe: Verify payment status
        try {
          const response = await fetch(`/api/stripe/payment-status?session_id=${session_id}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setPaymentDetails(data);
            setPaymentSuccess(true);
            // Notify other components about credit change
            window.dispatchEvent(new CustomEvent('creditsChanged'));
          }
        } catch (err) {
          console.error(t.paymentresult65, err);
          setError(t.paymentresult66);
        } finally {
          setLoading(false);
        }
      } else if (status === 'pending_capture' && token && provider === 'paypal') {
        // PayPal: Capture the payment
        try {
          const response = await fetch('/api/paypal/capture', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
              'Accept': 'application/json',
            },
            body: JSON.stringify({ order_id: token }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            setPaymentSuccess(true);
            // Notify other components about credit change
            window.dispatchEvent(new CustomEvent('creditsChanged'));
          } else {
            setError(data.error || t.paymentresult90);
          }
        } catch (err) {
          console.error(t.paymentresult93, err);
          setError(t.paymentresult94);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    processPayment();
  }, [status, session_id, provider, token, type]);

  const goToApp = () => {
    window.location.href = '/app';
  };

  const providerName = provider === 'paypal' ? 'PayPal' : 'Stripe';

  return (
    <>
      <Head title={paymentSuccess ? t.paymentresult114 : status === 'cancelled' ? t.paymentresult114_2 : t.paymentresult114_3} />

      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.bgPrimary }}>
        <Card className="w-full max-w-lg border" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }}>
          <div className="text-center p-8">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 mx-auto mb-2 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.accent}20` }}>
                  <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="4" />
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                  {t.paymentresult125}
                </h1>
                <p style={{ color: colors.textSecondary }}>
                  {provider === 'paypal' ? t.paymentresult128 : t.paymentresult128_2}
                </p>
                <p className="text-sm mt-2" style={{ color: colors.textMuted }}>
                  {t.paymentresult131}
                </p>
              </div>
            ) : error ? (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.errorText}20` }}>
                  <i className="pi pi-times text-4xl" style={{ color: colors.errorText }}></i>
                </div>
                <h1 className="text-2xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                  {t.paymentresult140}
                </h1>
                <p className="mb-6" style={{ color: colors.textSecondary }}>
                  {error}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    label={t.paymentresult147}
                    icon="pi pi-arrow-left"
                    className="p-button-secondary"
                    onClick={goToApp}
                  />
                  <Button
                    label={t.paymentresult153}
                    icon="pi pi-refresh"
                    className="p-button-primary"
                    onClick={goToApp}
                  />
                </div>
              </>
            ) : paymentSuccess ? (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.successText}20` }}>
                  <i className={`pi ${isTemplatePurchase ? 'pi-shopping-cart' : 'pi-check'} text-4xl`} style={{ color: colors.successText }}></i>
                </div>
                <h1 className="text-2xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                  {isSubscription ? t.paymentresult166 : isTemplatePurchase ? t.paymentresult166_2 : t.paymentresult166_3}
                </h1>
                <p className="mb-2" style={{ color: colors.textSecondary }}>
                  {isSubscription
                    ? t.paymentresult170
                    : isTemplatePurchase
                    ? t.paymentresult172
                    : `${t.paymentresult173}${providerName}!`}
                </p>
                <p className="mb-6" style={{ color: colors.textMuted }}>
                  {isSubscription
                    ? t.paymentresult177
                    : isTemplatePurchase
                    ? t.paymentresult179
                    : t.paymentresult180}
                </p>
                {paymentDetails?.customer_email && (
                  <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
                    {t.paymentresult184}{paymentDetails.customer_email}{t.paymentresult184_2}
                  </p>
                )}
                <Button
                  label={t.paymentresult188}
                  icon="pi pi-arrow-right"
                  className="p-button-success"
                  onClick={goToApp}
                />
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.warningText}20` }}>
                  <i className="pi pi-times text-4xl" style={{ color: colors.warningText }}></i>
                </div>
                <h1 className="text-2xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                  {t.paymentresult200}
                </h1>
                <p className="mb-6" style={{ color: colors.textSecondary }}>
                  {t.paymentresult203}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    label={t.paymentresult207}
                    icon="pi pi-arrow-left"
                    className="p-button-secondary"
                    onClick={goToApp}
                  />
                  <Button
                    label={t.paymentresult213}
                    icon="pi pi-refresh"
                    className="p-button-primary"
                    onClick={goToApp}
                  />
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
