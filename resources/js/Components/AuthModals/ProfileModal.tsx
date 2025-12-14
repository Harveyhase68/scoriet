import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { Badge } from 'primereact/badge';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Divider } from 'primereact/divider';
import { Message } from 'primereact/message';
import { SupportedLanguage, supportedLanguages, getStoredLanguage, setStoredLanguage, useTranslation } from '@/i18n';
import CSSFlag from '@/Components/CSSFlag';
import PlanModal from '@/Components/AuthModals/PlanModal';

interface ProfileModalProps {
  visible: boolean;
  onHide: () => void;
  defaultTab?: number; // Tab index to open by default (0=Profile, 1=Password, 2=Subscriptions, 3=Plans, 4=Verkäufer, 5=Delete)
}

interface UserData {
  id?: number;
  name: string;
  username?: string;
  email: string;
  language?: string;
  email_verified_at?: string;
  created_at?: string;
  updated_at?: string;
  credits?: number;
  user_type?: string;
  // Seller fields
  is_seller?: boolean;
  company_name?: string;
  company_address?: string;
  company_country?: string;
  vat_id?: string;
  business_registration?: string;
  tax_id?: string;
  seller_type?: string;
  payout_method?: 'bank_transfer' | 'paypal';
  paypal_payout_email?: string;
  bank_iban?: string;
  bank_bic?: string;
  bank_account_holder?: string;
  seller_verified?: boolean;
  pending_earnings?: number;
  total_earnings?: number;
}

interface CliSubscriptionStatus {
  cli: {
    unlocked: boolean;
    expires_at: string | null;
    is_patron: boolean;
  };
  service: {
    unlocked: boolean;
    expires_at: string | null;
    is_patron: boolean;
  };
  credits: number;
  prices: {
    cli: number;
    service: number;
    bundle: number;
  };
}

export default function ProfileModal({ visible, onHide, defaultTab = 0 }: ProfileModalProps) {
  // Get current language for translations
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  // Listen for language changes from other components
  useEffect(() => {
    const handleLanguageChangeEvent = (event: CustomEvent) => {
      setCurrentLanguage(event.detail.language);
    };

    window.addEventListener('languageChanged', handleLanguageChangeEvent as EventListener);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChangeEvent as EventListener);
    };
  }, []);

  // Add CSS for dark theme dropdown styling
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .profile-language-dropdown-panel {
        background: #374151 !important;
        border: 1px solid #4b5563 !important;
        border-radius: 6px !important;
      }
      .profile-language-dropdown-panel .p-dropdown-item {
        background: transparent !important;
        color: #f3f4f6 !important;
        border: none !important;
        padding: 0 !important;
      }
      .profile-language-dropdown-panel .p-dropdown-item:hover {
        background: #4b5563 !important;
        color: #ffffff !important;
      }
      .profile-language-dropdown-panel .p-dropdown-item.p-highlight {
        background: #3b82f6 !important;
        color: #ffffff !important;
      }
      .profile-language-dropdown-panel .p-dropdown-item-group {
        background: #374151 !important;
        color: #9ca3af !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    language: getStoredLanguage()
  });

  // Create language options with our 5 languages
  const languageOptions = supportedLanguages.map(lang => ({
    label: lang.nativeName,
    value: lang.code
  }));
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });
  const [deleteData, setDeleteData] = useState({
    password: '',
    confirmText: ''
  });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [profileError, setProfileError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string>('');
  const [profileSuccess, setProfileSuccess] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<string>('');
  const [deleteSuccess, setDeleteSuccess] = useState<string>('');
  const [activeTabIndex, setActiveTabIndex] = useState<number>(defaultTab);

  // CLI/Service Subscription State
  const [cliStatus, setCliStatus] = useState<CliSubscriptionStatus | null>(null);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planModalTab, setPlanModalTab] = useState(0);

  // Seller Profile State
  const [sellerData, setSellerData] = useState({
    is_seller: false,
    company_name: '',
    company_address: '',
    company_country: '',
    vat_id: '',
    business_registration: '',
    tax_id: '',
    payout_method: '' as 'bank_transfer' | 'paypal' | '',
    paypal_payout_email: '',
    bank_iban: '',
    bank_bic: '',
    bank_account_holder: '',
  });
  const [savingSeller, setSavingSeller] = useState(false);
  const [sellerError, setSellerError] = useState<string>('');
  const [sellerSuccess, setSellerSuccess] = useState<string>('');

  // Country options for dropdown
  const countries = [
    { label: 'Österreich', value: 'AT' },
    { label: 'Deutschland', value: 'DE' },
    { label: 'Schweiz', value: 'CH' },
    { label: 'Frankreich', value: 'FR' },
    { label: 'Italien', value: 'IT' },
    { label: 'Spanien', value: 'ES' },
    { label: 'Niederlande', value: 'NL' },
    { label: 'Belgien', value: 'BE' },
    { label: 'Polen', value: 'PL' },
    { label: 'Tschechien', value: 'CZ' },
    { label: 'Ungarn', value: 'HU' },
    { label: 'Slowakei', value: 'SK' },
    { label: 'Slowenien', value: 'SI' },
    { label: 'Kroatien', value: 'HR' },
    { label: 'Rumänien', value: 'RO' },
    { label: 'Bulgarien', value: 'BG' },
    { label: 'Griechenland', value: 'GR' },
    { label: 'Portugal', value: 'PT' },
    { label: 'Schweden', value: 'SE' },
    { label: 'Dänemark', value: 'DK' },
    { label: 'Finnland', value: 'FI' },
    { label: 'Irland', value: 'IE' },
    { label: 'Luxemburg', value: 'LU' },
    { label: 'Malta', value: 'MT' },
    { label: 'Zypern', value: 'CY' },
    { label: 'Estland', value: 'EE' },
    { label: 'Lettland', value: 'LV' },
    { label: 'Litauen', value: 'LT' },
    { label: '--- Nicht-EU ---', value: '', disabled: true },
    { label: 'USA', value: 'US' },
    { label: 'Kanada', value: 'CA' },
    { label: 'Großbritannien', value: 'GB' },
    { label: 'Australien', value: 'AU' },
    { label: 'Japan', value: 'JP' },
    { label: 'Indien', value: 'IN' },
    { label: 'Brasilien', value: 'BR' },
    { label: 'Sonstiges', value: 'XX' },
  ];

  const payoutMethods = [
    { label: 'Banküberweisung (SEPA)', value: 'bank_transfer' },
    { label: 'PayPal', value: 'paypal' },
  ];

  // EU countries for VAT ID requirement check
  const euCountries = ['AT', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'PL', 'SE', 'DK', 'FI', 'IE', 'PT', 'GR', 'CZ', 'RO', 'HU', 'SK', 'BG', 'HR', 'SI', 'LT', 'LV', 'EE', 'CY', 'LU', 'MT'];
  const isEuCountry = euCountries.includes(sellerData.company_country);

  // Pricing from Settings
  const [_pricing, setPricing] = useState<{
    patron_annual: number;
    patron_monthly: number;
    credits_500: number;
    credits_1000: number;
    credits_2500: number;
  } | null>(null);

  const loadUserData = useCallback(async () => {
    try {
      // Check both localStorage and sessionStorage (demo mode uses sessionStorage)
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setProfileError(t.profilemodal115);
        return;
      }

      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t.profilemodal127);
      }

      const user = await response.json();

      // Use the language from database if available, otherwise fallback to stored language
      const userLanguage = user.language || getStoredLanguage();

      setUserData({
        ...user,
        language: userLanguage
      });

      // Load seller data
      setSellerData({
        is_seller: user.is_seller || false,
        company_name: user.company_name || '',
        company_address: user.company_address || '',
        company_country: user.company_country || '',
        vat_id: user.vat_id || '',
        business_registration: user.business_registration || '',
        tax_id: user.tax_id || '',
        payout_method: user.payout_method || '',
        paypal_payout_email: user.paypal_payout_email || '',
        bank_iban: user.bank_iban || '',
        bank_bic: user.bank_bic || '',
        bank_account_holder: user.bank_account_holder || '',
      });

      // Update stored language to user's preference
      if (user.language) {
        setStoredLanguage(user.language as SupportedLanguage);
        setCurrentLanguage(user.language as SupportedLanguage);
      }
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : t.profilemodal146);
    }
  }, []);

  // Load CLI/Service subscription status
  const loadCliStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/cli-subscriptions/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCliStatus(data);
      }
    } catch (err) {
      console.error('Error loading CLI status:', err);
    }
  }, []);

  // Handle unlock CLI/Service/Bundle
  const handleUnlock = async (type: 'cli' | 'service' | 'bundle') => {
    setUnlocking(type);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.profilemodal115);
      }

      const response = await fetch('/api/cli-subscriptions/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Freischalten');
      }

      // Reload status
      loadCliStatus();
      loadUserData();

    } catch (err) {
      console.error('Unlock error:', err);
    } finally {
      setUnlocking(null);
    }
  };

  // Handle buy credits - opens PlanModal on Credits tab
  const handleBuyCredits = () => {
    setPlanModalTab(1);
    setShowPlanModal(true);
  };

  // Handle view plans - opens PlanModal on Subscriptions tab
  const handleViewPlans = () => {
    setPlanModalTab(0);
    setShowPlanModal(true);
  };

  // Handle plan modal close
  const handlePlanModalClose = () => {
    setShowPlanModal(false);
    loadCliStatus();
    loadUserData();
  };

  // Handle seller profile submit
  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSeller(true);
    setSellerError('');
    setSellerSuccess('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.profilemodal115);
      }

      const response = await fetch('/api/profile/seller', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(sellerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Fehler beim Speichern der Verkäufer-Daten');
      }

      setSellerSuccess('Verkäufer-Profil erfolgreich gespeichert');
      loadUserData();

    } catch (err) {
      setSellerError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setSavingSeller(false);
    }
  };

  // Load pricing from settings
  const loadPricing = useCallback(async () => {
    try {
      const response = await fetch('/api/pricing', {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.prices) {
          setPricing(data.prices);
        }
      }
    } catch (err) {
      console.error('Error loading pricing:', err);
    }
  }, []);

  // Load user data when opening and reset tab index
  useEffect(() => {
    if (visible) {
      loadUserData();
      loadCliStatus();
      loadPricing();
      setActiveTabIndex(defaultTab); // Reset to defaultTab when modal opens
    }
  }, [visible, loadUserData, loadCliStatus, loadPricing, defaultTab]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.profilemodal115);
      }

      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          language: userData.language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t.profilemodal186);
      }

      setProfileSuccess(t.profileUpdateSuccess);

      // Automatisch schließen nach 1.5 Sekunden
      setTimeout(() => {
        handleHide();
      }, 500);

    } catch (error) {
      setProfileError(error instanceof Error ? error.message : t.profilemodal197);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Handle language change immediately
  const handleLanguageChange = async (language: SupportedLanguage) => {
    setUserData(prev => ({ ...prev, language }));

    try {
      // Update stored language immediately
      setStoredLanguage(language);
      // Update current language for immediate UI update
      setCurrentLanguage(language);

      // Notify all components about language change
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));

      // Also save to backend
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (token) {
        await fetch('/api/profile/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            name: userData.name,
            email: userData.email,
            language
          }),
        });
      }
    } catch {
      // Failed to update language
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    // Check password confirmation
    if (passwordData.password !== passwordData.password_confirmation) {
      setPasswordError(t.profilemodal246);
      setLoadingPassword(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.profilemodal115);
      }

      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          password: passwordData.password,
          password_confirmation: passwordData.password_confirmation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t.profilemodal273);
      }

      setPasswordSuccess(t.passwordChangeSuccess);
      setPasswordData({ current_password: '', password: '', password_confirmation: '' });
      
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : t.authmodalsegistermodal109);
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleProfileInputChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    if (profileError) setProfileError('');
    if (profileSuccess) setProfileSuccess('');
  };

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (passwordError) setPasswordError('');
    if (passwordSuccess) setPasswordSuccess('');
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingDelete(true);
    setDeleteError('');
    setDeleteSuccess('');

    // Check confirmation text
    if (deleteData.confirmText !== t.profilemodal305) {
      setDeleteError('Sie müssen t.profilemodal305 eingeben, um Ihren Account zu löschen');
      setLoadingDelete(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.profilemodal115);
      }

      const response = await fetch('/api/profile/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          password: deleteData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t.authcontroller492);
      }

      setDeleteSuccess(t.profilemodal334);
      
      // Clear tokens and reload page after 2 seconds
      setTimeout(() => {
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('refresh_token');
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : t.authmodalsegistermodal109);
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleDeleteInputChange = (field: string, value: string) => {
    setDeleteData(prev => ({ ...prev, [field]: value }));
    if (deleteError) setDeleteError('');
    if (deleteSuccess) setDeleteSuccess('');
  };

  const handleHide = () => {
    // Only reset form fields that should be cleared, keep user data loaded
    setPasswordData({ current_password: '', password: '', password_confirmation: '' });
    setDeleteData({ password: '', confirmText: '' });
    setProfileError('');
    setPasswordError('');
    setDeleteError('');
    setProfileSuccess('');
    setPasswordSuccess('');
    setDeleteSuccess('');
    setLoadingProfile(false);
    setLoadingPassword(false);
    setLoadingDelete(false);
    onHide();
  };

  return (
    <Dialog
      header={t.profileTitle}
      visible={visible}
      onHide={handleHide}
      style={{ width: '1000px' }}
      modal
      closable
      draggable={true}
      resizable={true}
      className="p-dialog-custom"
    >
      <TabView activeIndex={activeTabIndex} onTabChange={(e) => setActiveTabIndex(e.index)}>
        <TabPanel header={t.profileTab} leftIcon="pi pi-user">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileError && (
              <Message 
                severity="error" 
                text={profileError} 
                className="w-full"
              />
            )}

            {profileSuccess && (
              <Message 
                severity="success" 
                text={profileSuccess} 
                className="w-full"
              />
            )}

            <div className="field">
              <label htmlFor="profile-userid" className="block text-sm font-medium mb-2">
                User ID
              </label>
              <InputText
                id="profile-userid"
                type="text"
                value={userData.id?.toString() || ''}
                className="w-full"
                disabled={true}
                readOnly={true}
                style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
              />
            </div>

            <div className="field">
              <label htmlFor="profile-username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <InputText
                id="profile-username"
                type="text"
                value={userData.username || ''}
                className="w-full"
                disabled={true}
                readOnly={true}
                style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
              />
              <small className="text-gray-500">
                {t.profilemodal510}
              </small>
            </div>

            <div className="field">
              <label htmlFor="profile-name" className="block text-sm font-medium mb-2">
                {t.fullName}
              </label>
              <InputText
                id="profile-name"
                type="text"
                value={userData.name}
                onChange={(e) => handleProfileInputChange('name', e.target.value)}
                placeholder={t.authmodalsegistermodal239}
                className="w-full"
                disabled={loadingProfile}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="profile-email" className="block text-sm font-medium mb-2">
                {t.emailAddress}
              </label>
              <InputText
                id="profile-email"
                type="email"
                value={userData.email}
                onChange={(e) => handleProfileInputChange('email', e.target.value)}
                placeholder={t.profilemodal463}
                className="w-full"
                disabled={loadingProfile}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="profile-language" className="block text-sm font-medium mb-2">
                {t.preferredLanguage}
              </label>
              <Dropdown
                id="profile-language"
                value={userData.language}
                options={languageOptions}
                onChange={(e) => handleLanguageChange(e.value)}
                placeholder={t.languageDescription}
                className="w-full"
                panelClassName="profile-language-dropdown-panel"
                itemTemplate={(option: any) => {
                  const lang = supportedLanguages.find(l => l.code === option.value);
                  return (
                    <div className="flex items-center w-full" style={{ minHeight: '40px', padding: '0.5rem 0.75rem' }}>
                      <span className="mr-3 flex-shrink-0" style={{ width: '24px', textAlign: 'center' }}>
                        <CSSFlag country={option.value === 'en' ? 'us' : option.value} size="md" />
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-100">{lang?.nativeName}</div>
                        <div className="text-xs text-gray-400">{lang?.name}</div>
                      </div>
                    </div>
                  );
                }}
                valueTemplate={(selectedOption: any) => {
                  if (!selectedOption) {
                    return <span className="text-sm text-gray-500">Select Language</span>;
                  }
                  const languageCode = selectedOption.value || selectedOption;
                  const lang = supportedLanguages.find(l => l.code === languageCode);
                  return lang ? (
                    <div className="flex items-center py-1">
                      <span className="mr-2 flex-shrink-0" style={{ width: '20px', textAlign: 'center' }}>
                        <CSSFlag country={lang.code === 'en' ? 'us' : lang.code} size="sm" />
                      </span>
                      <span className="text-sm font-medium">{lang.nativeName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Select Language</span>
                  );
                }}
              />
              <small className="text-gray-500">
                {t.languageDescription}
              </small>
            </div>

            <Button
              type="submit"
              label={loadingProfile ? t.updating : t.updateProfile}
              icon={loadingProfile ? "pi pi-spinner pi-spin" : "pi pi-save"}
              className="w-full"
              disabled={loadingProfile}
            />
          </form>
        </TabPanel>

        <TabPanel header={t.passwordTab} leftIcon="pi pi-lock">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordError && (
              <Message 
                severity="error" 
                text={passwordError} 
                className="w-full"
              />
            )}

            {passwordSuccess && (
              <Message 
                severity="success" 
                text={passwordSuccess} 
                className="w-full"
              />
            )}

            <div className="field">
              <label htmlFor="current-password" className="block text-sm font-medium mb-2">
                {t.currentPassword}
              </label>
              <Password
                id="current-password"
                value={passwordData.current_password}
                onChange={(e) => handlePasswordInputChange('current_password', e.target.value)}
                placeholder={t.profilemodal555}
                className="w-full"
                inputClassName="w-full"
                disabled={loadingPassword}
                feedback={false}
                toggleMask
                required
              />
            </div>

            <div className="field">
              <label htmlFor="new-password" className="block text-sm font-medium mb-2">
                {t.newPassword}
              </label>
              <Password
                id="new-password"
                value={passwordData.password}
                onChange={(e) => handlePasswordInputChange('password', e.target.value)}
                placeholder={t.profilemodal573}
                className="w-full"
                inputClassName="w-full"
                disabled={loadingPassword}
                feedback={true}
                toggleMask
                required
              />
            </div>

            <div className="field">
              <label htmlFor="confirm-password" className="block text-sm font-medium mb-2">
                {t.confirmPassword}
              </label>
              <Password
                id="confirm-password"
                value={passwordData.password_confirmation}
                onChange={(e) => handlePasswordInputChange('password_confirmation', e.target.value)}
                placeholder={t.profilemodal591}
                className="w-full"
                inputClassName="w-full"
                disabled={loadingPassword}
                feedback={false}
                toggleMask
                required
              />
            </div>

            <Button
              type="submit"
              label={loadingPassword ? t.changing : t.changePassword}
              icon={loadingPassword ? "pi pi-spinner pi-spin" : "pi pi-key"}
              className="w-full"
              disabled={loadingPassword}
            />
          </form>
        </TabPanel>

        <TabPanel header="Subscriptions" leftIcon="pi pi-unlock">
          <div className="space-y-6">
            {/* Credits Display */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-lg">Ihre Credits:</span>
                <span className="text-white font-bold text-2xl">{cliStatus?.credits || 0}</span>
              </div>
              <div className="mt-2">
                <Button
                  type="button"
                  onClick={handleBuyCredits}
                  className="p-button-sm p-button-outlined"
                  icon="pi pi-shopping-cart"
                  label="Credits kaufen"
                />
              </div>
            </div>

            {/* Patron Notice */}
            {cliStatus?.cli.is_patron && (
              <div className="bg-purple-900/30 border border-purple-600 rounded-lg p-4">
                <p className="text-purple-300 flex items-center gap-2">
                  <i className="pi pi-star-fill text-yellow-400"></i>
                  <strong>Patron Status</strong> - Sie haben unbegrenzten Zugang zu allen Features!
                </p>
              </div>
            )}

            {/* CLI Subscription */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <i className="pi pi-desktop text-blue-400"></i>
                    CLI Tool
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Kommandozeilen-Tool für lokale Code-Generierung
                  </p>
                </div>
                {cliStatus?.cli.unlocked ? (
                  <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm flex items-center gap-1">
                    <i className="pi pi-check"></i> Aktiv
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-600 text-gray-300 rounded-full text-sm flex items-center gap-1">
                    <i className="pi pi-lock"></i> Gesperrt
                  </span>
                )}
              </div>
              {cliStatus?.cli.expires_at && (
                <p className="text-gray-400 text-sm mb-3">
                  Gültig bis: {new Date(cliStatus.cli.expires_at).toLocaleDateString('de-DE')}
                </p>
              )}
              {!cliStatus?.cli.unlocked && !cliStatus?.cli.is_patron && (
                <Button
                  type="button"
                  onClick={() => handleUnlock('cli')}
                  loading={unlocking === 'cli'}
                  disabled={unlocking !== null || (cliStatus?.credits || 0) < 50}
                  className="p-button-primary"
                  icon="pi pi-unlock"
                  label={`Freischalten (${cliStatus?.prices.cli || 50} Credits/Jahr)`}
                />
              )}
            </div>

            {/* Service Subscription */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <i className="pi pi-server text-green-400"></i>
                    Windows Service
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Hintergrund-Service für automatische Synchronisation
                  </p>
                </div>
                {cliStatus?.service.unlocked ? (
                  <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm flex items-center gap-1">
                    <i className="pi pi-check"></i> Aktiv
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-600 text-gray-300 rounded-full text-sm flex items-center gap-1">
                    <i className="pi pi-lock"></i> Gesperrt
                  </span>
                )}
              </div>
              {cliStatus?.service.expires_at && (
                <p className="text-gray-400 text-sm mb-3">
                  Gültig bis: {new Date(cliStatus.service.expires_at).toLocaleDateString('de-DE')}
                </p>
              )}
              {!cliStatus?.service.unlocked && !cliStatus?.service.is_patron && (
                <Button
                  type="button"
                  onClick={() => handleUnlock('service')}
                  loading={unlocking === 'service'}
                  disabled={unlocking !== null || (cliStatus?.credits || 0) < 50}
                  className="p-button-primary"
                  icon="pi pi-unlock"
                  label={`Freischalten (${cliStatus?.prices.service || 50} Credits/Jahr)`}
                />
              )}
            </div>

            {/* Bundle Offer */}
            {!cliStatus?.cli.unlocked && !cliStatus?.service.unlocked && !cliStatus?.cli.is_patron && (
              <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-lg p-4 border border-blue-600">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <i className="pi pi-gift text-yellow-400"></i>
                      Bundle: CLI + Service
                      <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full font-bold">
                        SPARE 10 CREDITS!
                      </span>
                    </h3>
                    <p className="text-gray-300 text-sm mt-1">
                      Beide Tools zum Vorteilspreis - nur {cliStatus?.prices.bundle || 90} statt 100 Credits
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => handleUnlock('bundle')}
                  loading={unlocking === 'bundle'}
                  disabled={unlocking !== null || (cliStatus?.credits || 0) < 90}
                  className="p-button-success"
                  icon="pi pi-unlock"
                  label={`Bundle freischalten (${cliStatus?.prices.bundle || 90} Credits/Jahr)`}
                />
              </div>
            )}

            {/* Not enough credits warning */}
            {cliStatus && !cliStatus.cli.is_patron && (cliStatus.credits < 50) && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                <p className="text-red-300 text-sm flex items-center gap-2">
                  <i className="pi pi-exclamation-triangle"></i>
                  Sie haben nicht genug Credits. Kaufen Sie Credits um Features freizuschalten.
                </p>
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel header={t.profilemodal611} leftIcon="pi pi-credit-card">
          <div className="space-y-6">
            {/* Current Plan Info */}
            <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-l-blue-400">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">{t.profilemodal616}</h3>
                <Badge
                  value={cliStatus?.cli.is_patron ? (userData.user_type === 'patron' ? 'Patron' : 'Free') : 'Free'}
                  severity={cliStatus?.cli.is_patron ? 'success' : 'info'}
                />
              </div>
              <p className="text-gray-300">
                {cliStatus?.cli.is_patron
                  ? 'Sie haben als Patron unbegrenzten Zugang zu allen Features!'
                  : 'Sie nutzen aktuell den kostenlosen Plan. Upgraden Sie für mehr Features!'
                }
              </p>
            </div>

            {/* Patron Notice or Upgrade Option */}
            {cliStatus?.cli.is_patron ? (
              <div className="bg-purple-900/30 border border-purple-600 rounded-lg p-4">
                <p className="text-purple-300 flex items-center gap-2">
                  <i className="pi pi-star-fill text-yellow-400"></i>
                  <strong>Patron Status</strong> - Vielen Dank für Ihre Unterstützung!
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-600 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <i className="pi pi-heart-fill text-red-400"></i>
                      Werden Sie Patron!
                    </h3>
                    <p className="text-gray-300 text-sm mt-1">
                      Unbegrenzter Zugang zu allen Features, private Projekte, Templates und mehr.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleViewPlans}
                    className="p-button-help"
                    icon="pi pi-star"
                    label="Pläne ansehen"
                  />
                </div>
              </div>
            )}

            {/* Credits Section */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-300 text-lg">Ihre Credits:</span>
                <span className="text-white font-bold text-2xl">{cliStatus?.credits || userData.credits || 0}</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Credits werden für Projekte, Datenbanken, Teams und Code-Generierung benötigt.
              </p>
              <Button
                type="button"
                onClick={handleBuyCredits}
                className="p-button-outlined p-button-info w-full"
                icon="pi pi-shopping-cart"
                label="Credits kaufen"
              />
            </div>

            {/* Quick Info */}
            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
              <h4 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
                <i className="pi pi-info-circle"></i>
                Preise im Überblick
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-gray-300">
                  <i className="pi pi-folder text-blue-400 mr-2"></i>
                  Projekt: 50 Credits/Jahr
                </div>
                <div className="text-gray-300">
                  <i className="pi pi-database text-green-400 mr-2"></i>
                  Datenbank: 50 Credits/Jahr
                </div>
                <div className="text-gray-300">
                  <i className="pi pi-users text-purple-400 mr-2"></i>
                  Team: 50 Credits/Jahr
                </div>
                <div className="text-gray-300">
                  <i className="pi pi-code text-yellow-400 mr-2"></i>
                  Generierung: 5 Credits
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Seller Profile Tab */}
        <TabPanel header="Verkäufer" leftIcon="pi pi-shopping-bag">
          <form onSubmit={handleSellerSubmit} className="space-y-6">
            {sellerError && (
              <Message severity="error" text={sellerError} className="w-full" />
            )}
            {sellerSuccess && (
              <Message severity="success" text={sellerSuccess} className="w-full" />
            )}

            {/* Enable Seller Mode */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <i className="pi pi-shopping-bag text-green-400"></i>
                  Verkäufer-Modus aktivieren
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  Aktivieren Sie diesen Modus, um Templates im Store zu verkaufen.
                </p>
              </div>
              <InputSwitch
                checked={sellerData.is_seller}
                onChange={(e) => setSellerData(prev => ({ ...prev, is_seller: e.value }))}
              />
            </div>

            {sellerData.is_seller && (
              <>
                {/* Earnings Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
                    <p className="text-gray-400 text-sm">Ausstehende Auszahlung</p>
                    <p className="text-2xl font-bold text-green-400">
                      {parseFloat(String(userData.pending_earnings || 0)).toFixed(2)} €
                    </p>
                  </div>
                  <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                    <p className="text-gray-400 text-sm">Gesamt verdient</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {parseFloat(String(userData.total_earnings || 0)).toFixed(2)} €
                    </p>
                  </div>
                </div>

                <Divider />

                {/* Company Information */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <i className="pi pi-building text-blue-400"></i>
                    Unternehmensdaten
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="field">
                      <label htmlFor="company_name" className="block text-sm font-medium mb-2">
                        Firmenname / Name *
                      </label>
                      <InputText
                        id="company_name"
                        value={sellerData.company_name}
                        onChange={(e) => setSellerData(prev => ({ ...prev, company_name: e.target.value }))}
                        className="w-full"
                        placeholder="Musterfirma GmbH"
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="company_country" className="block text-sm font-medium mb-2">
                        Land *
                      </label>
                      <Dropdown
                        id="company_country"
                        value={sellerData.company_country}
                        options={countries}
                        onChange={(e) => setSellerData(prev => ({ ...prev, company_country: e.value }))}
                        className="w-full"
                        placeholder="Land auswählen"
                        filter
                      />
                    </div>
                  </div>

                  <div className="field mt-4">
                    <label htmlFor="company_address" className="block text-sm font-medium mb-2">
                      Adresse
                    </label>
                    <InputTextarea
                      id="company_address"
                      value={sellerData.company_address}
                      onChange={(e) => setSellerData(prev => ({ ...prev, company_address: e.target.value }))}
                      className="w-full"
                      rows={3}
                      placeholder="Musterstraße 123&#10;1234 Musterstadt"
                    />
                  </div>
                </div>

                <Divider />

                {/* VAT / Tax Information */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <i className="pi pi-file text-yellow-400"></i>
                    Steuer-Informationen
                  </h4>

                  {isEuCountry ? (
                    <div className="field">
                      <label htmlFor="vat_id" className="block text-sm font-medium mb-2">
                        UID-Nummer (VAT ID)
                        {sellerData.company_country !== 'AT' && (
                          <span className="text-yellow-400 ml-2">* Für Reverse Charge erforderlich</span>
                        )}
                      </label>
                      <InputText
                        id="vat_id"
                        value={sellerData.vat_id}
                        onChange={(e) => setSellerData(prev => ({ ...prev, vat_id: e.target.value }))}
                        className="w-full"
                        placeholder={sellerData.company_country === 'AT' ? 'ATU12345678' : sellerData.company_country === 'DE' ? 'DE123456789' : 'XX123456789'}
                      />
                      <small className="text-gray-400">
                        {sellerData.company_country === 'AT'
                          ? 'Österreichische Unternehmen erhalten Gutschriften inkl. USt.'
                          : 'EU-Unternehmen mit UID erhalten Netto-Gutschriften (Reverse Charge).'
                        }
                      </small>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="field">
                        <label htmlFor="business_registration" className="block text-sm font-medium mb-2">
                          Gewerbeschein / Business Registration
                        </label>
                        <InputText
                          id="business_registration"
                          value={sellerData.business_registration}
                          onChange={(e) => setSellerData(prev => ({ ...prev, business_registration: e.target.value }))}
                          className="w-full"
                          placeholder="Registrierungsnummer"
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="tax_id" className="block text-sm font-medium mb-2">
                          Steuer-ID / Tax ID
                        </label>
                        <InputText
                          id="tax_id"
                          value={sellerData.tax_id}
                          onChange={(e) => setSellerData(prev => ({ ...prev, tax_id: e.target.value }))}
                          className="w-full"
                          placeholder="Tax ID"
                        />
                      </div>
                      <Message
                        severity="info"
                        text="Ohne Unternehmensnachweis wird von Ihrer Auszahlung 20% MwSt abgezogen."
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                <Divider />

                {/* Payout Method */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <i className="pi pi-wallet text-green-400"></i>
                    Auszahlungsmethode
                  </h4>

                  <div className="field mb-4">
                    <label htmlFor="payout_method" className="block text-sm font-medium mb-2">
                      Auszahlungsart *
                    </label>
                    <Dropdown
                      id="payout_method"
                      value={sellerData.payout_method}
                      options={payoutMethods}
                      onChange={(e) => setSellerData(prev => ({ ...prev, payout_method: e.value }))}
                      className="w-full"
                      placeholder="Auszahlungsart wählen"
                    />
                  </div>

                  {sellerData.payout_method === 'paypal' && (
                    <div className="field p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                      <label htmlFor="paypal_payout_email" className="block text-sm font-medium mb-2">
                        <i className="pi pi-paypal mr-2"></i>
                        PayPal E-Mail-Adresse *
                      </label>
                      <InputText
                        id="paypal_payout_email"
                        type="email"
                        value={sellerData.paypal_payout_email}
                        onChange={(e) => setSellerData(prev => ({ ...prev, paypal_payout_email: e.target.value }))}
                        className="w-full"
                        placeholder="ihre-email@paypal.com"
                      />
                    </div>
                  )}

                  {sellerData.payout_method === 'bank_transfer' && (
                    <div className="space-y-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                      <div className="field">
                        <label htmlFor="bank_account_holder" className="block text-sm font-medium mb-2">
                          Kontoinhaber *
                        </label>
                        <InputText
                          id="bank_account_holder"
                          value={sellerData.bank_account_holder}
                          onChange={(e) => setSellerData(prev => ({ ...prev, bank_account_holder: e.target.value }))}
                          className="w-full"
                          placeholder="Max Mustermann"
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="bank_iban" className="block text-sm font-medium mb-2">
                          IBAN *
                        </label>
                        <InputText
                          id="bank_iban"
                          value={sellerData.bank_iban}
                          onChange={(e) => setSellerData(prev => ({ ...prev, bank_iban: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                          className="w-full"
                          placeholder="AT12 3456 7890 1234 5678"
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="bank_bic" className="block text-sm font-medium mb-2">
                          BIC/SWIFT
                        </label>
                        <InputText
                          id="bank_bic"
                          value={sellerData.bank_bic}
                          onChange={(e) => setSellerData(prev => ({ ...prev, bank_bic: e.target.value.toUpperCase() }))}
                          className="w-full"
                          placeholder="BKAUATWW"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Payout Info */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-2">Auszahlungs-Info</h5>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>• Auszahlungen erfolgen monatlich (Anfang des Folgemonats)</li>
                    <li>• Mindestauszahlung: 10,00 €</li>
                    <li>• Sie erhalten 80% des Verkaufspreises</li>
                    <li>• 20% verbleiben bei der Plattform</li>
                  </ul>
                </div>
              </>
            )}

            <Button
              type="submit"
              label={savingSeller ? "Speichern..." : "Verkäufer-Profil speichern"}
              icon={savingSeller ? "pi pi-spinner pi-spin" : "pi pi-save"}
              disabled={savingSeller}
              className="w-full"
            />
          </form>
        </TabPanel>

        <TabPanel header={t.deleteTab} leftIcon="pi pi-trash">
          <form onSubmit={handleDeleteSubmit} className="space-y-4">
            {deleteError && (
              <Message
                severity="error"
                text={deleteError}
                className="w-full"
              />
            )}

            {deleteSuccess && (
              <Message 
                severity="success" 
                text={deleteSuccess} 
                className="w-full"
              />
            )}

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="text-red-800 font-semibold mb-2 flex items-center">
                <i className="pi pi-exclamation-triangle mr-2"></i>
                Warning: Delete account
              </h3>
              <p className="text-red-700 text-sm mb-3">
                {t.profilemodal714}
              </p>
              <ul className="text-red-700 text-sm list-disc list-inside space-y-1">
                <li>{t.profilemodal718}</li>
                <li>{t.profilemodal719}</li>
                <li>{t.profilemodal720}</li>
              </ul>
            </div>

            <div className="field">
              <label htmlFor="delete-password" className="block text-sm font-medium mb-2">
                {t.profilemodal725}
              </label>
              <Password
                id="delete-password"
                value={deleteData.password}
                onChange={(e) => handleDeleteInputChange('password', e.target.value)}
                placeholder={t.profilemodal555}
                className="w-full"
                inputClassName="w-full"
                disabled={loadingDelete}
                feedback={false}
                toggleMask
                required
              />
            </div>

            <div className="field">
              <label htmlFor="delete-confirm" className="block text-sm font-medium mb-2">
                Enter "DELETE" to confirm
              </label>
              <InputText
                id="delete-confirm"
                type="text"
                value={deleteData.confirmText}
                onChange={(e) => handleDeleteInputChange('confirmText', e.target.value)}
                placeholder="DELETE"
                className="w-full"
                disabled={loadingDelete}
                required
              />
              <small className="text-gray-500">
                You must enter exactly "DELETE" (capital letters)
              </small>
            </div>

            <Button
              type="submit"
              label={loadingDelete ? t.deleting : t.deleteAccount}
              icon={loadingDelete ? "pi pi-spinner pi-spin" : "pi pi-trash"}
              className="w-full p-button-danger"
              disabled={loadingDelete || deleteData.confirmText !== "DELETE"}
            />
          </form>
        </TabPanel>
      </TabView>

      {/* Plan Modal for subscriptions and credits */}
      <PlanModal
        visible={showPlanModal}
        onHide={handlePlanModalClose}
        initialTab={planModalTab}
      />
    </Dialog>
  );
}