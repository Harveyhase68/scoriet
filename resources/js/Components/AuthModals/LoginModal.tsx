import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Checkbox } from 'primereact/checkbox';

interface LoginModalProps {
  visible: boolean;
  onHide: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  onLoginSuccess?: () => void;
  closable?: boolean;
}

export default function LoginModal({ 
  visible, 
  onHide, 
  onSwitchToRegister, 
  onSwitchToForgotPassword,
  onLoginSuccess,
  closable = true
}: LoginModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check for demo users and redirect
    if (formData.email === 'demo-admin' || formData.email === 'demo-user') {
      // Redirect to demo subdomain with user type
      window.location.href = `https://demo.scoriet.dev/demo-login?user=${formData.email}`;
      return;
    }

    try {
      // Laravel Passport OAuth Token Request
      const tokenResponse = await fetch('/api/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'password',
          client_id: import.meta.env.VITE_PASSPORT_CLIENT_ID || '1',
          client_secret: import.meta.env.VITE_PASSPORT_CLIENT_SECRET || '',
          username: formData.email,
          password: formData.password,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        
        // Check if this is an email verification error
        if (tokenResponse.status === 403 && errorData.email_verification_required) {
          setError('E-Mail-Adresse muss bestätigt werden. Bitte prüfen Sie Ihre E-Mails.');
          setShowResendVerification(true);
          return;
        }
        
        throw new Error(errorData.message || 'Login failed');
      }

      const tokenData = await tokenResponse.json();
      
      // Save token - depending on 'Remember Me' option
      if (formData.rememberMe) {
        // Long-term storage - token available even after browser closing
        localStorage.setItem('access_token', tokenData.access_token);
        localStorage.setItem('refresh_token', tokenData.refresh_token);
        localStorage.setItem('remember_me', 'true');
        
      } else {
        // Only for session - deleted when browser closes
        sessionStorage.setItem('access_token', tokenData.access_token);
        sessionStorage.setItem('refresh_token', tokenData.refresh_token);
        localStorage.setItem('remember_me', 'false');
      }

      // Call user update with token from correct storage
      const accessToken = formData.rememberMe ? 
        localStorage.getItem('access_token') : 
        sessionStorage.getItem('access_token');
        
      await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      // Success - close modal
      onLoginSuccess?.();
      onHide();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setVerificationMessage('');

    try {
      // First, get a token to access the resend endpoint
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      // Even if login fails due to unverified email, we might get a token
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        const token = loginData.access_token;

        // Now try to resend verification email
        const resendResponse = await fetch('/api/auth/email/resend', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (resendResponse.ok) {
          setVerificationMessage('Bestätigungs-E-Mail wurde erneut gesendet!');
          setShowResendVerification(false);
        }
      }
    } catch {
      setVerificationMessage('Fehler beim Senden der E-Mail. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error on input
  };

  const handleHide = () => {
    // Reset form when closing
    setFormData({ email: '', password: '', rememberMe: false });
    setError('');
    setLoading(false);
    setShowResendVerification(false);
    setVerificationMessage('');
    onHide();
  };

  return (
    <Dialog
      header="Log In"
      visible={visible}
      onHide={handleHide}
      style={{ width: '400px' }}
      modal
      closable={closable}
      draggable={false}
      resizable={false}
      className="p-dialog-custom"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Message 
            severity="error" 
            text={error} 
            className="w-full"
          />
        )}

        {verificationMessage && (
          <Message 
            severity="success" 
            text={verificationMessage} 
            className="w-full"
          />
        )}

        {showResendVerification && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">
              Ihre E-Mail-Adresse ist noch nicht bestätigt. 
            </p>
            <Button
              type="button"
              label="Bestätigungs-E-Mail erneut senden"
              className="p-button-sm p-button-outlined"
              onClick={handleResendVerification}
              disabled={loading}
            />
          </div>
        )}

        {/* Demo Section */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
          <h3 className="text-blue-800 font-semibold mb-2 flex items-center">
            <i className="pi pi-info-circle mr-2"></i>
            Demo-Modus verfügbar
          </h3>
          <p className="text-blue-700 text-sm mb-3">
            Testen Sie Scoriet ohne Registrierung mit vorgefertigten Demo-Daten:
          </p>
          <div className="space-y-2">
            <div className="bg-white p-2 rounded border border-blue-300">
              <strong className="text-blue-800">demo-admin</strong>
              <span className="text-blue-600 text-sm ml-2">
                - Vollzugriff, 2 Teams, 3 Projekte
              </span>
            </div>
            <div className="bg-white p-2 rounded border border-blue-300">
              <strong className="text-blue-800">demo-user</strong>
              <span className="text-blue-600 text-sm ml-2">
                - Team-Mitglied, 1 Projekt zugewiesen
              </span>
            </div>
          </div>
          <p className="text-blue-600 text-xs mt-2">
            Passwort beliebig - Demo startet automatisch neu alle 20 Minuten
          </p>
        </div>

        <div className="field">
          <label htmlFor="login-email" className="block text-sm font-medium mb-2">
            E-Mail
          </label>
          <InputText
            id="login-email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="ihre.email@example.com"
            className="w-full"
            disabled={loading}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="login-password" className="block text-sm font-medium mb-2">
            Passwort
          </label>
          <Password
            id="login-password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Ihr Passwort"
            className="w-full"
            inputClassName="w-full"
            disabled={loading}
            feedback={false}
            toggleMask
            required
          />
        </div>

        <div className="field">
          <div className="flex items-center">
            <Checkbox
              id="remember-me"
              checked={formData.rememberMe}
              onChange={(e) => handleInputChange('rememberMe', e.checked || false)}
              disabled={loading}
            />
            <label htmlFor="remember-me" className="ml-2 text-sm cursor-pointer">
              Stay logged in (30 days)
            </label>
          </div>
          <div className="text-xs text-gray-500 mt-1 ml-6">
            You will remain logged in even after closing the browser
          </div>
        </div>

        <Button
          type="submit"
          label={loading ? "Logging in..." : "Log In"}
          icon={loading ? "pi pi-spinner pi-spin" : "pi pi-sign-in"}
          className="w-full"
          disabled={loading}
        />

        <div className="text-center space-y-2 mt-4">
          <div>
            <Button
              type="button"
              label="Don't have an account? Register"
              className="p-button-link p-button-sm"
              onClick={() => {
                handleHide();
                onSwitchToRegister();
              }}
            />
          </div>
          <div>
            <Button
              type="button"
              label="Forgot password?"
              className="p-button-link p-button-sm"
              onClick={() => {
                handleHide();
                onSwitchToForgotPassword();
              }}
            />
          </div>
        </div>
      </form>
    </Dialog>
  );
}