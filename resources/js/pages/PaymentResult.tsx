import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';

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
          console.error('Error verifying payment:', err);
          setError('Fehler bei der Zahlungsverifizierung');
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
            setError(data.error || 'PayPal Zahlung konnte nicht abgeschlossen werden');
          }
        } catch (err) {
          console.error('PayPal capture error:', err);
          setError('Fehler bei der PayPal-Zahlung');
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
      <Head title={paymentSuccess ? 'Zahlung erfolgreich' : status === 'cancelled' ? 'Zahlung abgebrochen' : 'Zahlung wird verarbeitet'} />

      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-gray-800 border border-gray-700">
          <div className="text-center p-8">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="4" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Zahlung wird verarbeitet...
                </h1>
                <p className="text-gray-300">
                  {provider === 'paypal' ? 'PayPal-Zahlung wird abgeschlossen...' : 'Ihre Zahlung wird verifiziert...'}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Bitte warten Sie einen Moment.
                </p>
              </div>
            ) : error ? (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                  <i className="pi pi-times text-4xl text-red-400"></i>
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">
                  Zahlung fehlgeschlagen
                </h1>
                <p className="text-gray-300 mb-6">
                  {error}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    label="Zurück zur App"
                    icon="pi pi-arrow-left"
                    className="p-button-secondary"
                    onClick={goToApp}
                  />
                  <Button
                    label="Erneut versuchen"
                    icon="pi pi-refresh"
                    className="p-button-primary"
                    onClick={goToApp}
                  />
                </div>
              </>
            ) : paymentSuccess ? (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <i className={`pi ${isTemplatePurchase ? 'pi-shopping-cart' : 'pi-check'} text-4xl text-green-400`}></i>
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">
                  {isSubscription ? 'Willkommen als Patron!' : isTemplatePurchase ? 'Template gekauft!' : 'Zahlung erfolgreich!'}
                </h1>
                <p className="text-gray-300 mb-2">
                  {isSubscription
                    ? 'Vielen Dank für Ihre Patron-Mitgliedschaft!'
                    : isTemplatePurchase
                    ? 'Vielen Dank für Ihren Template-Kauf!'
                    : `Vielen Dank für Ihren Kauf über ${providerName}!`}
                </p>
                <p className="text-gray-400 mb-6">
                  {isSubscription
                    ? 'Sie haben jetzt vollen Zugriff auf alle Patron-Funktionen.'
                    : isTemplatePurchase
                    ? 'Das Template wurde Ihrem Konto hinzugefügt und ist jetzt verfügbar.'
                    : 'Ihre Credits wurden Ihrem Konto gutgeschrieben.'}
                </p>
                {paymentDetails?.customer_email && (
                  <p className="text-gray-400 text-sm mb-6">
                    Eine Bestätigung wurde an {paymentDetails.customer_email} gesendet.
                  </p>
                )}
                <Button
                  label="Zur App"
                  icon="pi pi-arrow-right"
                  className="p-button-success"
                  onClick={goToApp}
                />
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <i className="pi pi-times text-4xl text-yellow-400"></i>
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">
                  Zahlung abgebrochen
                </h1>
                <p className="text-gray-300 mb-6">
                  Die Zahlung wurde nicht abgeschlossen. Sie können es jederzeit erneut versuchen.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    label="Zurück zur App"
                    icon="pi pi-arrow-left"
                    className="p-button-secondary"
                    onClick={goToApp}
                  />
                  <Button
                    label="Erneut versuchen"
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
