import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Steps } from 'primereact/steps';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface ForgotPasswordPanelProps {
  onSwitchPanel?: (panelType: string) => void;
}

export default function ForgotPasswordPanel({ onSwitchPanel }: ForgotPasswordPanelProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Step 1: Enter email
  const [email, setEmail] = useState('');

  // Step 2: Token and new password
  const [resetData, setResetData] = useState({
    token: '',
    password: '',
    password_confirmation: ''
  });

  const steps = [
    { label: t.forgotpasswordpanel29 },
    { label: t.forgotpasswordpanel30 }
  ];

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.forgotpasswordpanel52);
      }

      setSuccess(t.forgotpasswordpanel55);
      setCurrentStep(1);

    } catch (err) {
      setError(err instanceof Error ? err.message : t.profilemodal346);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Check password confirmation
    if (resetData.password !== resetData.password_confirmation) {
      setError(t.authmodalsegistermodal58);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          token: resetData.token,
          password: resetData.password,
          password_confirmation: resetData.password_confirmation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.forgotpasswordpanel96);
      }

      setSuccess(t.forgotpasswordpanel99);
      
      // Nach 3 Sekunden zum Login weiterleiten
      setTimeout(() => {
        if (onSwitchPanel) {
          onSwitchPanel('login');
        }
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : t.profilemodal346);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setCurrentStep(0);
    setResetData({
      token: '',
      password: '',
      password_confirmation: ''
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="flex justify-center items-center min-h-full bg-gray-50 p-4">
      <Card 
        title={t.forgotpasswordmodal73} 
        className="w-full max-w-md shadow-lg"
        pt={{
          root: { className: 'border border-gray-200' },
          title: { className: 'text-center text-xl font-semibold mb-4' }
        }}
      >
        <div className="mb-6">
          <Steps 
            model={steps} 
            activeIndex={currentStep} 
            readOnly={true}
            className="mb-4"
          />
        </div>

        {error && (
          <Message 
            severity="error" 
            text={error} 
            className="w-full mb-4"
          />
        )}

        {success && (
          <Message 
            severity="success" 
            text={success} 
            className="w-full mb-4"
          />
        )}

        {currentStep === 0 && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                {t.forgotpasswordpanel171}
              </p>
            </div>

            <div className="field">
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                {t.forgotpasswordpanel177}
              </label>
              <InputText
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.forgotpasswordmodal113}
                className="w-full"
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              label={loading ? "Send..." : t.forgotpasswordpanel187}
              icon={loading ? "pi pi-spinner pi-spin" : "pi pi-envelope"}
              className="w-full"
              disabled={loading}
            />

            {onSwitchPanel && (
              <div className="text-center mt-4">
                <Button
                  type="button"
                  label={t.forgotpasswordmodal131}
                  className="p-button-link p-button-sm"
                  onClick={() => onSwitchPanel('login')}
                />
              </div>
            )}
          </form>
        )}

        {currentStep === 1 && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                {t.forgotpasswordpanel216}
              </p>
            </div>

            <div className="field">
              <label htmlFor="token" className="block text-sm font-medium mb-2">
                {t.forgotpasswordpanel222}
              </label>
              <InputText
                id="token"
                value={resetData.token}
                onChange={(e) => setResetData(prev => ({ ...prev, token: e.target.value }))}
                placeholder={t.forgotpasswordpanel222}
                className="w-full"
                disabled={loading}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                {t.forgotpasswordpanel237}
              </label>
              <Password
                id="password"
                value={resetData.password}
                onChange={(e) => setResetData(prev => ({ ...prev, password: e.target.value }))}
                placeholder={t.newPassword}
                className="w-full"
                inputClassName="w-full"
                disabled={loading}
                feedback={true}
                toggleMask
                required
                promptLabel={t.panelsegisterpanel161}
                weakLabel={t.panelsegisterpanel162}
                mediumLabel={t.panelsegisterpanel163}
                strongLabel={t.panelsegisterpanel164}
              />
            </div>

            <div className="field">
              <label htmlFor="password_confirmation" className="block text-sm font-medium mb-2">
                {t.forgotpasswordpanel259}
              </label>
              <Password
                id="password_confirmation"
                value={resetData.password_confirmation}
                onChange={(e) => setResetData(prev => ({ ...prev, password_confirmation: e.target.value }))}
                placeholder={t.authmodalsegistermodal312}
                className="w-full"
                inputClassName="w-full"
                disabled={loading}
                feedback={false}
                toggleMask
                required
              />
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                label={t.joincodemodal299}
                icon="pi pi-arrow-left"
                className="p-button-secondary flex-1"
                onClick={handleBackToStep1}
                disabled={loading}
              />
              <Button
                type="submit"
                label={loading ? t.forgotpasswordpanel286 : t.authmodalsesetpasswordmodal319}
                icon={loading ? "pi pi-spinner pi-spin" : "pi pi-check"}
                className="flex-1"
                disabled={loading}
              />
            </div>

            {onSwitchPanel && (
              <div className="text-center mt-4">
                <Button
                  type="button"
                  label={t.forgotpasswordmodal131}
                  className="p-button-link p-button-sm"
                  onClick={() => onSwitchPanel('login')}
                />
              </div>
            )}
          </form>
        )}
      </Card>
    </div>
  );
}