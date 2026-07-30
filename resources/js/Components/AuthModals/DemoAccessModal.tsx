import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useTranslation, SupportedLanguage } from '@/i18n';

interface DemoAccessModalProps {
  visible: boolean;
  onHide: () => void;
  currentLanguage: SupportedLanguage;
  /** Contextual notice when the user was bounced here from the demo. */
  notice?: 'required' | 'expired' | null;
}

/**
 * Email-gated demo access (request side, main site). The visitor leaves an
 * email + GDPR consent; the backend emails a one-time link to the demo.
 * Modeled on ForgotPasswordModal, plus a required consent checkbox and a
 * honeypot field (hidden input bots tend to fill).
 */
export default function DemoAccessModal({
  visible,
  onHide,
  currentLanguage,
  notice = null,
}: DemoAccessModalProps) {
  const { t } = useTranslation(currentLanguage);

  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot — must stay empty
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Reset state whenever the modal is hidden.
  React.useEffect(() => {
    if (!visible) {
      setEmail('');
      setConsent(false);
      setWebsite('');
      setError('');
      setSuccess('');
      setLoading(false);
    }
  }, [visible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError(t.demoaccessmodal_consent_required);
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/demo-access/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          consent,
          website, // honeypot
          locale: currentLanguage,
        }),
      });

      if (response.status === 422) {
        const data = await response.json();
        const firstError =
          data?.errors && typeof data.errors === 'object'
            ? (Object.values(data.errors)[0] as string)
            : t.demoaccessmodal_error;
        throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
      }

      if (!response.ok) {
        throw new Error(t.demoaccessmodal_error);
      }

      setSuccess(t.demoaccessmodal_success);
      setEmail('');
      setConsent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.demoaccessmodal_error);
    } finally {
      setLoading(false);
    }
  };

  const noticeText =
    notice === 'expired'
      ? t.demoaccessmodal_expired
      : notice === 'required'
        ? t.demoaccessmodal_required
        : '';

  return (
    <Dialog
      header={t.demoaccessmodal_title}
      visible={visible}
      onHide={onHide}
      style={{ width: '440px' }}
      modal
      closable
      draggable={true}
      resizable={true}
      className="p-dialog-custom"
    >
      {noticeText && (
        <Message severity="warn" text={noticeText} className="w-full mb-3" />
      )}

      <div className="mb-4 text-sm text-gray-600">
        {t.demoaccessmodal_intro}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Message severity="error" text={error} className="w-full" />}
        {success && <Message severity="success" text={success} className="w-full" />}

        <div className="field">
          <label htmlFor="demo-email" className="block text-sm font-medium mb-2">
            {t.demoaccessmodal_email_label}
          </label>
          <InputText
            id="demo-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
            placeholder={t.demoaccessmodal_email_placeholder}
            className="w-full"
            disabled={loading || !!success}
            required
          />
        </div>

        {/* Honeypot: visually hidden, off-screen. Real users never fill this. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
          aria-hidden="true"
        />

        <div className="flex items-start gap-2">
          <Checkbox
            inputId="demo-consent"
            checked={consent}
            onChange={(e) => { setConsent(!!e.checked); if (error) setError(''); }}
            disabled={loading || !!success}
          />
          <label htmlFor="demo-consent" className="text-xs text-gray-600 leading-snug">
            {t.demoaccessmodal_consent}
          </label>
        </div>

        <Button
          type="submit"
          label={loading ? t.demoaccessmodal_sending : t.demoaccessmodal_submit}
          icon={loading ? 'pi pi-spinner pi-spin' : 'pi pi-send'}
          className="w-full"
          disabled={loading || !!success}
        />
      </form>
    </Dialog>
  );
}
