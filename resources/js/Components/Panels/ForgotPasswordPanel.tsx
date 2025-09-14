import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Steps } from 'primereact/steps';

interface ForgotPasswordPanelProps {
  onSwitchPanel?: (panelType: string) => void;
}

export default function ForgotPasswordPanel({ onSwitchPanel }: ForgotPasswordPanelProps) {
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
    { label: 'Enter email' },
    { label: 'Reset password' }
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
        throw new Error(data.message || 'Reset link could not be sent');
      }

      setSuccess('A reset link has been sent to your email address. Check your inbox.');
      setCurrentStep(1);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error has occurred');
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
      setError('Passwords do not match');
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
        throw new Error(data.message || 'Password could not be reset');
      }

      setSuccess('Password successfully reset! You can now log in with your new password.');
      
      // Nach 3 Sekunden zum Login weiterleiten
      setTimeout(() => {
        if (onSwitchPanel) {
          onSwitchPanel('login');
        }
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error has occurred');
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
        title="Passwort vergessen" 
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
                Enter your email address to receive a link to reset your password.
              </p>
            </div>

            <div className="field">
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                E-Mail
              </label>
              <InputText
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full"
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              label={loading ? "Send..." : "Send reset link"}
              icon={loading ? "pi pi-spinner pi-spin" : "pi pi-envelope"}
              className="w-full"
              disabled={loading}
            />

            {onSwitchPanel && (
              <div className="text-center mt-4">
                <Button
                  type="button"
                  label="Back to Login"
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
                Enter the reset code from the email and your new password.
              </p>
            </div>

            <div className="field">
              <label htmlFor="token" className="block text-sm font-medium mb-2">
                Reset-Code
              </label>
              <InputText
                id="token"
                value={resetData.token}
                onChange={(e) => setResetData(prev => ({ ...prev, token: e.target.value }))}
                placeholder="Code aus der E-Mail"
                className="w-full"
                disabled={loading}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Neues Passwort
              </label>
              <Password
                id="password"
                value={resetData.password}
                onChange={(e) => setResetData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Neues Passwort"
                className="w-full"
                inputClassName="w-full"
                disabled={loading}
                feedback={true}
                toggleMask
                required
                promptLabel="Passwort eingeben"
                weakLabel="Schwach"
                mediumLabel="Mittel"
                strongLabel="Stark"
              />
            </div>

            <div className="field">
              <label htmlFor="password_confirmation" className="block text-sm font-medium mb-2">
                Passwort bestätigen
              </label>
              <Password
                id="password_confirmation"
                value={resetData.password_confirmation}
                onChange={(e) => setResetData(prev => ({ ...prev, password_confirmation: e.target.value }))}
                placeholder="Passwort wiederholen"
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
                label="Zurück"
                icon="pi pi-arrow-left"
                className="p-button-secondary flex-1"
                onClick={handleBackToStep1}
                disabled={loading}
              />
              <Button
                type="submit"
                label={loading ? "Zurücksetzen..." : "Passwort zurücksetzen"}
                icon={loading ? "pi pi-spinner pi-spin" : "pi pi-check"}
                className="flex-1"
                disabled={loading}
              />
            </div>

            {onSwitchPanel && (
              <div className="text-center mt-4">
                <Button
                  type="button"
                  label="Back to Login"
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