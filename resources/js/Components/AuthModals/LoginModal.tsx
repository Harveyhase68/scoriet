import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

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

  // Language state
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  // Check if we're on demo subdomain
  const isDemoMode = window.location.hostname === 'demo.scoriet.dev' ||
                     window.location.hostname === 'demo.localhost' ||
                     import.meta.env.VITE_SCORIET_DEMO === 'true';

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail.language);
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);
  
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
          setError(t.loginmodal88);
          setShowResendVerification(true);
          return;
        }
        
        throw new Error(errorData.message || t.authcontroller156);
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

    } catch (error) {
      // Better error messages for common scenarios
      const errorMessage = error instanceof Error ? error.message : t.authmodalsegistermodal109;

      // Check for specific error messages
      if (errorMessage.includes(t.authcontroller156) || errorMessage.includes('invalid_grant')) {
        setError(t.loginmodal140);
      } else if (errorMessage.includes('email_verification_required')) {
        setError(t.loginmodal142);
      } else {
        setError(errorMessage);
      }
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
          setVerificationMessage(t.loginmodal184);
          setShowResendVerification(false);
        }
      }
    } catch {
      setVerificationMessage(t.loginmodal189);
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
      header={t.loginmodal212}
      visible={visible}
      onHide={handleHide}
      style={{ width: '400px' }}
      modal
      closable={closable}
      draggable={true}
      resizable={true}
      className="p-dialog-custom"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isDemoMode && error && (
          <Message
            severity="error"
            text={error}
            className="w-full"
          />
        )}

        {!isDemoMode && verificationMessage && (
          <Message
            severity="success"
            text={verificationMessage}
            className="w-full"
          />
        )}

        {!isDemoMode && showResendVerification && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">
              Ihre E-Mail-Adresse ist noch nicht bestätigt.
            </p>
            <Button
              type="button"
              label={t.loginmodal246}
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
            {t.LoginDemoTextHeader}
          </h3>
          <p className="text-blue-700 text-sm mb-3">
            {t.LoginDemoDescription}
          </p>
          <div className="space-y-2">
            <button 
              type="button"
              className="w-full bg-white p-2 rounded border border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-colors cursor-pointer text-left"
              onClick={() => window.location.href = 'http://10.0.0.8:8000/demo-login?user=demo-admin'}
              disabled={loading}
            >
              <strong className="text-blue-800">demo-admin</strong>
              <span className="text-blue-600 text-sm ml-2">
             {t. LoginDemoAdmin}
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
              {t.LoginDemoUser}
              </span>
            </button>
          </div>
          <p className="text-blue-600 text-xs mt-2">
            {t.LoginToolTip}
          </p>
        </div>

        {/* Normal login fields - only show if NOT in demo mode */}
        {!isDemoMode && (
          <>
            <div className="field">
              <label htmlFor="login-email" className="block text-sm font-medium mb-2">
                {t.LoginEmailOrUserName}
              </label>
              <InputText
                id="login-email"
                type="text"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={formData.email === 'demo-admin' || formData.email === 'demo-user' ? 'demo-admin or demo-user' : t.LoginEmailOrUserNameHint}
                className="w-full"
                disabled={loading}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="login-password" className="block text-sm font-medium mb-2">
                {t.LoginPassword}
              </label>
              <Password
                id="login-password"
                inputId="login-password-input"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder={formData.email === 'demo-admin' || formData.email === 'demo-user' ? t.loginmodal317 : t.LoginPassword}
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
                  {t.LoginStayLoggedIn}
                </label>
              </div>
              <div className="text-xs text-gray-500 mt-1 ml-6">
                {t.LoginStayLoggedInTooltip}
              </div>
            </div>

            <Button
              type="submit"
              label={loading ? t.LoginDoLogin : t.LoginButton}
              icon={loading ? "pi pi-spinner pi-spin" : "pi pi-sign-in"}
              className="w-full"
              disabled={loading}
            />

            <div className="text-center space-y-2 mt-4">
              <div>
                <Button
                  type="button"
                  label={t.LoginRegister}
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
                  label={t.LoginForgotPassword}
                  className="p-button-link p-button-sm"
                  onClick={() => {
                    handleHide();
                    onSwitchToForgotPassword();
                  }}
                />
              </div>
            </div>
          </>
        )}
      </form>
    </Dialog>
  );
}