import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Checkbox } from 'primereact/checkbox';
import { useTheme } from '@/contexts/ThemeContext';

interface TwoFactorVerifyDialogProps {
  visible: boolean;
  onHide: () => void;
  twoFactorToken: string;
  needsReverification?: boolean;
  rememberMe: boolean;
  onSuccess: (response: any) => void;
}

// Generate a unique device ID for this browser
const generateDeviceId = (): string => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

// Get browser info
const getBrowserInfo = (): string => {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';

  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome') && !ua.includes('Edge')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  // Add OS info
  let os = 'Unknown OS';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
};

export default function TwoFactorVerifyDialog({
  visible,
  onHide,
  twoFactorToken,
  needsReverification = false,
  onSuccess,
}: TwoFactorVerifyDialogProps) {
  const { colors } = useTheme();
  const [code, setCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecoveryHint, setShowRecoveryHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (visible) {
      setCode('');
      setError(null);
      setShowRecoveryHint(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('Bitte geben Sie einen Code ein.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          two_factor_token: twoFactorToken,
          code: code.replace(/\s/g, ''), // Remove any spaces
          trust_device: trustDevice,
          device_id: generateDeviceId(),
          browser: getBrowserInfo(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session abgelaufen. Bitte erneut einloggen.');
          setTimeout(() => onHide(), 2000);
        } else {
          setError(data.message || 'Ungültiger Code.');
          // Show recovery hint after failed attempt
          setShowRecoveryHint(true);
        }
        return;
      }

      // Success!
      onSuccess(data);
    } catch (_err) {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Allow both 6-digit codes and 10-character recovery codes
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(cleaned);
    setError(null);
  };

  return (
    <Dialog
      header={
        <div className="flex items-center gap-2">
          <i className="pi pi-shield" style={{ color: '#22c55e' }} />
          <span>Zwei-Faktor-Authentifizierung</span>
        </div>
      }
      visible={visible}
      onHide={onHide}
      style={{ width: '400px' }}
      modal
      closable={true}
      closeOnEscape={true}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {needsReverification && (
          <Message
            severity="info"
            text="Ihre monatliche 2FA-Verifizierung ist erforderlich."
            className="w-full"
          />
        )}

        <p style={{ color: colors.textSecondary }}>
          Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein.
        </p>

        <div className="field">
          <InputText
            ref={inputRef}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="w-full text-center text-2xl tracking-widest"
            style={{ letterSpacing: '0.3em' }}
            placeholder="000000"
            maxLength={10} // Allow recovery codes too
            disabled={loading}
          />
        </div>

        {error && (
          <Message severity="error" text={error} className="w-full" />
        )}

        {showRecoveryHint && (
          <div
            className="p-3 rounded-lg text-sm"
            style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}
          >
            <i className="pi pi-info-circle mr-2" style={{ color: colors.textSecondary }} />
            <span style={{ color: colors.textSecondary }}>
              Kein Zugriff auf Ihre App? Sie können auch einen 10-stelligen Backup-Code verwenden.
            </span>
          </div>
        )}

        <div className="field">
          <div className="flex items-center gap-2">
            <Checkbox
              inputId="trust-device"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.checked ?? false)}
              disabled={loading}
            />
            <label htmlFor="trust-device" className="cursor-pointer" style={{ color: colors.textPrimary }}>
              Diesem Gerät 30 Tage vertrauen
            </label>
          </div>
          <p className="text-xs mt-1 ml-6" style={{ color: colors.textSecondary }}>
            Sie werden auf diesem Gerät nicht erneut nach dem 2FA-Code gefragt.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            label="Abbrechen"
            className="p-button-text flex-1"
            onClick={onHide}
            disabled={loading}
          />
          <Button
            type="submit"
            label={loading ? 'Prüfe...' : 'Verifizieren'}
            icon={loading ? 'pi pi-spinner pi-spin' : 'pi pi-check'}
            className="flex-1"
            disabled={loading || code.length < 6}
          />
        </div>
      </form>
    </Dialog>
  );
}

// Export the helper functions for use in other components
export { generateDeviceId, getBrowserInfo };
