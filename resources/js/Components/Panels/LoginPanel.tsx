import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';

interface LoginPanelProps {
  onSwitchPanel?: (panelType: string) => void;
  onLoginSuccess?: () => void;
}

export default function LoginPanel({ onSwitchPanel, onLoginSuccess }: LoginPanelProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
      
      // Save token in localStorage
      localStorage.setItem('access_token', tokenData.access_token);
      localStorage.setItem('refresh_token', tokenData.refresh_token);

      // Get user data
      await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      });

      // Success - close panel or redirect
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error on input
  };

  return (
    <div className="flex justify-center items-center min-h-full bg-gray-900 p-4">
      <Card 
        title="Log In" 
        className="w-full max-w-md shadow-lg bg-gray-800 border-gray-600"
        pt={{
          root: { className: 'border border-gray-600 bg-gray-800' },
          title: { className: 'text-center text-xl font-semibold mb-4 text-white' },
          content: { className: 'bg-gray-800' }
        }}
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
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-300">
              E-Mail
            </label>
            <InputText
              id="email"
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
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-300">
              Password
            </label>
            <Password
              id="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Your password"
              className="w-full"
              inputClassName="w-full"
              disabled={loading}
              feedback={false}
              toggleMask
              required
            />
          </div>

          <Button
            type="submit"
            label={loading ? "Logging in..." : "Log In"}
            icon={loading ? "pi pi-spinner pi-spin" : "pi pi-sign-in"}
            className="w-full"
            disabled={loading}
          />

          {onSwitchPanel && (
            <div className="text-center space-y-2 mt-4">
              <div>
                <Button
                  type="button"
                  label="Don't have an account? Register"
                  className="p-button-link p-button-sm"
                  onClick={() => onSwitchPanel('register')}
                />
              </div>
              <div>
                <Button
                  type="button"
                  label="Forgot password?"
                  className="p-button-link p-button-sm"
                  onClick={() => onSwitchPanel('forgot')}
                />
              </div>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}