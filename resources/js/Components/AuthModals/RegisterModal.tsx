import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

interface RegisterModalProps {
  visible: boolean;
  onHide: () => void;
  onSwitchToLogin: () => void;
  onRegistrationSuccess?: () => void;
}

export default function RegisterModal({ 
  visible, 
  onHide, 
  onSwitchToLogin,
  onRegistrationSuccess 
}: RegisterModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Check password confirmation
    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.password_confirmation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      await response.json();
      setSuccess('Registration successful! You can now log in.');
      
      // Automatically switch to login after 2 seconds
      setTimeout(() => {
        onRegistrationSuccess?.();
        handleHide();
        onSwitchToLogin();
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error on input
    if (success) setSuccess(''); // Clear success on input
  };

  const handleHide = () => {
    // Reset form when closing
    setFormData({ name: '', email: '', password: '', password_confirmation: '' });
    setError('');
    setSuccess('');
    setLoading(false);
    onHide();
  };

  return (
    <Dialog
      header="Register"
      visible={visible}
      onHide={handleHide}
      style={{ width: '450px' }}
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

        {success && (
          <Message 
            severity="success" 
            text={success} 
            className="w-full"
          />
        )}

        <div className="field">
          <label htmlFor="register-name" className="block text-sm font-medium mb-2">
            Name
          </label>
          <InputText
            id="register-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Your full name"
            className="w-full"
            disabled={loading}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="register-email" className="block text-sm font-medium mb-2">
            E-Mail
          </label>
          <InputText
            id="register-email"
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
          <label htmlFor="register-password" className="block text-sm font-medium mb-2">
            Passwort
          </label>
          <Password
            id="register-password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Your password"
            className="w-full"
            inputClassName="w-full"
            disabled={loading}
            feedback={true}
            toggleMask
            required
          />
        </div>

        <div className="field">
          <label htmlFor="register-password-confirmation" className="block text-sm font-medium mb-2">
            Confirm password
          </label>
          <Password
            id="register-password-confirmation"
            value={formData.password_confirmation}
            onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
            placeholder="Repeat password"
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
          label={loading ? "Registration in progress..." : "Register"}
          icon={loading ? "pi pi-spinner pi-spin" : "pi pi-user-plus"}
          className="w-full"
          disabled={loading}
        />

        <div className="text-center mt-4">
          <Button
            type="button"
            label="Already have an account? Log In"
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