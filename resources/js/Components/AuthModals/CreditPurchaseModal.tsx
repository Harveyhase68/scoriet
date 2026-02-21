import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { CurrencyEuroIcon } from '@heroicons/react/24/outline';
import { pricingUtils } from '@/lib/api';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface CreditPurchaseModalProps {
  visible: boolean;
  onHide: () => void;
  currentCredits?: number;
}

export default function CreditPurchaseModal({ visible, onHide, currentCredits = 0 }: CreditPurchaseModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  // Get pricing data from localStorage
  const getPricingData = () => {
    const prices = pricingUtils.getPricingData();

    // Fallback to defaults if no pricing data available
    if (!prices) {
      return {
        credits_500: 9.90,
        credits_1000: 17.90,
        credits_2500: 29.90
      };
    }

    return {
      credits_500: prices.credits_500 || 9.90,
      credits_1000: prices.credits_1000 || 17.90,
      credits_2500: prices.credits_2500 || 29.90
    };
  };

  const pricingData = getPricingData();

  const creditPackages = [
    {
      credits: 500,
      price: pricingData.credits_500,
      pricePerCredit: (pricingData.credits_500 / 500).toFixed(4),
      popular: false,
      bestValue: false
    },
    {
      credits: 1000,
      price: pricingData.credits_1000,
      pricePerCredit: (pricingData.credits_1000 / 1000).toFixed(4),
      popular: true,
      bestValue: false
    },
    {
      credits: 2500,
      price: pricingData.credits_2500,
      pricePerCredit: (pricingData.credits_2500 / 2500).toFixed(4),
      popular: false,
      bestValue: true
    }
  ];

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      header={t.creditpurchasemodal72}
      style={{ width: '90vw', maxWidth: '1200px' }}
      contentStyle={{ padding: '20px', backgroundColor: '#111827', color: 'white' }}
      headerStyle={{ backgroundColor: '#1f2937', color: 'white', border: 'none' }}
      className="credit-purchase-modal"
    >
      <div className="space-y-6">
        {/* Current Balance */}
        <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-l-yellow-400">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">{t.creditpurchasemodal83}</h3>
              <p className="text-3xl font-bold text-yellow-400">{currentCredits}{t.creditpurchasemodal84}</p>
            </div>
            <div className="text-sm text-gray-400">
              <p>≈ {Math.floor(currentCredits / 5)}{t.creditpurchasemodal87}</p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
          <p className="text-gray-300 text-sm mb-2">
            <strong className="text-blue-400">{t.creditpurchasemodal95}</strong>{t.creditpurchasemodal95_2}
          </p>
          <p className="text-gray-400 text-xs">
            {t.creditpurchasemodal98}
          </p>
        </div>

        {/* Credit Packages Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {creditPackages.map((pkg, index) => (
            <Card
              key={index}
              className={`text-center ${pkg.popular ? 'ring-2 ring-blue-400 bg-gray-700' : pkg.bestValue ? 'ring-2 ring-green-500 bg-gray-700' : 'bg-gray-700'} border border-gray-600 hover:shadow-xl transition-shadow`}
            >
              <div className="p-6">
                {pkg.popular && (
                  <Badge value={t.creditpurchasemodal111} severity="info" className="mb-4" />
                )}
                {pkg.bestValue && (
                  <Badge value={t.creditpurchasemodal114} severity="success" className="mb-4" />
                )}

                <div className="mb-4">
                  <CurrencyEuroIcon className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                  <h3 className="text-3xl font-bold text-white mb-1">
                    {pkg.credits.toLocaleString()}
                  </h3>
                  <p className="text-sm text-gray-400">{t.creditpurchasemodal122}</p>
                </div>

                <div className="text-4xl font-bold text-blue-400 mb-2">
                  €{pkg.price.toFixed(2)}
                </div>

                <div className="bg-gray-800 rounded p-3 mb-4">
                  <p className="text-xs text-gray-400">{t.creditpurchasemodal130}</p>
                  <p className="text-lg font-semibold text-green-400">
                    €{pkg.pricePerCredit}
                  </p>
                </div>

                <div className="bg-gray-900 rounded p-3 mb-6">
                  <p className="text-xs text-gray-400 mb-1">{t.creditpurchasemodal137}</p>
                  <p className="text-sm text-gray-300">
                    ≈ <strong className="text-blue-400">{Math.floor(pkg.credits / 5)}</strong>{t.creditpurchasemodal139}
                  </p>
                </div>

                <Button
                  label={t.creditpurchasemodal144}
                  icon="pi pi-shopping-cart"
                  className={pkg.bestValue ? 'p-button-success w-full' : pkg.popular ? 'p-button-primary w-full' : 'p-button-outlined w-full'}
                  style={{ borderRadius: '8px', paddingTop: '12px', paddingBottom: '12px', fontSize: '16px' }}
                  onClick={() => {
                    alert(`${t.creditpurchasemodal149}${pkg.credits}${t.creditpurchasemodal149_2}€${pkg.price.toFixed(2)}${t.creditpurchasemodal149_3}`);
                    onHide();
                  }}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center text-gray-400 text-sm">
          <p>{t.creditpurchasemodal160}</p>
          <p className="mt-2">{t.creditpurchasemodal161}<a href="#" className="text-blue-400 hover:text-blue-300">{t.creditpurchasemodal161_2}</a>.</p>
        </div>
      </div>
    </Dialog>
  );
}
