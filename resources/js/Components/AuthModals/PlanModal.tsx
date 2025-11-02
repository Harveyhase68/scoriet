import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { CheckIcon, HeartIcon } from '@heroicons/react/24/outline';
import { pricingUtils } from '@/lib/api';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface PlanModalProps {
  visible: boolean;
  onHide: () => void;
}

export default function PlanModal({ visible, onHide }: PlanModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  // Get pricing data from localStorage
  const getPricingData = () => {
    const prices = pricingUtils.getPricingData();
    const currency = pricingUtils.getCurrency();
    
    // Fallback to defaults if no pricing data available
    if (!prices) {
      return {
        premium: 2.99,
        business: 9.99,
        patron: 5.00,
        currency: t.app48
      };
    }
    
    return {
      premium: prices.premium,
      business: prices.business,
      patron: prices.patron,
      currency: currency
    };
  };

  // Get pricing data
  const pricingData = getPricingData();
  
  const pricingTiers = [
    {
      name: t.planmodal43,
      price: "€0",
      period: "forever",
      description: t.planmodal46,
      features: [
        t.planmodal48,
        t.planmodal49,
        t.planmodal50,
        t.planmodal51
      ],
      buttonText: t.planmodal53,
      buttonClass: "p-button-secondary",
      popular: false
    },
    {
      name: t.planmodal58,
      price: `${pricingData.currency}${pricingData.premium}`,
      period: "/month",
      yearlyPrice: `${pricingData.currency}${(pricingData.premium * 10).toFixed(2)}/year`,
      description: t.planmodal62,
      features: [
        t.planmodal64,
        t.planmodal65,
        t.planmodal66,
        t.planmodal67,
        t.planmodal68,
        t.planmodal69
      ],
      buttonText: t.planmodal71,
      buttonClass: "p-button-primary",
      popular: true
    },
    {
      name: t.planmodal76,
      price: `${pricingData.currency}${pricingData.business}`,
      period: "/month",
      yearlyPrice: `${pricingData.currency}${(pricingData.business * 10).toFixed(2)}/year`,
      description: t.planmodal80,
      features: [
        t.planmodal82,
        t.planmodal83,
        t.planmodal84,
        t.planmodal85,
        t.planmodal86,
        t.planmodal87
      ],
      buttonText: t.planmodal89,
      buttonClass: "p-button-info",
      popular: false
    },
    {
      name: t.planmodal94,
      price: `${pricingData.currency}${pricingData.patron}+`,
      period: "/month",
      description: t.planmodal97,
      features: [
        t.planmodal99,
        t.planmodal100,
        t.planmodal101,
        t.planmodal102,
        t.planmodal103
      ],
      buttonText: t.planmodal105,
      buttonClass: "p-button-help",
      popular: false
    }
  ];

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      header={t.planmodal116}
      style={{ width: '95vw', maxWidth: '1400px' }}
      contentStyle={{ padding: '20px', backgroundColor: '#111827', color: 'white' }}
      headerStyle={{ backgroundColor: '#1f2937', color: 'white', border: 'none' }}
      className="plan-modal"
    >
      <div className="space-y-6">
        {/* Current Plan Status */}
        <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-l-blue-400">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">Current Plan</h3>
            <Badge value={t.planmodal43} severity="info" />
          </div>
          <p className="text-gray-300">
            You're currently on the <strong className="text-blue-400">Free plan</strong>. Upgrade to unlock more features and support the project!
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          {pricingTiers.map((plan, index) => (
            <Card
              key={index}
              className={`text-center ${plan.popular ? 'ring-2 ring-blue-400 bg-gray-700' : 'bg-gray-700'} border border-gray-600 hover:shadow-xl transition-shadow`}
            >
              <div className="p-6">
                {plan.popular && (
                  <Badge value={t.planmodal143} severity="info" className="mb-4" />
                )}
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
                  {plan.name}
                  {plan.name === t.planmodal94 && <HeartIcon className="w-6 h-6 text-red-500 ml-2" />}
                </h3>
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {plan.price}
                  {plan.price !== '€0' && plan.price !== t.planmodal151 && (
                    <span className="text-lg text-gray-400">/month</span>
                  )}
                </div>
                {plan.yearlyPrice && (
                  <div className="text-sm text-green-400 mb-2">
                    Save 17%: {plan.yearlyPrice}
                  </div>
                )}
                <p className="text-gray-300 mb-6">{plan.description}</p>

                <ul className="text-left text-gray-300 mb-8 space-y-2">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center">
                      <CheckIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  label={plan.buttonText}
                  className={plan.name === t.planmodal43 ? 'p-button-secondary w-full' : `${plan.buttonClass} w-full`}
                  style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                  disabled={plan.name === t.planmodal43}
                  onClick={() => {
                    if (plan.name !== t.planmodal43) {
                      alert(`Upgrading to ${plan.name} - Payment integration coming soon!`);
                      onHide();
                    }
                  }}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center text-gray-400 text-sm">
          <p>You can change or cancel your plan at any time. All plans include a 30-day money-back guarantee.</p>
        </div>
      </div>
    </Dialog>
  );
}