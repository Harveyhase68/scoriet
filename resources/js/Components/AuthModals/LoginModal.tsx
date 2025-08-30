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
}

export default function LoginModal({ 
  visible, 
  onHide, 
  onSwitchToRegister, 
  onSwitchToForgotPassword,
  onLoginSuccess 
}: LoginModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
        throw new Error('Login failed');
      }

      const tokenData = await tokenResponse.json();
      
      // Save token - depending on 'Remember Me' option
      if (formData.rememberMe) {
        // Long-term storage - token available even after browser closing
        localStorage.setItem('access_token', tokenData.access_token);
        localStorage.setItem('refresh_token', tokenData.refresh_token);
        localStorage.setItem('remember_me', 'true');
        
        // Additionally: set cookie for 30 days as backup
        const expirationDate = new Date();
        expirationDate.setTime(expirationDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
        document.cookie = `remember_token=${tokenData.refresh_token}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Strict`;
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error on input
  };

  const handleHide = () => {
    // Reset form when closing
    setFormData({ email: '', password: '', rememberMe: false });
    setError('');
    setLoading(false);
    onHide();
  };

  return (
    <Dialog
      header="Log In"
      visible={visible}
      onHide={handleHide}
      style={{ width: '400px' }}
      modal
      closable
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