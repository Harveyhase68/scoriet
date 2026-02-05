import React, { useState, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { SupportedLanguage, supportedLanguages, getStoredLanguage, useTranslation } from '@/i18n';
import CSSFlag from '@/Components/CSSFlag';

interface RegisterModalProps {
  visible: boolean;
  onHide: () => void;
  onSwitchToLogin: () => void;
  onRegistrationSuccess?: (message: string) => void;
  currentLanguage?: SupportedLanguage;
  inviteToken?: string | null;
}

interface InviteInfo {
  valid: boolean;
  email?: string;
  name?: string;
  expires_at?: string;
  error?: string;
}

export default function RegisterModal({
  visible,
  onHide,
  onSwitchToLogin,
  onRegistrationSuccess,
  currentLanguage,
  inviteToken
}: RegisterModalProps) {

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    language: currentLanguage || getStoredLanguage() // Use current lobby language or detect browser language
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Registration status and invite validation
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(() => getStoredLanguage());
  const { t } = useTranslation(selectedLanguage);

  // Honeypot CAPTCHA - hidden field that bots will fill out
  const honeypotNumbers = useMemo(() => ({
    a: Math.floor(Math.random() * 4) + 2, // 2-5
    b: Math.floor(Math.random() * 4) + 2, // 2-5
  }), []);
  const [honeypotValue, setHoneypotValue] = useState('');

  // Update language when currentLanguage prop changes
  React.useEffect(() => {
    if (currentLanguage && visible) {
      setFormData(prev => ({
        ...prev,
        language: currentLanguage
      }));
      setSelectedLanguage(currentLanguage);
    }
  }, [currentLanguage, visible]);

  // Check registration status and validate invite token when modal opens
  React.useEffect(() => {
    if (visible) {
      const checkRegistration = async () => {
        setCheckingStatus(true);
        try {
          // Check registration status
          const statusResponse = await fetch('/api/registration/status', {
            headers: { 'Accept': 'application/json' }
          });
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            setRegistrationOpen(statusData.registration_open ?? true);
          }

          // Validate invite token if provided
          const tokenToCheck = inviteToken || new URLSearchParams(window.location.search).get('invite');
          if (tokenToCheck) {
            const tokenResponse = await fetch('/api/registration/validate-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({ token: tokenToCheck })
            });
            const tokenData = await tokenResponse.json();
            setInviteInfo(tokenData);

            // Pre-fill email and name if valid
            if (tokenData.valid) {
              setFormData(prev => ({
                ...prev,
                email: tokenData.email || prev.email,
                name: tokenData.name || prev.name
              }));
            }
          }
        } catch {
          // On error, assume registration is open
          setRegistrationOpen(true);
        } finally {
          setCheckingStatus(false);
        }
      };

      checkRegistration();
    }
  }, [visible, inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Honeypot check - if filled, it's a bot
    // Show fake success and do nothing
    if (honeypotValue !== '') {
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (onRegistrationSuccess) {
        onRegistrationSuccess(t.registermodal94);
      }
      handleHide();
      return; // Don't actually register
    }

    // Check password confirmation
    if (formData.password !== formData.password_confirmation) {
      setError(t.registermodal58);
      setLoading(false);
      return;
    }

    try {
      // Get invite token from prop or URL
      const tokenToUse = inviteToken || new URLSearchParams(window.location.search).get('invite');

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.password_confirmation,
          language: formData.language,
          math_check: honeypotValue, // Send to backend for double-check
          invite_token: tokenToUse, // Include invite token if present
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Display the user-friendly message from the backend
        setError(errorData.message || t.registermodal84);
        setLoading(false);
        return;
      }

      const registrationData = await response.json();

      // Prepare success message
      let successMessage = '';
      if (registrationData.email_verification_required) {
        successMessage = t.registermodal94;
      } else {
        //const userId = registrationData.user?.id;
        successMessage = t.registermodal109;
      }

      // Call callback FIRST (before closing modal)
      if (onRegistrationSuccess) {
        onRegistrationSuccess(successMessage);
      }

      // Then close modal
      handleHide();
      
    } catch (error) {
      setError(error instanceof Error ? error.message : t.registermodal109);
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
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      password_confirmation: '',
      language: selectedLanguage || getStoredLanguage() // Keep the current lobby language or detected/stored language
    });
    setHoneypotValue(''); // Reset honeypot
    setError('');
    setSuccess('');
    setLoading(false);
    setInviteInfo(null); // Reset invite info
    setRegistrationOpen(null); // Reset registration status
    setCheckingStatus(false);
    onHide();
  };

  return (
    <>
      <style>{`
        /* Language dropdown specific styles - DARK THEME */
        .language-dropdown-panel {
          max-height: 240px !important;
          overflow-y: auto !important;
          z-index: 9999 !important;
          background: #374151 !important;
          border: 1px solid #4b5563 !important;
          border-radius: 6px !important;
        }

        .language-dropdown-panel .p-dropdown-items {
          padding: 0 !important;
          background: #374151 !important;
        }

        .language-dropdown-panel .p-dropdown-item {
          padding: 0.75rem 1rem !important;
          min-height: 48px !important;
          height: auto !important;
          display: flex !important;
          align-items: center !important;
          border: none !important;
          border-bottom: 1px solid #4b5563 !important;
          background: #374151 !important;
          color: #f3f4f6 !important;
          transition: background-color 0.2s ease !important;
        }

        .language-dropdown-panel .p-dropdown-item:last-child {
          border-bottom: none !important;
        }

        .language-dropdown-panel .p-dropdown-item:hover {
          background-color: #4b5563 !important;
          color: #ffffff !important;
        }

        .language-dropdown-panel .p-dropdown-item:focus {
          background-color: #1f2937 !important;
          color: #60a5fa !important;
          outline: none !important;
        }

        .language-dropdown-panel .p-dropdown-item.p-highlight {
          background-color: #1e40af !important;
          color: #ffffff !important;
        }

        /* Ensure flag icons are visible */
        .flag-icon-simple {
          display: inline-block !important;
          font-style: normal !important;
          font-variant: normal !important;
          text-rendering: optimizeLegibility !important;
          line-height: 1 !important;
          font-family: system-ui, -apple-system, "Segoe UI", "Apple Color Emoji", "Segoe UI Emoji", sans-serif !important;
          min-width: 18px !important;
          text-align: center !important;
          user-select: none !important;
          vertical-align: middle !important;
        }
      `}</style>
      <Dialog
        header={t.registermodal203}
        visible={visible}
        onHide={handleHide}
        style={{ width: '450px' }}
        modal
        closable
        draggable={true}
        resizable={true}
        className="p-dialog-custom"
      >
      {/* Loading state while checking registration status */}
      {checkingStatus && (
        <div className="flex items-center justify-center py-8">
          <i className="pi pi-spinner pi-spin text-2xl mr-3"></i>
          <span>Checking registration status...</span>
        </div>
      )}

      {/* Registration closed message (no valid invite) */}
      {!checkingStatus && registrationOpen === false && (!inviteInfo || !inviteInfo.valid) && (
        <div className="space-y-4">
          <Message
            severity="warn"
            text="Registration is currently by invitation only. Please contact an administrator to request an invite."
            className="w-full"
          />
          {inviteInfo && inviteInfo.error && (
            <Message
              severity="error"
              text={inviteInfo.error}
              className="w-full"
            />
          )}
          <div className="text-center pt-4">
            <Button
              type="button"
              label={t.authmodalsegistermodal388}
              className="p-button-link p-button-sm"
              onClick={() => {
                handleHide();
                onSwitchToLogin();
              }}
            />
          </div>
        </div>
      )}

      {/* Registration form (open registration OR valid invite) */}
      {!checkingStatus && (registrationOpen === true || (inviteInfo && inviteInfo.valid)) && (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Valid invite banner */}
        {inviteInfo && inviteInfo.valid && (
          <Message
            severity="success"
            text={`You have been invited to join! Your invite expires on ${new Date(inviteInfo.expires_at!).toLocaleDateString()}.`}
            className="w-full"
          />
        )}

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
            placeholder={t.authmodalsegistermodal239}
            className="w-full"
            disabled={loading}
            required
            autoComplete="name"
          />
        </div>

        <div className="field">
          <label htmlFor="register-username" className="block text-sm font-medium mb-2">
            Username (Nickname)
          </label>
          <InputText
            id="register-username"
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
            placeholder={t.registermodal261}
            className="w-full"
            disabled={loading}
            required
            maxLength={30}
            autoComplete="username"
          />
          <small className="text-gray-500">
            Only lowercase letters, numbers, underscores, and hyphens. Cannot be changed later.
          </small>
        </div>

        <div className="field">
          <label htmlFor="register-email" className="block text-sm font-medium mb-2">
            E-Mail {inviteInfo?.valid && <span className="text-gray-500">(from invite)</span>}
          </label>
          <InputText
            id="register-email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder={t.forgotpasswordmodal113}
            className="w-full"
            disabled={loading || (inviteInfo?.valid && !!inviteInfo.email)}
            required
            autoComplete="email"
          />
          {inviteInfo?.valid && inviteInfo.email && (
            <small className="text-gray-500">Email is locked to the invite address.</small>
          )}
        </div>

        <div className="field">
          <label htmlFor="register-password" className="block text-sm font-medium mb-2">
            Passwort
          </label>
          <Password
            id="register-password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder={t.authmodalsegistermodal293}
            className="w-full"
            inputClassName="w-full"
            disabled={loading}
            feedback={true}
            toggleMask
            required
            autoComplete="new-password"
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
            placeholder={t.authmodalsegistermodal312}
            className="w-full"
            inputClassName="w-full"
            disabled={loading}
            feedback={false}
            toggleMask
            required
            autoComplete="new-password"
          />
        </div>

        {/* Honeypot field - hidden from humans, visible to bots */}
        <div
          style={{
            position: 'absolute',
            left: '-9999px',
            opacity: 0,
            height: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <label htmlFor="register-math-check">
            Sicherheitsfrage: Wieviel ist {honeypotNumbers.a} + {honeypotNumbers.b}?
          </label>
          <InputText
            id="register-math-check"
            name="math_verification"
            type="text"
            value={honeypotValue}
            onChange={(e) => setHoneypotValue(e.target.value)}
            placeholder="Ihre Antwort"
            autoComplete="off"
            tabIndex={-1}
          />
        </div>

        <div className="field">
          <label htmlFor="register-language" className="block text-sm font-medium mb-2">
            Preferred Language
          </label>
          <Dropdown
            id="register-language"
            value={formData.language}
            onChange={(e) => handleInputChange('language', e.value)}
            options={supportedLanguages.map(lang => ({
              label: lang.nativeName,
              value: lang.code
            }))}
            placeholder={t.authmodalsegistermodal335}
            className="w-full"
            disabled={loading}
            itemTemplate={(option: any) => {
              const lang = supportedLanguages.find(l => l.code === option.value);
              return (
                <div className="flex items-center w-full" style={{ minHeight: '48px', padding: '0.75rem 1rem' }}>
                  <span className="mr-3 flex-shrink-0" style={{ width: '20px', textAlign: 'center' }}>
                    <CSSFlag country={option.value === 'en' ? 'us' : option.value} size="md" />
                  </span>
                  <span className="text-sm font-medium text-gray-100">{lang?.nativeName}</span>
                </div>
              );
            }}
            valueTemplate={(selectedOption: any) => {
              if (!selectedOption) {
                return <span className="text-sm text-gray-500">Select Language</span>;
              }

              // Extract the actual value from the option object
              const languageCode = selectedOption.value || selectedOption;
              const lang = supportedLanguages.find(l => l.code === languageCode);

              return lang ? (
                <div className="flex items-center py-2">
                  <span className="mr-2 flex-shrink-0" style={{ width: '18px', textAlign: 'center' }}>
                    <CSSFlag country={lang.code === 'en' ? 'us' : lang.code} size="sm" />
                  </span>
                  <span className="text-sm font-medium">{lang.nativeName}</span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Select Language</span>
              );
            }}
            panelClassName="language-dropdown-panel"
            dropdownIcon="pi pi-chevron-down"
          />
          <small className="text-gray-500">
            This will be your default language in the application.
          </small>
        </div>

        <Button
          type="submit"
          label={loading ? t.registermodal379 : t.authmodalsegistermodal203}
          icon={loading ? "pi pi-spinner pi-spin" : "pi pi-user-plus"}
          className="w-full"
          disabled={loading}
        />

        <div className="text-center mt-4">
          <Button
            type="button"
            label={t.authmodalsegistermodal388}
            className="p-button-link p-button-sm"
            onClick={() => {
              handleHide();
              onSwitchToLogin();
            }}
          />
        </div>
      </form>
      )}
    </Dialog>
    </>
  );
}