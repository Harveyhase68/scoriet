import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

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
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Reset state whenever the modal is hidden. Replaces the pattern of calling
  // handleHide() right before onSwitchToLogin() which produced a transient
  // null-modal state (and could leave PrimeReact's mask overlay stuck).
  React.useEffect(() => {
    if (!visible) {
      setEmail('');
      setError('');
      setSuccess('');
      setLoading(false);
    }
  }, [visible]);

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
        throw new Error(errorData.message || t.forgotpasswordmodal43);
      }

      setSuccess(t.forgotpasswordmodal46);
      setEmail(''); // Clear email field

      // Auto-close the dialog shortly after success so the user is not stuck
      // in a modal that looks "done" — the success toast/message remains
      // visible long enough to be read.
      setTimeout(() => {
        handleHide();
      }, 2500);

    } catch (error) {
      setError(error instanceof Error ? error.message : t.authmodalsegistermodal109);
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
      header={t.forgotpasswordmodal73}
      visible={visible}
      onHide={handleHide}
      style={{ width: '400px' }}
      modal
      closable
      draggable={true}
      resizable={true}
      className="p-dialog-custom"
    >
      <div className="mb-4 text-sm text-gray-600">
        {t.forgotpasswordmodal89}
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
            {t.forgotpasswordmodal111}
          </label>
          <InputText
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={t.forgotpasswordmodal113}
            className="w-full"
            disabled={loading}
            required
          />
        </div>

        <Button
          type="submit"
          label={loading ? t.forgotpasswordmodal127 : t.forgotpasswordmodal122}
          icon={loading ? "pi pi-spinner pi-spin" : "pi pi-send"}
          className="w-full"
          disabled={loading}
        />

        <div className="text-center mt-4">
          <Button
            type="button"
            label={t.forgotpasswordmodal131}
            className="p-button-link p-button-sm"
            onClick={onSwitchToLogin}
          />
        </div>
      </form>
    </Dialog>
  );
}