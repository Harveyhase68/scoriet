import React, { useState, useEffect, useCallback } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Message } from 'primereact/message';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Divider } from 'primereact/divider';
import { Checkbox } from 'primereact/checkbox';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { generateDeviceId, getBrowserInfo } from './TwoFactorVerifyDialog';
import { apiClient } from '@/lib/api';
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
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t: t } = useTranslation(currentLanguage);

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
  const [setupTrustDevice, setSetupTrustDevice] = useState(true);
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

  // Fetch 2FA status
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/two-factor/status');
      setStatus(data.two_factor);
    } catch (err) {
      console.error(t.twofactorsection94, err);
    } finally {
      setLoading(false);
    }
  }, []);

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
      let data: any;
      try {
        data = await apiClient.post('/two-factor/enable', { password });
      } catch (err: any) {
        setError(err?.response?.data?.message || t.twofactorsection146);
        return;
      }
      setQrCodeSvg(data.qr_code_svg);
      setSecret(data.secret);
      setSetupStep('qr');
    } catch (_err) {
      setError(t.twofactorsection154);
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
      let data: any;
      try {
        data = await apiClient.post('/two-factor/confirm', {
          code: verifyCode,
          trust_device: setupTrustDevice,
          device_id: setupTrustDevice ? generateDeviceId() : undefined,
          browser: setupTrustDevice ? getBrowserInfo() : undefined,
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || t.twofactorsection187);
        return;
      }

      setRecoveryCodes(data.recovery_codes);
      setStatus(data.two_factor);
      setSetupStep('recovery');
    } catch (_err) {
      setError(t.twofactorsection195);
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
    setSetupTrustDevice(true);
    setRecoveryCodes([]);
    setSuccess(t.twofactorsection210);
    fetchStatus();
  };

  // Cancel setup
  const handleCancelSetup = async () => {
    try {
      await apiClient.post('/two-factor/cancel-setup');
    } catch (_err) {
      // Ignore errors
    }

    setSetupMode(false);
    setSetupStep('password');
    setPassword('');
    setQrCodeSvg(null);
    setSecret(null);
    setVerifyCode('');
    setSetupTrustDevice(true);
  };

  // Disable 2FA
  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingDisable(true);
    setError(null);

    try {
      let data: any;
      try {
        data = await apiClient.post('/two-factor/disable', {
          password: disablePassword,
          code: disableCode,
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || t.twofactorsection261);
        return;
      }

      setDisableMode(false);
      setDisablePassword('');
      setDisableCode('');
      setStatus(data.two_factor);
      setSuccess(t.twofactorsection269);
    } catch (_err) {
      setError(t.twofactorsection271);
    } finally {
      setLoadingDisable(false);
    }
  };

  // Fetch trusted devices
  const handleShowDevices = async () => {
    setShowDevices(true);
    setLoadingDevices(true);

    try {
      const data = await apiClient.get('/two-factor/trusted-devices');
      setTrustedDevices(data.trusted_devices || []);
    } catch (err) {
      console.error(t.twofactorsection296, err);
    } finally {
      setLoadingDevices(false);
    }
  };

  // Remove trusted device
  const handleRemoveDevice = async (deviceId: string) => {
    try {
      const data = await apiClient.delete(`/two-factor/trusted-devices/${deviceId}`);
      setTrustedDevices(data.trusted_devices || []);
      fetchStatus();
    } catch (err) {
      console.error(t.twofactorsection320, err);
    }
  };

  // Remove all devices
  const handleRemoveAllDevices = async () => {
    try {
      await apiClient.delete('/two-factor/trusted-devices');
      setTrustedDevices([]);
      fetchStatus();
    } catch (err) {
      console.error(t.twofactorsection341, err);
    }
  };

  // Regenerate recovery codes
  const handleRegenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRegenerate(true);
    setError(null);

    try {
      let data: any;
      try {
        data = await apiClient.post('/two-factor/regenerate-recovery-codes', {
          password: regeneratePassword,
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || t.twofactorsection366);
        return;
      }

      setNewRecoveryCodes(data.recovery_codes);
      setRegeneratePassword('');
      fetchStatus();
    } catch (_err) {
      setError(t.twofactorsection374);
    } finally {
      setLoadingRegenerate(false);
    }
  };

  // Copy recovery codes to clipboard
  const handleCopyCodes = (codes: string[]) => {
    const text = codes.join('\n');
    navigator.clipboard.writeText(text);
    setSuccess(t.twofactorsection384);
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
              {t.twofactorsection410}
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {status?.enabled
                ? t.twofactorsection418
                : t.twofactorsection419}
            </p>
          </div>
        </div>

        {status?.enabled ? (
          <div className="space-y-3">
            {/* Status Info */}
            <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
              <i className="pi pi-check-circle" style={{ color: '#22c55e' }} />
              <span>{t.twofactorsection429}{new Date(status.confirmed_at!).toLocaleDateString(currentLanguage)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
              <i className="pi pi-key" />
              <span>{status.recovery_codes_count}{t.twofactorsection434}</span>
              {status.recovery_codes_count < 3 && (
                <span className="text-orange-500 ml-2">{t.twofactorsection436}</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
              <i className="pi pi-desktop" />
              <span>{status.trusted_devices_count}{t.twofactorsection442}</span>
            </div>

            {/* Action Buttons */}
            <Divider />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                label={t.twofactorsection450}
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
                label={t.twofactorsection462}
                icon="pi pi-desktop"
                className="p-button-outlined"
                size="small"
                onClick={handleShowDevices}
              />
              <Button
                type="button"
                label={t.twofactorsection470}
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
            label={t.twofactorsection485}
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
          {t.twofactorsection500}
        </h4>
        <ul className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
          <li>
            <strong>1.</strong>{t.twofactorsection504}
          </li>
          <li>
            <strong>2.</strong>{t.twofactorsection507}
          </li>
          <li>
            <strong>3.</strong>{t.twofactorsection510}
          </li>
          <li>
            <strong>4.</strong>{t.twofactorsection513}
          </li>
        </ul>
      </div>

      {/* Setup Dialog */}
      <Dialog
        header={t.twofactorsection520}
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
              {t.twofactorsection531}
            </p>
            <div className="field">
              <label className="block text-sm font-medium mb-2">{t.twofactorsection534}</label>
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
                label={t.twofactorsection549}
                className="p-button-text"
                onClick={handleCancelSetup}
              />
              <Button
                type="submit"
                label={t.twofactorsection555}
                icon={loadingSetup ? 'pi pi-spinner pi-spin' : 'pi pi-arrow-right'}
                disabled={loadingSetup || !password}
              />
            </div>
          </form>
        )}

        {setupStep === 'qr' && (
          <div className="space-y-4">
            <p style={{ color: colors.textSecondary }}>
              {t.twofactorsection566}
            </p>
            <div
              className="flex justify-center p-4 rounded-lg"
              style={{ backgroundColor: '#ffffff' }}
              dangerouslySetInnerHTML={{ __html: qrCodeSvg || '' }}
            />
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                {t.twofactorsection575}
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
                label={t.twofactorsection587}
                className="p-button-text"
                onClick={handleCancelSetup}
              />
              <Button
                type="button"
                label={t.twofactorsection593}
                icon="pi pi-arrow-right"
                onClick={handleContinueToVerify}
              />
            </div>
          </div>
        )}

        {setupStep === 'verify' && (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <p style={{ color: colors.textSecondary }}>
              {t.twofactorsection604}
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

            {/* Trust this browser - user has just proven physical access to their authenticator on this device */}
            <div className="flex items-start gap-2 py-2">
              <Checkbox
                inputId="setup-trust-device"
                checked={setupTrustDevice}
                onChange={(e) => setSetupTrustDevice(!!e.checked)}
              />
              <label htmlFor="setup-trust-device" className="text-sm cursor-pointer flex-1">
                <div className="font-medium" style={{ color: colors.textPrimary }}>
                  {t.twofactorsection_trust_device_label}
                </div>
                <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                  {t.twofactorsection_trust_device_hint}
                </div>
              </label>
            </div>

            {error && <Message severity="error" text={error} className="w-full" />}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                label={t.twofactorsection621}
                className="p-button-text"
                onClick={() => setSetupStep('qr')}
              />
              <Button
                type="submit"
                label={t.twofactorsection627}
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
              text={t.twofactorsection639}
              className="w-full"
            />
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}
            >
              <h4 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>
                <i className="pi pi-key mr-2" />
                {t.twofactorsection648}
              </h4>
              <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                {t.twofactorsection651}
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
                label={t.twofactorsection666}
                icon="pi pi-copy"
                className="p-button-outlined w-full"
                size="small"
                onClick={() => handleCopyCodes(recoveryCodes)}
              />
            </div>
            <Message
              severity="warn"
              text={t.twofactorsection675}
              className="w-full"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                label={t.twofactorsection681}
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
        header={t.twofactorsection693}
        visible={disableMode}
        onHide={() => setDisableMode(false)}
        style={{ width: '400px' }}
        modal
      >
        <form onSubmit={handleDisable} className="space-y-4">
          <Message
            severity="warn"
            text={t.twofactorsection702}
            className="w-full"
          />
          <div className="field">
            <label className="block text-sm font-medium mb-2">{t.twofactorsection706}</label>
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
              {t.twofactorsection719}
            </label>
            <InputText
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.toUpperCase())}
              className="w-full"
              placeholder={t.twofactorsection725}
              required
            />
          </div>
          {error && <Message severity="error" text={error} className="w-full" />}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              label={t.twofactorsection733}
              className="p-button-text"
              onClick={() => setDisableMode(false)}
            />
            <Button
              type="submit"
              label={t.twofactorsection739}
              icon={loadingDisable ? 'pi pi-spinner pi-spin' : 'pi pi-times'}
              className="p-button-danger"
              disabled={loadingDisable || !disablePassword || !disableCode}
            />
          </div>
        </form>
      </Dialog>

      {/* Trusted Devices Dialog */}
      <Dialog
        header={t.twofactorsection750}
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
            {t.twofactorsection762}
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
                    {t.twofactorsection781}{new Date(device.trusted_until).toLocaleDateString(currentLanguage)}
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
              label={t.twofactorsection795}
              icon="pi pi-trash"
              className="p-button-outlined p-button-danger w-full"
              onClick={handleRemoveAllDevices}
            />
          </div>
        )}
      </Dialog>

      {/* Regenerate Codes Dialog */}
      <Dialog
        header={t.twofactorsection806}
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
              text={t.twofactorsection819}
              className="w-full"
            />
            <div className="field">
              <label className="block text-sm font-medium mb-2">{t.twofactorsection823}</label>
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
                label={t.twofactorsection839}
                className="p-button-text"
                onClick={() => setShowRegenerateCodes(false)}
              />
              <Button
                type="submit"
                label={t.twofactorsection845}
                icon={loadingRegenerate ? 'pi pi-spinner pi-spin' : 'pi pi-refresh'}
                disabled={loadingRegenerate || !regeneratePassword}
              />
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Message
              severity="success"
              text={t.twofactorsection855}
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
              label={t.twofactorsection871}
              icon="pi pi-copy"
              className="p-button-outlined w-full"
              onClick={() => handleCopyCodes(newRecoveryCodes)}
            />
            <Message
              severity="warn"
              text={t.twofactorsection878}
              className="w-full"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                label={t.twofactorsection884}
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
