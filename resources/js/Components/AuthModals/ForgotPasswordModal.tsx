import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

interface ForgotPasswordModalProps {
  visible: boolean;
  onHide: () => void;
  onSwitchToLogin: () => void;
}

export default function ForgotPasswordModal({ 
  visible, 
  onHide, 
  onSwitchToLogin 
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
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
        body: JSON.stringify({
          email: email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error sending email');
      }

      setSuccess('A password reset link has been sent to your email address.');
      setEmail(''); // Clear email field
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    if (error) setError(''); // Clear error on input
    if (success) setSuccess(''); // Clear success on input
  };

  const handleHide = () => {
    // Reset form when closing
    setEmail('');
    setError('');
    setSuccess('');
    setLoading(false);
    onHide();
  };

  return (
    <Dialog
      header="Forgot Password"
      visible={visible}
      onHide={handleHide}
      style={{ width: '400px' }}
      modal
      closable
      draggable={false}
      resizable={false}
      className="p-dialog-custom"
    >
      <div className="mb-4 text-sm text-gray-600">
        Enter your email address and we will send you a link to reset your password.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Message 
            severity="error" 
            text={error} 
            className="w-full"
          />
        )}

        {success && (
          <Message 
            severity="success" 
            text={success} 
            className="w-full"
          />
        )}

        <div className="field">
          <label htmlFor="forgot-email" className="block text-sm font-medium mb-2">
            E-Mail
          </label>
          <InputText
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="ihre.email@example.com"
            className="w-full"
            disabled={loading}
            required
          />
        </div>

        <Button
          type="submit"
          label={loading ? "Wird gesendet..." : "Reset-Link senden"}
          icon={loading ? "pi pi-spinner pi-spin" : "pi pi-send"}
          className="w-full"
          disabled={loading}
        />

        <div className="text-center mt-4">
          <Button
            type="button"
            label="Back to Login"
            className="p-button-link p-button-sm"
            onClick={() => {
              handleHide();
              onSwitchToLogin();
            }}
          />
        </div>
      </form>
    </Dialog>
  );
}