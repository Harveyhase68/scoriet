import React, { useState, useEffect, useCallback } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Message } from 'primereact/message';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Divider } from 'primereact/divider';
import { useTheme } from '@/contexts/ThemeContext';
// Note: Currently hardcoded in German. Add translations later if needed.

interface TwoFactorStatus {
  enabled: boolean;
  pending: boolean;
  recovery_codes_count: number;
  trusted_devices_count: number;
  needs_reverification: boolean;
  confirmed_at: string | null;
  last_verified_at: string | null;
}

interface TrustedDevice {
  device_id: string;
  browser: string;
  ip: string;
  trusted_until: string;
  created_at: string;
}

export default function TwoFactorSection() {
  const { colors } = useTheme();

  // State
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Setup flow state
  const [setupMode, setSetupMode] = useState(false);
  const [setupStep, setSetupStep] = useState<'password' | 'qr' | 'verify' | 'recovery'>('password');
  const [password, setPassword] = useState('');
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loadingSetup, setLoadingSetup] = useState(false);

  // Disable flow state
  const [disableMode, setDisableMode] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [loadingDisable, setLoadingDisable] = useState(false);

  // Trusted devices state
  const [showDevices, setShowDevices] = useState(false);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Regenerate codes state
  const [showRegenerateCodes, setShowRegenerateCodes] = useState(false);
  const [regeneratePassword, setRegeneratePassword] = useState('');
  const [loadingRegenerate, setLoadingRegenerate] = useState(false);
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[]>([]);

  // Get auth token
  const getToken = useCallback(() => {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  }, []);

  // Fetch 2FA status
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/two-factor/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data.two_factor);
      }
    } catch (err) {
      console.error('Failed to fetch 2FA status:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Initial load
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Start 2FA setup
  const handleStartSetup = () => {
    setSetupMode(true);
    setSetupStep('password');
    setPassword('');
    setError(null);
    setSuccess(null);
  };

  // Submit password and get QR code
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSetup(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch('/api/two-factor/enable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Fehler beim Starten des 2FA-Setups');
        return;
      }

      setQrCodeSvg(data.qr_code_svg);
      setSecret(data.secret);
      setSetupStep('qr');
    } catch (_err) {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoadingSetup(false);
    }
  };

  // Continue to verification
  const handleContinueToVerify = () => {
    setVerifyCode('');
    setSetupStep('verify');
  };

  // Verify TOTP code
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSetup(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch('/api/two-factor/confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verifyCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Ungültiger Code');
        return;
      }

      setRecoveryCodes(data.recovery_codes);
      setStatus(data.two_factor);
      setSetupStep('recovery');
    } catch (_err) {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoadingSetup(false);
    }
  };

  // Finish setup
  const handleFinishSetup = () => {
    setSetupMode(false);
    setSetupStep('password');
    setPassword('');
    setQrCodeSvg(null);
    setSecret(null);
    setVerifyCode('');
    setRecoveryCodes([]);
    setSuccess('2FA wurde erfolgreich aktiviert!');
    fetchStatus();
  };

  // Cancel setup
  const handleCancelSetup = async () => {
    try {
      const token = getToken();
      await fetch('/api/two-factor/cancel-setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
    } catch (_err) {
      // Ignore errors
    }

    setSetupMode(false);
    setSetupStep('password');
    setPassword('');
    setQrCodeSvg(null);
    setSecret(null);
    setVerifyCode('');
  };

  // Disable 2FA
  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingDisable(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch('/api/two-factor/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: disablePassword,
          code: disableCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Fehler beim Deaktivieren von 2FA');
        return;
      }

      setDisableMode(false);
      setDisablePassword('');
      setDisableCode('');
      setStatus(data.two_factor);
      setSuccess('2FA wurde erfolgreich deaktiviert.');
    } catch (_err) {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoadingDisable(false);
    }
  };

  // Fetch trusted devices
  const handleShowDevices = async () => {
    setShowDevices(true);
    setLoadingDevices(true);

    try {
      const token = getToken();
      const response = await fetch('/api/two-factor/trusted-devices', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrustedDevices(data.trusted_devices || []);
      }
    } catch (err) {
      console.error('Failed to fetch trusted devices:', err);
    } finally {
      setLoadingDevices(false);
    }
  };

  // Remove trusted device
  const handleRemoveDevice = async (deviceId: string) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/two-factor/trusted-devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrustedDevices(data.trusted_devices || []);
        fetchStatus();
      }
    } catch (err) {
      console.error('Failed to remove device:', err);
    }
  };

  // Remove all devices
  const handleRemoveAllDevices = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/two-factor/trusted-devices', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setTrustedDevices([]);
        fetchStatus();
      }
    } catch (err) {
      console.error('Failed to remove all devices:', err);
    }
  };

  // Regenerate recovery codes
  const handleRegenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRegenerate(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch('/api/two-factor/regenerate-recovery-codes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: regeneratePassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Fehler beim Generieren neuer Codes');
        return;
      }

      setNewRecoveryCodes(data.recovery_codes);
      setRegeneratePassword('');
      fetchStatus();
    } catch (_err) {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoadingRegenerate(false);
    }
  };

  // Copy recovery codes to clipboard
  const handleCopyCodes = (codes: string[]) => {
    const text = codes.join('\n');
    navigator.clipboard.writeText(text);
    setSuccess('Backup-Codes wurden in die Zwischenablage kopiert.');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && <Message severity="error" text={error} className="w-full" />}
      {success && <Message severity="success" text={success} className="w-full" />}

      {/* Status Card */}
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}
      >
        <div className="flex items-center gap-3 mb-4">
          <i
            className={`pi ${status?.enabled ? 'pi-shield' : 'pi-shield'} text-2xl`}
            style={{ color: status?.enabled ? '#22c55e' : colors.textSecondary }}
          />
          <div>
            <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
              Zwei-Faktor-Authentifizierung (2FA)
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {status?.enabled
                ? 'Ihr Konto ist durch 2FA geschützt.'
                : 'Fügen Sie eine zusätzliche Sicherheitsebene hinzu.'}
            </p>
          </div>
        </div>

        {status?.enabled ? (
          <div className="space-y-3">
            {/* Status Info */}
            <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
              <i className="pi pi-check-circle" style={{ color: '#22c55e' }} />
              <span>Aktiviert seit {new Date(status.confirmed_at!).toLocaleDateString('de-DE')}</span>
            </div>

            <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
              <i className="pi pi-key" />
              <span>{status.recovery_codes_count} Backup-Codes verfügbar</span>
              {status.recovery_codes_count < 3 && (
                <span className="text-orange-500 ml-2">(Empfohlen: Neue Codes generieren)</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
              <i className="pi pi-desktop" />
              <span>{status.trusted_devices_count} vertrauenswürdige Geräte</span>
            </div>

            {/* Action Buttons */}
            <Divider />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                label="Backup-Codes erneuern"
                icon="pi pi-refresh"
                className="p-button-outlined"
                size="small"
                onClick={() => {
                  setShowRegenerateCodes(true);
                  setRegeneratePassword('');
                  setNewRecoveryCodes([]);
                }}
              />
              <Button
                type="button"
                label="Geräte verwalten"
                icon="pi pi-desktop"
                className="p-button-outlined"
                size="small"
                onClick={handleShowDevices}
              />
              <Button
                type="button"
                label="2FA deaktivieren"
                icon="pi pi-times"
                className="p-button-outlined p-button-danger"
                size="small"
                onClick={() => {
                  setDisableMode(true);
                  setDisablePassword('');
                  setDisableCode('');
                }}
              />
            </div>
          </div>
        ) : (
          <Button
            type="button"
            label="2FA aktivieren"
            icon="pi pi-shield"
            className="p-button-success"
            onClick={handleStartSetup}
          />
        )}
      </div>

      {/* Info Box */}
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}
      >
        <h4 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>
          <i className="pi pi-info-circle mr-2" />
          Wie funktioniert 2FA?
        </h4>
        <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
          <li>
            <strong>1.</strong> Installieren Sie eine Authenticator-App (Google Authenticator, Authy, Microsoft Authenticator)
          </li>
          <li>
            <strong>2.</strong> Scannen Sie den QR-Code oder geben Sie den Schlüssel manuell ein
          </li>
          <li>
            <strong>3.</strong> Bei jedem Login geben Sie zusätzlich zum Passwort einen 6-stelligen Code ein
          </li>
          <li>
            <strong>4.</strong> Sie können Geräte als "vertrauenswürdig" markieren (30 Tage gültig)
          </li>
        </ul>
      </div>

      {/* Setup Dialog */}
      <Dialog
        header="2FA einrichten"
        visible={setupMode}
        onHide={handleCancelSetup}
        style={{ width: '450px' }}
        modal
        closable={setupStep !== 'recovery'}
        closeOnEscape={setupStep !== 'recovery'}
      >
        {setupStep === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <p style={{ color: colors.textSecondary }}>
              Bestätigen Sie Ihr Passwort, um fortzufahren.
            </p>
            <div className="field">
              <label className="block text-sm font-medium mb-2">Passwort</label>
              <Password
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                inputClassName="w-full"
                feedback={false}
                toggleMask
                required
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                label="Abbrechen"
                className="p-button-text"
                onClick={handleCancelSetup}
              />
              <Button
                type="submit"
                label="Weiter"
                icon={loadingSetup ? 'pi pi-spinner pi-spin' : 'pi pi-arrow-right'}
                disabled={loadingSetup || !password}
              />
            </div>
          </form>
        )}

        {setupStep === 'qr' && (
          <div className="space-y-4">
            <p style={{ color: colors.textSecondary }}>
              Scannen Sie diesen QR-Code mit Ihrer Authenticator-App:
            </p>
            <div
              className="flex justify-center p-4 rounded-lg"
              style={{ backgroundColor: '#ffffff' }}
              dangerouslySetInnerHTML={{ __html: qrCodeSvg || '' }}
            />
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                Oder geben Sie diesen Code manuell ein:
              </p>
              <code
                className="block p-2 rounded text-sm font-mono select-all"
                style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
              >
                {secret}
              </code>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                label="Abbrechen"
                className="p-button-text"
                onClick={handleCancelSetup}
              />
              <Button
                type="button"
                label="Weiter"
                icon="pi pi-arrow-right"
                onClick={handleContinueToVerify}
              />
            </div>
          </div>
        )}

        {setupStep === 'verify' && (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <p style={{ color: colors.textSecondary }}>
              Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein:
            </p>
            <div className="field">
              <InputText
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full text-center text-2xl tracking-widest"
                style={{ letterSpacing: '0.5em' }}
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
            </div>
            {error && <Message severity="error" text={error} className="w-full" />}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                label="Zurück"
                className="p-button-text"
                onClick={() => setSetupStep('qr')}
              />
              <Button
                type="submit"
                label="Verifizieren"
                icon={loadingSetup ? 'pi pi-spinner pi-spin' : 'pi pi-check'}
                disabled={loadingSetup || verifyCode.length !== 6}
              />
            </div>
          </form>
        )}

        {setupStep === 'recovery' && (
          <div className="space-y-4">
            <Message
              severity="success"
              text="2FA wurde erfolgreich aktiviert!"
              className="w-full"
            />
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}
            >
              <h4 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>
                <i className="pi pi-key mr-2" />
                Backup-Codes
              </h4>
              <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                Speichern Sie diese Codes sicher. Sie können jeden Code einmal verwenden, falls Sie keinen Zugriff auf Ihre Authenticator-App haben.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {recoveryCodes.map((code, index) => (
                  <code
                    key={index}
                    className="p-2 text-center rounded font-mono text-sm"
                    style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
                  >
                    {code}
                  </code>
                ))}
              </div>
              <Button
                type="button"
                label="Codes kopieren"
                icon="pi pi-copy"
                className="p-button-outlined w-full"
                size="small"
                onClick={() => handleCopyCodes(recoveryCodes)}
              />
            </div>
            <Message
              severity="warn"
              text="Hinweis: Diese Codes werden nur einmal angezeigt. Speichern Sie sie jetzt!"
              className="w-full"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                label="Fertig"
                icon="pi pi-check"
                className="p-button-success"
                onClick={handleFinishSetup}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Disable Dialog */}
      <Dialog
        header="2FA deaktivieren"
        visible={disableMode}
        onHide={() => setDisableMode(false)}
        style={{ width: '400px' }}
        modal
      >
        <form onSubmit={handleDisable} className="space-y-4">
          <Message
            severity="warn"
            text="Warnung: Das Deaktivieren von 2FA verringert die Sicherheit Ihres Kontos."
            className="w-full"
          />
          <div className="field">
            <label className="block text-sm font-medium mb-2">Passwort</label>
            <Password
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              className="w-full"
              inputClassName="w-full"
              feedback={false}
              toggleMask
              required
            />
          </div>
          <div className="field">
            <label className="block text-sm font-medium mb-2">
              Authenticator-Code oder Backup-Code
            </label>
            <InputText
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.toUpperCase())}
              className="w-full"
              placeholder="6-stelliger Code oder Backup-Code"
              required
            />
          </div>
          {error && <Message severity="error" text={error} className="w-full" />}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              label="Abbrechen"
              className="p-button-text"
              onClick={() => setDisableMode(false)}
            />
            <Button
              type="submit"
              label="2FA deaktivieren"
              icon={loadingDisable ? 'pi pi-spinner pi-spin' : 'pi pi-times'}
              className="p-button-danger"
              disabled={loadingDisable || !disablePassword || !disableCode}
            />
          </div>
        </form>
      </Dialog>

      {/* Trusted Devices Dialog */}
      <Dialog
        header="Vertrauenswürdige Geräte"
        visible={showDevices}
        onHide={() => setShowDevices(false)}
        style={{ width: '500px' }}
        modal
      >
        {loadingDevices ? (
          <div className="flex justify-center p-4">
            <ProgressSpinner style={{ width: '40px', height: '40px' }} />
          </div>
        ) : trustedDevices.length === 0 ? (
          <p style={{ color: colors.textSecondary }}>
            Keine vertrauenswürdigen Geräte vorhanden.
          </p>
        ) : (
          <div className="space-y-4">
            {trustedDevices.map((device) => (
              <div
                key={device.device_id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: colors.bgTertiary }}
              >
                <div>
                  <div className="font-medium" style={{ color: colors.textPrimary }}>
                    <i className="pi pi-desktop mr-2" />
                    {device.browser}
                  </div>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>
                    IP: {device.ip}
                  </div>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>
                    Gültig bis: {new Date(device.trusted_until).toLocaleDateString('de-DE')}
                  </div>
                </div>
                <Button
                  type="button"
                  icon="pi pi-trash"
                  className="p-button-text p-button-danger"
                  onClick={() => handleRemoveDevice(device.device_id)}
                />
              </div>
            ))}
            <Divider />
            <Button
              type="button"
              label="Alle Geräte entfernen"
              icon="pi pi-trash"
              className="p-button-outlined p-button-danger w-full"
              onClick={handleRemoveAllDevices}
            />
          </div>
        )}
      </Dialog>

      {/* Regenerate Codes Dialog */}
      <Dialog
        header="Neue Backup-Codes generieren"
        visible={showRegenerateCodes}
        onHide={() => {
          setShowRegenerateCodes(false);
          setNewRecoveryCodes([]);
        }}
        style={{ width: '450px' }}
        modal
      >
        {newRecoveryCodes.length === 0 ? (
          <form onSubmit={handleRegenerateCodes} className="space-y-4">
            <Message
              severity="warn"
              text="Alle bisherigen Backup-Codes werden ungültig!"
              className="w-full"
            />
            <div className="field">
              <label className="block text-sm font-medium mb-2">Passwort bestätigen</label>
              <Password
                value={regeneratePassword}
                onChange={(e) => setRegeneratePassword(e.target.value)}
                className="w-full"
                inputClassName="w-full"
                feedback={false}
                toggleMask
                required
                autoFocus
              />
            </div>
            {error && <Message severity="error" text={error} className="w-full" />}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                label="Abbrechen"
                className="p-button-text"
                onClick={() => setShowRegenerateCodes(false)}
              />
              <Button
                type="submit"
                label="Neue Codes generieren"
                icon={loadingRegenerate ? 'pi pi-spinner pi-spin' : 'pi pi-refresh'}
                disabled={loadingRegenerate || !regeneratePassword}
              />
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Message
              severity="success"
              text="Neue Backup-Codes wurden generiert!"
              className="w-full"
            />
            <div className="grid grid-cols-2 gap-2">
              {newRecoveryCodes.map((code, index) => (
                <code
                  key={index}
                  className="p-2 text-center rounded font-mono text-sm"
                  style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
                >
                  {code}
                </code>
              ))}
            </div>
            <Button
              type="button"
              label="Codes kopieren"
              icon="pi pi-copy"
              className="p-button-outlined w-full"
              onClick={() => handleCopyCodes(newRecoveryCodes)}
            />
            <Message
              severity="warn"
              text="Diese Codes werden nur einmal angezeigt. Speichern Sie sie jetzt!"
              className="w-full"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                label="Fertig"
                icon="pi pi-check"
                onClick={() => {
                  setShowRegenerateCodes(false);
                  setNewRecoveryCodes([]);
                }}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
