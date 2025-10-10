import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { getTranslations, SupportedLanguage, getStoredLanguage } from '@/utils/i18n';

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

  // Sync language with lobby (from localStorage)
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => getStoredLanguage());

  // Listen for language changes from lobby
  useEffect(() => {
    const handleStorageChange = () => {
      const newLang = getStoredLanguage();
      if (newLang !== currentLanguage) {
        setCurrentLanguage(newLang);
      }
    };

    // Check for language changes every time the modal becomes visible
    if (visible) {
      handleStorageChange();
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [visible, currentLanguage]);

  // Use useMemo to recalculate translations when language changes
  const t = React.useMemo(() => getTranslations(currentLanguage), [currentLanguage]);
  
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
          remember_me: formData.rememberMe,
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

      const userResponse = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        // Store user_id and user_type in localStorage for later use
        localStorage.setItem('user_id', userData.id.toString());
        localStorage.setItem('user_type', userData.user_type || 'free');
      }

      // Success - close modal
      onLoginSuccess?.();
      onHide();
      
    } catch {
      setError(_ instanceof Error ? _.message : 'An error occurred');
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
      header="Login"
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
            {t.DemoTextHeader}
          </h3>
          <p className="text-blue-700 text-sm mb-3">
            Test Scoriet without registration with ready-made demo data:
          </p>
          <div className="space-y-2">
            <button 
              type="button"
              className="w-full bg-white p-2 rounded border border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-colors cursor-pointer text-left"
              onClick={() => window.location.href = 'https://demo.scoriet.dev/demo-login?user=demo-admin'}
              disabled={loading}
            >
              <strong className="text-blue-800">demo-admin</strong>
              <span className="text-blue-600 text-sm ml-2">
                - Full access, 2 teams, 3 projects
              </span>
            </button>
            <button 
              type="button"
              className="w-full bg-white p-2 rounded border border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-colors cursor-pointer text-left"
              onClick={() => window.location.href = 'https://demo.scoriet.dev/demo-login?user=demo-user'}
              disabled={loading}
            >
              <strong className="text-blue-800">demo-user</strong>
              <span className="text-blue-600 text-sm ml-2">
                - Team member, assigned 1 project
              </span>
            </button>
          </div>
          <p className="text-blue-600 text-xs mt-2">
            Click cards above for instant demo or enter demo username manually (leave password empty) - Demo restarts every 20 minutes
          </p>
        </div>

        <div className="field">
          <label htmlFor="login-email" className="block text-sm font-medium mb-2">
            E-Mail oder Username
          </label>
          <InputText
            id="login-email"
            type="text"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder={formData.email === 'demo-admin' || formData.email === 'demo-user' ? 'demo-admin or demo-user' : 'email@example.com oder username'}
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
            inputId="login-password-input"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder={formData.email === 'demo-admin' || formData.email === 'demo-user' ? 'Leave empty for demo' : 'Your password'}
            className="w-full"
            inputClassName="w-full"
            disabled={loading}
            feedback={false}
            toggleMask
            autoComplete="current-password"
            required={formData.email !== 'demo-admin' && formData.email !== 'demo-user'}
          />
        </div>

        <div className="field">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember-me"
              checked={formData.rememberMe}
              onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
              disabled={loading}
              className="w-4 h-4"
            />
            <label htmlFor="remember-me" className="text-sm cursor-pointer">
              Stay logged in (30 days)
            </label>
          </div>
          <div className="text-xs text-gray-500 mt-1 ml-6">
            You will remain logged in even after closing the browser
          </div>
        </div>

        <Button
          type="submit"
          label={loading ? "Logging in..." : "Login"}
          icon={loading ? "pi pi-spinner pi-spin" : "pi pi-sign-in"}
          className="w-full"
          disabled={loading}
        />

        <div className="text-center space-y-2 mt-4">
          {import.meta.env.VITE_SCORIET_DEMO !== 'true' && (
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
          )}
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