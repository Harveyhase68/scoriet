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
import TwoFactorSection from '@/Components/AuthModals/TwoFactorSection';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';

interface ProfileModalProps {
  visible: boolean;
  onHide: () => void;
  defaultTab?: number; // Tab index to open by default (0=Profile, 1=Password, 2=Security, 3=Subscriptions, 4=Plans, 5=Verkäufer, 6=Git, 7=Delete)
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
  // Kanban display settings
  kanban_initials?: string;
  kanban_color?: string;
  // Email notification settings
  email_system_notifications?: boolean;
  email_user_notifications?: boolean;
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
    days_remaining: number | null;
    is_patron: boolean;
  };
  service: {
    unlocked: boolean;
    expires_at: string | null;
    days_remaining: number | null;
    is_patron: boolean;
  };
  credits: number;
  prices: {
    cli: number;
    service: number;
    bundle: number;
  };
}

// All available feature subscriptions
interface FeatureSubscription {
  type: string;
  name: string;
  description: string;
  icon: string;
  iconColor: string;
  cost: number;
  unlocked: boolean;
  expires_at: string | null;
  days_remaining: number | null;
  is_patron: boolean;
  isBundle?: boolean;
  bundleChildren?: string[]; // For bundle: list of child types
  parentBundle?: string; // For CLI/Service: reference to bundle
  requiresEntity?: boolean; // Feature requires creating entity first (e.g., Team)
  entityInfo?: string; // Info text for entity-based features
  covered_by_bundle?: boolean; // CLI/Service covered by active bundle
}

interface GitProvider {
  id: number;
  provider: 'github' | 'gitlab' | 'bitbucket';
  provider_name: string;
  username: string;
  email: string;
  avatar_url: string;
  connected_at: string | null;
  is_expired: boolean;
}

interface SubscriptionItem {
  id: number;
  type: string;
  type_display: string;
  entity_id: number | null;
  entity_name: string | null;
  is_free_tier: boolean;
  is_patron: boolean;
  expires_at: string | null;
  expires_at_formatted: string | null;
  days_until_expiry: number | null;
  is_expired: boolean;
  is_soft_locked: boolean;
  is_eligible_for_bonus: boolean;
  bonus_days: number;
  renewal_cost: number;
}

export default function ProfileModal({ visible, onHide, defaultTab = 0 }: ProfileModalProps) {
  // Get current language for translations
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  // Theme context
  const { themeMode, setThemeMode, colors } = useTheme();

  // Theme options for dropdown
  const themeOptions: { label: string; value: ThemeMode; icon: string; description: string }[] = [
    { label: 'Dunkel', value: 'dark', icon: 'pi pi-moon', description: 'Dunkles Design' },
    { label: 'Hell', value: 'light', icon: 'pi pi-sun', description: 'Helles Design' },
    { label: 'Grün', value: 'green', icon: 'pi pi-palette', description: 'Grünes Design' },
    { label: 'Automatisch', value: 'auto', icon: 'pi pi-clock', description: '6-18 Uhr hell, sonst dunkel' },
  ];

  // Helper function to darken/lighten a hex color
  const adjustColorHex = (hex: string, amount: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  // Helper function to get contrasting text color (black or white) based on background
  const getContrastTextColor = (hexColor: string): string => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Calculate relative luminance using sRGB formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? '#1e293b' : '#ffffff';
  };

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

  // Add CSS for theme-aware dropdown styling
  React.useEffect(() => {
    const style = document.createElement('style');
    style.id = 'profile-dropdown-styles';
    style.textContent = `
      .profile-language-dropdown-panel {
        background: var(--theme-bg-tertiary) !important;
        border: 1px solid var(--theme-border-secondary) !important;
        border-radius: 6px !important;
      }
      .profile-language-dropdown-panel .p-dropdown-item {
        background: transparent !important;
        color: var(--theme-text-primary) !important;
        border: none !important;
        padding: 0 !important;
      }
      .profile-language-dropdown-panel .p-dropdown-item:hover {
        background: var(--theme-bg-hover) !important;
        color: var(--theme-text-primary) !important;
      }
      .profile-language-dropdown-panel .p-dropdown-item.p-highlight {
        background: var(--theme-accent) !important;
        color: var(--theme-text-inverse) !important;
      }
      .profile-language-dropdown-panel .p-dropdown-item-group {
        background: var(--theme-bg-tertiary) !important;
        color: var(--theme-text-muted) !important;
      }
      .profile-themed-dropdown .p-dropdown {
        background: var(--theme-bg-tertiary) !important;
        border: 1px solid var(--theme-border-secondary) !important;
        color: var(--theme-text-primary) !important;
      }
      .profile-themed-dropdown .p-dropdown:hover {
        border-color: var(--theme-border-primary) !important;
      }
      .profile-themed-dropdown .p-dropdown .p-dropdown-label {
        color: var(--theme-text-primary) !important;
      }
      .profile-themed-dropdown .p-dropdown .p-dropdown-trigger {
        color: var(--theme-text-muted) !important;
      }
    `;
    // Remove existing style if present
    const existingStyle = document.getElementById('profile-dropdown-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    document.head.appendChild(style);
    return () => {
      const styleToRemove = document.getElementById('profile-dropdown-styles');
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    language: getStoredLanguage(),
    email_system_notifications: true,
    email_user_notifications: true,
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

  // Git Provider State
  const [gitProviders, setGitProviders] = useState<GitProvider[]>([]);
  const [loadingGitProviders, setLoadingGitProviders] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] = useState<string | null>(null);
  const [gitIntegrationAccess, setGitIntegrationAccess] = useState<{
    has_access: boolean;
    access_type?: string;
    unlock_cost?: number;
    days_remaining?: number;
    expires_at?: string;
    is_patron?: boolean;
    is_expired?: boolean;
  } | null>(null);
  const [unlockingGit, setUnlockingGit] = useState(false);

  // All Subscriptions State
  const [allSubscriptions, setAllSubscriptions] = useState<SubscriptionItem[]>([]);

  // Attachment Storage State
  const [storageStatus, setStorageStatus] = useState<{
    used: number;
    used_formatted: string;
    limit: number;
    limit_formatted: string;
    remaining: number;
    remaining_formatted: string;
    percentage: number;
    is_unlimited: boolean;
    is_full: boolean;
    is_warning: boolean;
  } | null>(null);

  // All available feature subscriptions
  const [allFeatures, setAllFeatures] = useState<FeatureSubscription[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [bundleDiscountInfo, setBundleDiscountInfo] = useState<{
    has_existing_subscriptions: boolean;
    options: Array<{
      type: string;
      label: string;
      price: number;
      discount?: number;
      description: string;
    }>;
  } | null>(null);
  const [showBundleOptions, setShowBundleOptions] = useState(false);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [renewingSubscription, setRenewingSubscription] = useState<number | null>(null);

  // Country options for dropdown
  const countries = [
    { label: t.profilemodal347 || 'Österreich', value: 'AT' },
    { label: t.profilemodal348 || 'Deutschland', value: 'DE' },
    { label: t.profilemodal349 || 'Schweiz', value: 'CH' },
    { label: t.profilemodal350 || 'Frankreich', value: 'FR' },
    { label: t.profilemodal351 || 'Italien', value: 'IT' },
    { label: t.profilemodal352 || 'Spanien', value: 'ES' },
    { label: t.profilemodal353 || 'Niederlande', value: 'NL' },
    { label: t.profilemodal354 || 'Belgien', value: 'BE' },
    { label: t.profilemodal355 || 'Polen', value: 'PL' },
    { label: t.profilemodal356 || 'Tschechien', value: 'CZ' },
    { label: t.profilemodal357 || 'Ungarn', value: 'HU' },
    { label: t.profilemodal358 || 'Slowakei', value: 'SK' },
    { label: t.profilemodal359 || 'Slowenien', value: 'SI' },
    { label: t.profilemodal360 || 'Kroatien', value: 'HR' },
    { label: t.profilemodal361 || 'Rumänien', value: 'RO' },
    { label: t.profilemodal362 || 'Bulgarien', value: 'BG' },
    { label: t.profilemodal363 || 'Griechenland', value: 'GR' },
    { label: t.profilemodal364 || 'Portugal', value: 'PT' },
    { label: t.profilemodal365 || 'Schweden', value: 'SE' },
    { label: t.profilemodal366 || 'Dänemark', value: 'DK' },
    { label: t.profilemodal367 || 'Finnland', value: 'FI' },
    { label: t.profilemodal368 || 'Irland', value: 'IE' },
    { label: t.profilemodal369 || 'Luxemburg', value: 'LU' },
    { label: t.profilemodal370 || 'Malta', value: 'MT' },
    { label: t.profilemodal371 || 'Zypern', value: 'CY' },
    { label: t.profilemodal372 || 'Estland', value: 'EE' },
    { label: t.profilemodal373 || 'Lettland', value: 'LV' },
    { label: t.profilemodal374 || 'Litauen', value: 'LT' },
    { label: t.profilemodal375 || '--- Nicht-EU ---', value: '', disabled: true },
    { label: 'USA', value: 'US' },
    { label: 'Kanada', value: 'CA' },
    { label: t.profilemodal378 || 'Großbritannien', value: 'GB' },
    { label: t.profilemodal379 || 'Australien', value: 'AU' },
    { label: t.profilemodal380 || 'Japan', value: 'JP' },
    { label: 'Indien', value: 'IN' },
    { label: t.profilemodal382 || 'Brasilien', value: 'BR' },
    { label: t.profilemodal383 || 'Sonstiges', value: 'XX' },
  ];

  const payoutMethods = [
    { label: t.profilemodal387 || 'Banküberweisung (SEPA)', value: 'bank_transfer' },
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

  // Load all subscriptions for the user
  const loadAllSubscriptions = useCallback(async () => {
    try {
      setLoadingSubscriptions(true);
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/subscriptions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllSubscriptions(data.subscriptions || []);
      }
    } catch (err) {
      console.error('Error loading subscriptions:', err);
    } finally {
      setLoadingSubscriptions(false);
    }
  }, []);

  // Load all available features with status
  const loadAllFeatures = useCallback(async () => {
    try {
      setLoadingFeatures(true);
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/subscriptions/all-features', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllFeatures(data.features || []);
      }
    } catch (err) {
      console.error('Error loading features:', err);
    } finally {
      setLoadingFeatures(false);
    }
  }, []);

  // Load attachment storage status
  const loadStorageStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/messages/attachments/access', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStorageStatus(data.storage || null);
      }
    } catch (err) {
      console.error('Error loading storage status:', err);
    }
  }, []);

  // Load bundle discount info
  const loadBundleDiscount = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/subscriptions/bundle-discount', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBundleDiscountInfo(data);
      }
    } catch (err) {
      console.error('Error loading bundle discount:', err);
    }
  }, []);

  // Renew a subscription
  const renewSubscription = async (subscriptionId: number) => {
    setRenewingSubscription(subscriptionId);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`/api/subscriptions/${subscriptionId}/renew`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        // Reload all data
        loadAllSubscriptions();
        loadCliStatus();
      } else {
        alert(data.error || 'Verlängerung fehlgeschlagen');
      }
    } catch (err) {
      console.error('Error renewing subscription:', err);
      alert('Verlängerung fehlgeschlagen');
    } finally {
      setRenewingSubscription(null);
    }
  };

  // Handle unlock CLI/Service/Bundle
  const handleUnlock = async (type: 'cli' | 'service' | 'bundle', bundleOption?: string) => {
    setUnlocking(type);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.profilemodal115);
      }

      const body: { type: string; bundle_option?: string } = { type };
      if (bundleOption) {
        body.bundle_option = bundleOption;
      }

      const response = await fetch('/api/cli-subscriptions/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Freischalten');
      }

      // Reload status
      loadCliStatus();
      loadUserData();
      loadAllFeatures();
      loadBundleDiscount();

    } catch (err) {
      console.error('Unlock error:', err);
      alert(err instanceof Error ? err.message : 'Fehler beim Freischalten');
    } finally {
      setUnlocking(null);
    }
  };

  // Handle unlock for other features (database_designer, form_designer, code_adjustments, schema_migration, git_integration)
  const handleFeatureUnlock = async (featureType: string) => {
    setUnlocking(featureType);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.profilemodal115);
      }

      // Map feature types to API endpoints
      const endpointMap: Record<string, string> = {
        'database_designer': '/api/subscriptions/unlock-database-designer',
        'form_designer': '/api/form-designer/unlock',
        'code_adjustments': '/api/subscriptions/unlock-code-adjustments',
        'schema_migration': '/api/subscriptions/unlock-schema-migration',
        'git_integration': '/api/subscriptions/unlock-git-integration',
        'team': '/api/subscriptions/unlock-teams',
      };

      const endpoint = endpointMap[featureType];
      if (!endpoint) {
        throw new Error('Unbekannter Feature-Typ');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Fehler beim Freischalten');
      }

      // Reload all data
      loadCliStatus();
      loadUserData();
      loadAllFeatures();
      loadGitProviders();

    } catch (err) {
      console.error('Feature unlock error:', err);
      alert(err instanceof Error ? err.message : 'Fehler beim Freischalten');
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

  // Load Git Providers and Access Status
  const loadGitProviders = useCallback(async () => {
    setLoadingGitProviders(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/git/providers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGitProviders(data.providers || []);
        // Store Git Integration access status
        if (data.git_integration_access) {
          setGitIntegrationAccess(data.git_integration_access);
        }
      }
    } catch (err) {
      console.error('Error loading git providers:', err);
    } finally {
      setLoadingGitProviders(false);
    }
  }, []);

  // Unlock Git Integration with credits
  const unlockGitIntegration = async () => {
    setUnlockingGit(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/subscriptions/unlock-git-integration', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGitIntegrationAccess(data.access_status);
        // Reload user data to update credits
        loadUserData();
        // Reload CLI status to update credits display
        loadCliStatus();
      } else {
        const error = await response.json();
        alert(error.message || 'Freischaltung fehlgeschlagen');
      }
    } catch (err) {
      console.error('Error unlocking git integration:', err);
      alert('Freischaltung fehlgeschlagen');
    } finally {
      setUnlockingGit(false);
    }
  };

  // Connect a Git Provider (opens popup window)
  const connectGitProvider = async (provider: string) => {
    setConnectingProvider(provider);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/git/authorize/${provider}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get authorization URL');
      }

      // Open popup window for OAuth
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      window.open(
        data.url,
        `${provider}-oauth`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
      );
    } catch (err) {
      console.error('Connect error:', err);
      setConnectingProvider(null);
    }
  };

  // Complete OAuth flow after receiving callback
  const completeGitOAuth = async (provider: string, code: string, state: string) => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/git/callback/${provider}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for expired state error - prompt user to try again
        if (data.error && data.error.includes('expired state')) {
          alert('Die Verbindungsanfrage ist abgelaufen. Bitte klicken Sie erneut auf "Verbinden".');
        } else {
          alert(data.error || 'Verbindung fehlgeschlagen');
        }
        throw new Error(data.error || 'Failed to complete connection');
      }

      loadGitProviders();
    } catch (err) {
      console.error('OAuth completion error:', err);
    } finally {
      setConnectingProvider(null);
    }
  };

  // Disconnect a Git Provider
  const disconnectGitProvider = async (provider: string) => {
    if (!confirm(`Möchten Sie die Verbindung zu ${provider === 'github' ? 'GitHub' : provider === 'gitlab' ? 'GitLab' : provider} wirklich trennen?`)) {
      return;
    }

    setDisconnectingProvider(provider);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/git/disconnect/${provider}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disconnect');
      }

      loadGitProviders();
    } catch (err) {
      console.error('Disconnect error:', err);
    } finally {
      setDisconnectingProvider(null);
    }
  };

  // Listen for OAuth callback messages from popup windows
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'git-oauth-callback') return;

      const { provider, code, state, error } = event.data;

      if (error) {
        console.error(`${provider} connection failed:`, event.data.errorDescription || error);
        setConnectingProvider(null);
        return;
      }

      if (code && state) {
        await completeGitOAuth(provider, code, state);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Load user data when opening and reset tab index
  useEffect(() => {
    if (visible) {
      loadUserData();
      loadCliStatus();
      loadPricing();
      loadGitProviders();
      loadAllSubscriptions();
      loadAllFeatures();
      loadBundleDiscount();
      loadStorageStatus();
      setActiveTabIndex(defaultTab); // Reset to defaultTab when modal opens
    }
  }, [visible, loadUserData, loadCliStatus, loadPricing, loadGitProviders, loadAllSubscriptions, loadAllFeatures, loadBundleDiscount, loadStorageStatus, defaultTab]);

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
          kanban_initials: userData.kanban_initials || null,
          kanban_color: userData.kanban_color || null,
          email_system_notifications: userData.email_system_notifications,
          email_user_notifications: userData.email_user_notifications,
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
      setDeleteError(t.profilemodal1151 || 'Sie müssen "DELETE" eingeben, um Ihren Account zu löschen');
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
      style={{ width: '1100px' }}
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
              <small style={{ color: colors.textMuted }}>
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

            <div className="field profile-themed-dropdown">
              <label htmlFor="profile-language" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
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
                style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderSecondary }}
                itemTemplate={(option: any) => {
                  const lang = supportedLanguages.find(l => l.code === option.value);
                  return (
                    <div className="flex items-center w-full" style={{ minHeight: '40px', padding: '0.5rem 0.75rem' }}>
                      <span className="mr-3 flex-shrink-0" style={{ width: '24px', textAlign: 'center' }}>
                        <CSSFlag country={option.value === 'en' ? 'us' : option.value} size="md" />
                      </span>
                      <div className="flex-1">
                        <div className="font-medium" style={{ color: colors.textPrimary }}>{lang?.nativeName}</div>
                        <div className="text-xs" style={{ color: colors.textMuted }}>{lang?.name}</div>
                      </div>
                    </div>
                  );
                }}
                valueTemplate={(selectedOption: any) => {
                  if (!selectedOption) {
                    return <span className="text-sm" style={{ color: colors.textMuted }}>Select Language</span>;
                  }
                  const languageCode = selectedOption.value || selectedOption;
                  const lang = supportedLanguages.find(l => l.code === languageCode);
                  return lang ? (
                    <div className="flex items-center py-1">
                      <span className="mr-2 flex-shrink-0" style={{ width: '20px', textAlign: 'center' }}>
                        <CSSFlag country={lang.code === 'en' ? 'us' : lang.code} size="sm" />
                      </span>
                      <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{lang.nativeName}</span>
                    </div>
                  ) : (
                    <span className="text-sm" style={{ color: colors.textMuted }}>Select Language</span>
                  );
                }}
              />
              <small style={{ color: colors.textMuted }}>
                {t.languageDescription}
              </small>
            </div>

            {/* Theme Selection */}
            <div className="field profile-themed-dropdown">
              <label htmlFor="profile-theme" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                <i className="pi pi-palette mr-2" style={{ color: colors.accent }}></i>
                Design / Theme
              </label>
              <Dropdown
                id="profile-theme"
                value={themeMode}
                options={themeOptions}
                onChange={(e) => setThemeMode(e.value)}
                placeholder={t.profilemodal1376 || "Design auswählen"}
                className="w-full"
                panelClassName="profile-language-dropdown-panel"
                style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderSecondary }}
                itemTemplate={(option) => (
                  <div className="flex items-center w-full" style={{ minHeight: '40px', padding: '0.5rem 0.75rem' }}>
                    <span className="mr-3 flex-shrink-0" style={{ width: '24px', textAlign: 'center' }}>
                      <i className={option.icon} style={{ color: colors.accent }}></i>
                    </span>
                    <div className="flex-1">
                      <div className="font-medium" style={{ color: colors.textPrimary }}>{option.label}</div>
                      <div className="text-xs" style={{ color: colors.textMuted }}>{option.description}</div>
                    </div>
                  </div>
                )}
                valueTemplate={(selectedOption) => {
                  if (!selectedOption) {
                    return <span className="text-sm" style={{ color: colors.textMuted }}>{t.profilemodal1393 || "Design auswählen"}</span>;
                  }
                  const option = themeOptions.find(o => o.value === (selectedOption.value || selectedOption));
                  return option ? (
                    <div className="flex items-center py-1">
                      <span className="mr-2 flex-shrink-0" style={{ width: '20px', textAlign: 'center' }}>
                        <i className={option.icon} style={{ color: colors.accent }}></i>
                      </span>
                      <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{option.label}</span>
                    </div>
                  ) : (
                    <span className="text-sm" style={{ color: colors.textMuted }}>{t.profilemodal1404}</span>
                  );
                }}
              />
              <small style={{ color: colors.textMuted }}>
                {t.profilemodal1409}
              </small>
            </div>

            {/* Kanban Display Settings */}
            <div className="field mt-4">
              <label className="block text-sm font-medium mb-3" style={{ color: colors.textPrimary }}>
                <i className="pi pi-th-large mr-2" style={{ color: colors.accent }}></i>
                {t.profilemodal1417}
              </label>
              <div className="space-y-3 rounded-lg p-4" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}>
                <div className="flex items-center gap-4">
                  {/* Preview Avatar */}
                  <div
                    className="flex items-center justify-center rounded-full font-bold text-sm"
                    style={{
                      width: '40px',
                      height: '40px',
                      background: userData.kanban_color
                        ? `linear-gradient(135deg, ${userData.kanban_color}, ${adjustColorHex(userData.kanban_color, -30)})`
                        : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      color: getContrastTextColor(userData.kanban_color || '#3b82f6'),
                    }}
                  >
                    {(userData.kanban_initials || userData.username?.substring(0, 2) || 'AB').toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-2">
                    {/* Initials Input */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs w-16" style={{ color: colors.textMuted }}>{t.profilemodal1438}</label>
                      <InputText
                        value={userData.kanban_initials || ''}
                        onChange={(e) => setUserData(prev => ({ ...prev, kanban_initials: e.target.value.toUpperCase().substring(0, 3) }))}
                        placeholder={userData.username?.substring(0, 2).toUpperCase() || 'AB'}
                        maxLength={3}
                        className="w-20 text-center"
                        style={{ padding: '0.25rem 0.5rem' }}
                      />
                      <span className="text-xs" style={{ color: colors.textMuted }}>{t.profilemodal1447}</span>
                    </div>
                    {/* Color Input */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs w-16" style={{ color: colors.textMuted }}>{t.profilemodal1451}</label>
                      <input
                        type="color"
                        value={userData.kanban_color || '#3b82f6'}
                        onChange={(e) => setUserData(prev => ({ ...prev, kanban_color: e.target.value }))}
                        className="w-10 h-8 cursor-pointer rounded"
                        style={{ padding: 0, border: `1px solid ${colors.borderSecondary}` }}
                      />
                      <span className="text-xs" style={{ color: colors.textMuted }}>{userData.kanban_color || '#3b82f6'}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
                  {t.profilemodal1464}
                </p>
              </div>
            </div>

            {/* Email Notification Settings */}
            <div className="field mt-4">
              <label className="block text-sm font-medium mb-3" style={{ color: colors.textPrimary }}>
                <i className="pi pi-envelope mr-2" style={{ color: colors.accent }}></i>
                {t.emailNotifications}
              </label>
              <div className="space-y-3 rounded-lg p-4" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}>
                {/* System Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {t.emailSystemNotifications}
                    </span>
                    <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                      {t.emailSystemNotificationsDesc}
                    </p>
                  </div>
                  <InputSwitch
                    checked={userData.email_system_notifications ?? true}
                    onChange={(e) => setUserData(prev => ({ ...prev, email_system_notifications: e.value }))}
                    disabled={loadingProfile}
                  />
                </div>
                <Divider className="my-2" style={{ borderColor: colors.borderSecondary }} />
                {/* User/Team Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {t.emailUserNotifications}
                    </span>
                    <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                      {t.emailUserNotificationsDesc}
                    </p>
                  </div>
                  <InputSwitch
                    checked={userData.email_user_notifications ?? true}
                    onChange={(e) => setUserData(prev => ({ ...prev, email_user_notifications: e.value }))}
                    disabled={loadingProfile}
                  />
                </div>
              </div>
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

        <TabPanel header="Security" leftIcon="pi pi-shield">
          <TwoFactorSection />
        </TabPanel>

        <TabPanel header="Subscriptions" leftIcon="pi pi-unlock">
          <div className="space-y-6">
            {/* Credits Display */}
            <div className="rounded-lg p-4" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}>
              <div className="flex justify-between items-center">
                <span className="text-lg" style={{ color: colors.textSecondary }}>{t.profilemodal1613}</span>
                <span className="font-bold text-2xl" style={{ color: colors.textPrimary }}>{cliStatus?.credits || 0}</span>
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

            {/* Attachment Storage Display */}
            {storageStatus && (
              <div
                className="rounded-lg p-4"
                style={{
                  backgroundColor: storageStatus.is_full
                    ? colors.errorBg
                    : storageStatus.is_warning
                      ? colors.warningBg
                      : colors.bgTertiary,
                  border: `1px solid ${storageStatus.is_full
                    ? colors.errorBorder
                    : storageStatus.is_warning
                      ? colors.warningBorder
                      : colors.borderSecondary}`
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="flex items-center gap-2" style={{ color: colors.textSecondary }}>
                    <i className="pi pi-cloud" style={{ color: colors.accent }}></i>
                    {t.profilemodal1647}
                  </span>
                  <span
                    className="font-bold"
                    style={{
                      color: storageStatus.is_full
                        ? colors.errorText
                        : storageStatus.is_warning
                          ? colors.warningText
                          : colors.textPrimary
                    }}
                  >
                    {storageStatus.is_unlimited
                      ? 'Unbegrenzt'
                      : `${storageStatus.used_formatted} / ${storageStatus.limit_formatted}`
                    }
                  </span>
                </div>
                {!storageStatus.is_unlimited && (
                  <>
                    <div className="w-full rounded-full h-2.5 mb-2" style={{ backgroundColor: colors.bgHover }}>
                      <div
                        className="h-2.5 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, storageStatus.percentage)}%`,
                          backgroundColor: storageStatus.is_full
                            ? colors.errorText
                            : storageStatus.is_warning
                              ? colors.warningText
                              : colors.accent
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs" style={{ color: colors.textMuted }}>
                      <span>{storageStatus.percentage}{t.profilemodal1681}</span>
                      <span>{storageStatus.remaining_formatted}{t.profilemodal1682}</span>
                    </div>
                    {storageStatus.is_full && (
                      <div className="mt-2 text-sm flex items-center gap-1" style={{ color: colors.errorText }}>
                        <i className="pi pi-exclamation-triangle"></i>
                        {t.profilemodal1687}
                      </div>
                    )}
                    {storageStatus.is_warning && !storageStatus.is_full && (
                      <div className="mt-2 text-sm flex items-center gap-1" style={{ color: colors.warningText }}>
                        <i className="pi pi-exclamation-circle"></i>
                        {t.profilemodal1693}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Patron Notice */}
            {cliStatus?.cli.is_patron && (
              <div className="rounded-lg p-4" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}>
                <p className="flex items-center gap-2" style={{ color: colors.infoText }}>
                  <i className="pi pi-star-fill" style={{ color: '#facc15' }}></i>
                  <strong>{t.profilemodal1706}</strong>{t.profilemodal1706_2}
                </p>
              </div>
            )}

            {/* All Available Features */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <i className="pi pi-th-large" style={{ color: colors.accent }}></i>
                {t.profilemodal1715}
              </h3>

              {loadingFeatures ? (
                <div className="flex items-center justify-center py-8">
                  <i className="pi pi-spin pi-spinner text-2xl" style={{ color: colors.accent }}></i>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Render features with special handling for bundle/cli/service */}
                  {allFeatures.map((feature) => {
                    // Skip cli and service as they are rendered inside bundle
                    if (feature.parentBundle) return null;

                    const isBundle = feature.isBundle;
                    const bundleChildren = isBundle ? allFeatures.filter(f => f.parentBundle === feature.type) : [];

                    return (
                      <div key={feature.type}>
                        {/* Feature Card */}
                        <div
                          className="rounded-lg p-4"
                          style={{
                            backgroundColor: isBundle
                              ? colors.infoBg
                              : colors.bgTertiary,
                            border: `1px solid ${isBundle
                              ? colors.infoBorder
                              : feature.unlocked
                                ? colors.successBorder
                                : colors.borderSecondary}`
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <i className={`pi ${feature.icon}`} style={{ color: colors.accent }}></i>
                                <span className="font-semibold" style={{ color: colors.textPrimary }}>{feature.name}</span>
                                {isBundle && (
                                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full font-bold" style={{ backgroundColor: colors.warningText, color: '#000' }}>
                                    {t.profilemodal1755}
                                  </span>
                                )}
                                {feature.is_patron && (
                                  <span className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: colors.accent, color: colors.textInverse }}>
                                    {t.profilemodal1760}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm" style={{ color: colors.textMuted }}>{feature.description}</p>

                              {/* Expiry Info */}
                              {feature.unlocked && !feature.is_patron && feature.expires_at && (
                                <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                                  {t.profilemodal1769}{new Date(feature.expires_at).toLocaleDateString('de-DE')}
                                  {feature.days_remaining !== null && ` (${feature.days_remaining} Tage)`}
                                </p>
                              )}
                            </div>

                            {/* Status Badge and Action */}
                            <div className="flex flex-col items-end gap-2">
                              {feature.unlocked ? (
                                <>
                                  <span className="px-3 py-1 rounded-full text-sm flex items-center gap-1" style={{ backgroundColor: colors.buttonSuccess, color: colors.textInverse }}>
                                    <i className="pi pi-check"></i> Aktiv
                                  </span>
                                  {/* Extend button for already unlocked features (not for patron) */}
                                  {!feature.is_patron && !feature.requiresEntity && (
                                    <Button
                                      type="button"
                                      onClick={() => {
                                        if (isBundle) {
                                          handleUnlock('bundle');
                                        } else if (feature.type === 'cli') {
                                          handleUnlock('cli');
                                        } else if (feature.type === 'service') {
                                          handleUnlock('service');
                                        } else {
                                          handleFeatureUnlock(feature.type);
                                        }
                                      }}
                                      loading={unlocking === feature.type}
                                      disabled={unlocking !== null || (cliStatus?.credits || 0) < feature.cost}
                                      className="p-button-sm p-button-outlined mt-1"
                                      icon="pi pi-plus"
                                      label={`+1 Jahr (${feature.cost} Cr)`}
                                    />
                                  )}
                                </>
                              ) : (
                                <>
                                  <span className="px-3 py-1 rounded-full text-sm flex items-center gap-1" style={{ backgroundColor: colors.bgHover, color: colors.textSecondary }}>
                                    <i className="pi pi-lock"></i>{t.profilemodal1808}
                                  </span>
                                  {!feature.is_patron && (
                                    <>
                                      {/* Entity-based features (like Team) - show info + button */}
                                      {feature.requiresEntity ? (
                                        <div className="mt-2 text-right">
                                          <span className="text-xs block mb-1" style={{ color: colors.textMuted }}>{feature.entityInfo}</span>
                                          <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: colors.bgHover, color: colors.textSecondary }}>
                                            {feature.cost}{t.profilemodal1817}{feature.name}
                                          </span>
                                        </div>
                                      ) : isBundle && bundleDiscountInfo?.has_existing_subscriptions ? (
                                        /* Bundle with existing subscriptions - show options */
                                        <Button
                                          type="button"
                                          onClick={() => setShowBundleOptions(true)}
                                          className="p-button-success p-button-sm mt-2"
                                          icon="pi pi-unlock"
                                          label={`Bundle Optionen`}
                                        />
                                      ) : (
                                        <Button
                                          type="button"
                                          onClick={() => {
                                            if (isBundle) {
                                              handleUnlock('bundle');
                                            } else if (feature.type === 'cli') {
                                              handleUnlock('cli');
                                            } else if (feature.type === 'service') {
                                              handleUnlock('service');
                                            } else {
                                              // Other features (database_designer, form_designer, etc.)
                                              handleFeatureUnlock(feature.type);
                                            }
                                          }}
                                          loading={unlocking === feature.type}
                                          disabled={unlocking !== null || (cliStatus?.credits || 0) < feature.cost}
                                          className={`p-button-sm mt-2 ${isBundle ? 'p-button-success' : 'p-button-primary'}`}
                                          icon="pi pi-unlock"
                                          label={`${feature.cost}${t.profilemodal1848}`}
                                        />
                                      )}
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bundle Children (CLI and Service) - indented with tree line */}
                        {isBundle && bundleChildren.length > 0 && (
                          <div className="ml-4 mt-2 space-y-2">
                            {bundleChildren.map((child, index) => (
                              <div key={child.type} className="flex">
                                {/* Tree line indicator */}
                                <div className="flex flex-col items-center mr-3" style={{ width: '20px' }}>
                                  <div className={`w-px ${index === 0 ? 'h-4' : 'h-full'}`} style={{ backgroundColor: colors.borderSecondary }}></div>
                                  <span className="text-lg leading-none" style={{ color: colors.textMuted }}>└</span>
                                </div>

                                {/* Child Feature Card */}
                                <div
                                  className="flex-1 rounded-lg p-3"
                                  style={{
                                    backgroundColor: `${colors.bgTertiary}b3`,
                                    border: `1px solid ${child.unlocked ? `${colors.successBorder}80` : colors.borderSecondary}`
                                  }}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <i className={`pi ${child.icon} text-sm`} style={{ color: colors.accent }}></i>
                                      <span className="font-medium text-sm" style={{ color: colors.textPrimary }}>{child.name}</span>
                                      {child.unlocked && (
                                        <span
                                          className="px-2 py-0.5 rounded-full text-xs"
                                          style={{
                                            backgroundColor: child.covered_by_bundle ? `${colors.accent}b3` : `${colors.buttonSuccess}b3`,
                                            color: colors.textInverse
                                          }}
                                        >
                                          {child.covered_by_bundle ? 'Im Bundle' : 'Aktiv'}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {/* Only show extend button if NOT covered by bundle */}
                                      {child.unlocked && !child.is_patron && !child.covered_by_bundle && (
                                        <Button
                                          type="button"
                                          onClick={() => handleUnlock(child.type as 'cli' | 'service')}
                                          loading={unlocking === child.type}
                                          disabled={unlocking !== null || (cliStatus?.credits || 0) < child.cost}
                                          className="p-button-sm p-button-outlined"
                                          icon="pi pi-plus"
                                          label={`+1 Jahr`}
                                        />
                                      )}
                                      {!child.unlocked && !child.is_patron && (
                                        <Button
                                          type="button"
                                          onClick={() => handleUnlock(child.type as 'cli' | 'service')}
                                          loading={unlocking === child.type}
                                          disabled={unlocking !== null || (cliStatus?.credits || 0) < child.cost}
                                          className="p-button-sm p-button-outlined"
                                          icon="pi pi-unlock"
                                          label={`${child.cost} Cr`}
                                        />
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-xs mt-1" style={{ color: colors.textMuted }}>{child.description}</p>
                                  {child.unlocked && !child.is_patron && child.expires_at && (
                                    <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                      {child.covered_by_bundle ? t.profilemodal1924 : t.profilemodal1924_2}
                                      {new Date(child.expires_at).toLocaleDateString('de-DE')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Not enough credits warning */}
            {cliStatus && !cliStatus.cli.is_patron && (cliStatus.credits < 50) && (
              <div className="rounded-lg p-3" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}` }}>
                <p className="text-sm flex items-center gap-2" style={{ color: colors.errorText }}>
                  <i className="pi pi-exclamation-triangle"></i>
                  {t.profilemodal1945}
                </p>
              </div>
            )}

            {/* All Active Subscriptions Overview - Only entity-based (projects, databases, teams, templates) */}
            <Divider style={{ borderColor: colors.borderSecondary }} />
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <i className="pi pi-list" style={{ color: colors.accent }}></i>
                {t.profilemodal1955}
              </h3>
              <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                {t.profilemodal1958}
              </p>

              {(() => {
                // Filter out global features that are shown above
                const globalFeatureTypes = ['bundle', 'cli', 'service', 'database_designer', 'form_designer', 'git_integration', 'code_adjustments', 'schema_migration', 'team'];
                const entitySubscriptions = allSubscriptions.filter(sub => !globalFeatureTypes.includes(sub.type));

                if (loadingSubscriptions) {
                  return (
                    <div className="flex items-center justify-center py-8">
                      <i className="pi pi-spin pi-spinner text-2xl" style={{ color: colors.accent }}></i>
                    </div>
                  );
                }

                if (entitySubscriptions.length === 0) {
                  return (
                    <div className="rounded-lg p-4 text-center" style={{ backgroundColor: `${colors.bgTertiary}80` }}>
                      <p style={{ color: colors.textMuted }}>{t.profilemodal1977}</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {entitySubscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="rounded-lg p-4"
                      style={{
                        backgroundColor: colors.bgTertiary,
                        border: `1px solid ${
                          sub.is_expired || sub.is_soft_locked
                            ? colors.errorBorder
                            : sub.is_eligible_for_bonus
                            ? colors.warningBorder
                            : sub.days_until_expiry !== null && sub.days_until_expiry <= 14
                            ? colors.warningBorder
                            : colors.borderSecondary
                        }`
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold" style={{ color: colors.textPrimary }}>{sub.type_display}</span>
                            {sub.entity_name && (
                              <span style={{ color: colors.textMuted }}>- {sub.entity_name}</span>
                            )}
                            {sub.is_patron && (
                              <span className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: colors.accent, color: colors.textInverse }}>
                                Patron
                              </span>
                            )}
                          </div>

                          {/* Expiry Info */}
                          {sub.expires_at_formatted ? (
                            <div className="text-sm">
                              {sub.is_expired || sub.is_soft_locked ? (
                                <span className="flex items-center gap-1" style={{ color: colors.errorText }}>
                                  <i className="pi pi-exclamation-circle"></i>
                                  Abgelaufen am {sub.expires_at_formatted}
                                </span>
                              ) : sub.days_until_expiry !== null && sub.days_until_expiry <= 3 ? (
                                <span className="flex items-center gap-1" style={{ color: colors.errorText }}>
                                  <i className="pi pi-clock"></i>
                                  {t.profilemodal2026}{sub.days_until_expiry} {sub.days_until_expiry === 1 ? t.profilemodal2026_2 : t.profilemodal2026_3} ({sub.expires_at_formatted})
                                </span>
                              ) : sub.days_until_expiry !== null && sub.days_until_expiry <= 14 ? (
                                <span className="flex items-center gap-1" style={{ color: colors.warningText }}>
                                  <i className="pi pi-clock"></i>
                                  {t.profilemodal2031}{sub.days_until_expiry}{t.profilemodal2031_2}({sub.expires_at_formatted})
                                </span>
                              ) : (
                                <span style={{ color: colors.textMuted }}>
                                  Gültig bis {sub.expires_at_formatted}
                                  {sub.days_until_expiry !== null && ` (${sub.days_until_expiry} Tage)`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm" style={{ color: colors.successText }}>Unbegrenzt gültig</span>
                          )}

                          {/* Early Renewal Bonus */}
                          {sub.is_eligible_for_bonus && (
                            <div className="mt-2 px-2 py-1 rounded text-xs inline-flex items-center gap-1" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successBorder}`, color: colors.successText }}>
                              <i className="pi pi-gift"></i>
                              {t.profilemodal2048}+{sub.bonus_days}{t.profilemodal2048_2}
                            </div>
                          )}
                        </div>

                        {/* Renew Button */}
                        {!sub.is_patron && sub.expires_at && (
                          <Button
                            type="button"
                            onClick={() => renewSubscription(sub.id)}
                            loading={renewingSubscription === sub.id}
                            disabled={renewingSubscription !== null || (cliStatus?.credits || 0) < sub.renewal_cost}
                            className={`p-button-sm ${
                              sub.is_expired || sub.is_soft_locked
                                ? 'p-button-danger'
                                : sub.is_eligible_for_bonus
                                ? 'p-button-success'
                                : 'p-button-outlined'
                            }`}
                            icon={sub.is_expired ? 'pi pi-refresh' : 'pi pi-sync'}
                            label={`${sub.is_expired ? 'Reaktivieren' : 'Verlängern'} (${sub.renewal_cost} Cr)`}
                          />
                        )}
                      </div>
                    </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Bundle Options Dialog */}
            <Dialog
              header="Bundle Optionen"
              visible={showBundleOptions}
              onHide={() => setShowBundleOptions(false)}
              style={{ width: '500px' }}
              modal
            >
              <div className="space-y-4">
                <p style={{ color: colors.textSecondary }}>
                  {t.profilemodal2089}
                </p>
                {bundleDiscountInfo?.options.map((option: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-lg p-4 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: colors.bgTertiary,
                      border: `1px solid ${option.price < 0 ? colors.successBorder : colors.borderSecondary}`
                    }}
                    onClick={() => {
                      setShowBundleOptions(false);
                      handleUnlock('bundle', option.type);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold" style={{ color: colors.textPrimary }}>{option.label}</span>
                      {option.price < 0 ? (
                        <span className="text-lg font-bold flex items-center gap-1" style={{ color: colors.successText }}>
                          <i className="pi pi-plus-circle"></i>
                          +{Math.abs(option.price)} Credits
                        </span>
                      ) : option.price === 0 ? (
                        <span className="text-lg font-bold" style={{ color: colors.warningText }}>Kostenlos!</span>
                      ) : (
                        <span className="text-lg font-bold" style={{ color: colors.accent }}>{option.price} Credits</span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: colors.textMuted }}>{option.description}</p>
                    {option.price < 0 && (
                      <div className="mt-2 px-3 py-2 rounded text-sm flex items-center gap-2" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successBorder}`, color: colors.successText }}>
                        <i className="pi pi-gift"></i>
                        <span>{t.profilemodal2121}<strong>{Math.abs(option.price)} Credits</strong>{t.profilemodal2121_2}</span>
                      </div>
                    )}
                    {option.discount && option.discount > 0 && option.price >= 0 && (
                      <div className="mt-2 text-sm flex items-center gap-1" style={{ color: colors.warningText }}>
                        <i className="pi pi-tag"></i>
                        Sie sparen {option.discount} Credits!
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Dialog>
          </div>
        </TabPanel>

        <TabPanel header={t.profilemodal611} leftIcon="pi pi-credit-card">
          <div className="space-y-6">
            {/* Current Plan Info */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgTertiary, borderLeft: `4px solid ${colors.accent}` }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{t.profilemodal616}</h3>
                <Badge
                  value={cliStatus?.cli.is_patron ? (userData.user_type === 'patron' ? 'Patron' : 'Free') : 'Free'}
                  severity={cliStatus?.cli.is_patron ? 'success' : 'info'}
                />
              </div>
              <p style={{ color: colors.textSecondary }}>
                {cliStatus?.cli.is_patron
                  ? t.profilemodal2150
                  : t.profilemodal2151
                }
              </p>
            </div>

            {/* Patron Notice or Upgrade Option */}
            {cliStatus?.cli.is_patron ? (
              <div className="rounded-lg p-4" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}>
                <p className="flex items-center gap-2" style={{ color: colors.infoText }}>
                  <i className="pi pi-star-fill" style={{ color: '#facc15' }}></i>
                  <strong>{t.profilemodal2161}</strong>{t.profilemodal2161_2}
                </p>
              </div>
            ) : (
              <div className="rounded-lg p-4" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                      <i className="pi pi-heart-fill" style={{ color: '#f87171' }}></i>
                      {t.profilemodal2170}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                      {t.profilemodal2173}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleViewPlans}
                    className="p-button-help"
                    icon="pi pi-star"
                    label={t.profilemodal2181}
                  />
                </div>
              </div>
            )}

            {/* Credits Section */}
            <div className="rounded-lg p-4" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg" style={{ color: colors.textSecondary }}>{t.profilemodal2190}</span>
                <span className="font-bold text-2xl" style={{ color: colors.textPrimary }}>{cliStatus?.credits || userData.credits || 0}</span>
              </div>
              <p className="text-sm mb-3" style={{ color: colors.textMuted }}>
                {t.profilemodal2194}
              </p>
              <Button
                type="button"
                onClick={handleBuyCredits}
                className="p-button-outlined p-button-info w-full"
                icon="pi pi-shopping-cart"
                label={t.profilemodal2201}
              />
            </div>

            {/* Quick Info */}
            <div className="rounded-lg p-4" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}>
              <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: colors.infoText }}>
                <i className="pi pi-info-circle"></i>
                {t.profilemodal2209}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div style={{ color: colors.textSecondary }}>
                  <i className="pi pi-folder mr-2" style={{ color: colors.accent }}></i>
                  {t.profilemodal2214}
                </div>
                <div style={{ color: colors.textSecondary }}>
                  <i className="pi pi-database mr-2" style={{ color: colors.successText }}></i>
                  {t.profilemodal2218}
                </div>
                <div style={{ color: colors.textSecondary }}>
                  <i className="pi pi-users mr-2" style={{ color: colors.accent }}></i>
                  {t.profilemodal2222}
                </div>
                <div style={{ color: colors.textSecondary }}>
                  <i className="pi pi-code mr-2" style={{ color: colors.warningText }}></i>
                  {t.profilemodal2226}
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Seller Profile Tab */}
        <TabPanel header={t.profilemodal2234 || "Verkäufer"} leftIcon="pi pi-shopping-bag">
          <form onSubmit={handleSellerSubmit} className="space-y-6">
            {sellerError && (
              <Message severity="error" text={sellerError} className="w-full" />
            )}
            {sellerSuccess && (
              <Message severity="success" text={sellerSuccess} className="w-full" />
            )}

            {/* Enable Seller Mode */}
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}>
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <i className="pi pi-shopping-bag" style={{ color: colors.successText }}></i>
                  {t.profilemodal2248}
                </h3>
                <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                  {t.profilemodal2251}
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
                  <div className="p-4 rounded-lg" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successBorder}` }}>
                    <p className="text-sm" style={{ color: colors.textMuted }}>{t.profilemodal2265}</p>
                    <p className="text-2xl font-bold" style={{ color: colors.successText }}>
                      {parseFloat(String(userData.pending_earnings || 0)).toFixed(2)} €
                    </p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}>
                    <p className="text-sm" style={{ color: colors.textMuted }}>{t.profilemodal2271}</p>
                    <p className="text-2xl font-bold" style={{ color: colors.infoText }}>
                      {parseFloat(String(userData.total_earnings || 0)).toFixed(2)} €
                    </p>
                  </div>
                </div>

                <Divider style={{ borderColor: colors.borderSecondary }} />

                {/* Company Information */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                    <i className="pi pi-building" style={{ color: colors.accent }}></i>
                    {t.profilemodal2284 || 'Unternehmensdaten'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="field">
                      <label htmlFor="company_name" className="block text-sm font-medium mb-2">
                        {t.profilemodal2290 || 'Firmenname / Name *'}
                      </label>
                      <InputText
                        id="company_name"
                        value={sellerData.company_name}
                        onChange={(e) => setSellerData(prev => ({ ...prev, company_name: e.target.value }))}
                        className="w-full"
                        placeholder={t.profilemodal2297 || "Musterfirma GmbH"}
                      />
                    </div>

                    <div className="field profile-themed-dropdown">
                      <label htmlFor="company_country" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                        {t.profilemodal2303 || 'Land *'}
                      </label>
                      <Dropdown
                        id="company_country"
                        value={sellerData.company_country}
                        options={countries}
                        onChange={(e) => setSellerData(prev => ({ ...prev, company_country: e.value }))}
                        className="w-full"
                        placeholder={t.profilemodal2311 || "Land auswählen"}
                        filter
                        panelClassName="profile-language-dropdown-panel"
                        style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderSecondary }}
                      />
                    </div>
                  </div>

                  <div className="field mt-4">
                    <label htmlFor="company_address" className="block text-sm font-medium mb-2">
                      {t.profilemodal2321 || 'Adresse'}
                    </label>
                    <InputTextarea
                      id="company_address"
                      value={sellerData.company_address}
                      onChange={(e) => setSellerData(prev => ({ ...prev, company_address: e.target.value }))}
                      className="w-full"
                      rows={3}
                      placeholder={t.profilemodal2329}
                    />
                  </div>
                </div>

                <Divider />

                {/* VAT / Tax Information */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <i className="pi pi-file text-yellow-400"></i>
                    {t.profilemodal2340 || 'Steuer-Informationen'}
                  </h4>

                  {isEuCountry ? (
                    <div className="field">
                      <label htmlFor="vat_id" className="block text-sm font-medium mb-2">
                        {t.profilemodal2346 || 'UID-Nummer (USt-IdNr.)'}
                        {sellerData.company_country !== 'AT' && (
                          <span className="text-yellow-400 ml-2">{t.profilemodal2348 || '* Für Reverse Charge erforderlich'}</span>
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
                          ? (t.profilemodal2360 || 'Österreichische Unternehmen erhalten Gutschriften inkl. USt.')
                          : (t.profilemodal2361_2 || 'EU-Unternehmen mit UID erhalten Netto-Gutschriften (Reverse Charge).')
                        }
                      </small>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="field">
                        <label htmlFor="business_registration" className="block text-sm font-medium mb-2">
                          {t.profilemodal2369 || 'Gewerbeschein / Business Registration'}
                        </label>
                        <InputText
                          id="business_registration"
                          value={sellerData.business_registration}
                          onChange={(e) => setSellerData(prev => ({ ...prev, business_registration: e.target.value }))}
                          className="w-full"
                          placeholder={t.profilemodal2376 || "Registrierungsnummer"}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="tax_id" className="block text-sm font-medium mb-2">
                          {t.profilemodal2381 || 'Steuer-ID / Tax ID'}
                        </label>
                        <InputText
                          id="tax_id"
                          value={sellerData.tax_id}
                          onChange={(e) => setSellerData(prev => ({ ...prev, tax_id: e.target.value }))}
                          className="w-full"
                          placeholder={t.profilemodal2388 || "Steuer-ID"}
                        />
                      </div>
                      <Message
                        severity="info"
                        text={t.profilemodal2393 || "Ohne Unternehmensnachweis wird von Ihrer Auszahlung 20% MwSt abgezogen."}
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
                    {t.profilemodal2406 || 'Auszahlungsmethode'}
                  </h4>

                  <div className="field mb-4 profile-themed-dropdown">
                    <label htmlFor="payout_method" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                      {t.profilemodal2411 || 'Auszahlungsart *'}
                    </label>
                    <Dropdown
                      id="payout_method"
                      value={sellerData.payout_method}
                      options={payoutMethods}
                      onChange={(e) => setSellerData(prev => ({ ...prev, payout_method: e.value }))}
                      className="w-full"
                      placeholder={t.profilemodal2419 || "Auszahlungsart wählen"}
                      panelClassName="profile-language-dropdown-panel"
                      style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderSecondary }}
                    />
                  </div>

                  {sellerData.payout_method === 'paypal' && (
                    <div className="field p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                      <label htmlFor="paypal_payout_email" className="block text-sm font-medium mb-2">
                        <i className="pi pi-paypal mr-2"></i>
                        {t.profilemodal2429 || 'PayPal-E-Mail-Adresse *'}
                      </label>
                      <InputText
                        id="paypal_payout_email"
                        type="email"
                        value={sellerData.paypal_payout_email}
                        onChange={(e) => setSellerData(prev => ({ ...prev, paypal_payout_email: e.target.value }))}
                        className="w-full"
                        placeholder={t.profilemodal2437 || "ihre-email@paypal.com"}
                      />
                    </div>
                  )}

                  {sellerData.payout_method === 'bank_transfer' && (
                    <div className="space-y-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                      <div className="field">
                        <label htmlFor="bank_account_holder" className="block text-sm font-medium mb-2">
                          {t.profilemodal2446 || 'Kontoinhaber *'}
                        </label>
                        <InputText
                          id="bank_account_holder"
                          value={sellerData.bank_account_holder}
                          onChange={(e) => setSellerData(prev => ({ ...prev, bank_account_holder: e.target.value }))}
                          className="w-full"
                          placeholder={t.profilemodal2453 || "Max Mustermann"}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="bank_iban" className="block text-sm font-medium mb-2">
                          {t.profilemodal2458 || 'IBAN *'}
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
                          {t.profilemodal2470 || 'BIC/SWIFT'}
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
                  <h5 className="font-semibold text-white mb-2">{t.profilemodal2486}</h5>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>{t.profilemodal2488 || '• Auszahlungen erfolgen monatlich (Anfang des Folgemonats)'}</li>
                    <li>{t.profilemodal2489 || '• Mindestauszahlung: 10,00 €'}</li>
                    <li>{t.profilemodal2490 || '• Sie erhalten 80% des Verkaufspreises'}</li>
                    <li>{t.profilemodal2491 || '• 20% verbleiben bei der Plattform'}</li>
                  </ul>
                </div>
              </>
            )}

            <Button
              type="submit"
              label={savingSeller ? (t.profilemodal2499 || "Speichern...") : (t.profilemodal2499_2 || "Verkäufer-Profil speichern")}
              icon={savingSeller ? "pi pi-spinner pi-spin" : "pi pi-save"}
              disabled={savingSeller}
              className="w-full"
            />
          </form>
        </TabPanel>

        {/* Git Integration Tab */}
        <TabPanel header="Git" leftIcon="pi pi-github">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <i className="pi pi-link" style={{ color: colors.accent }}></i>
                {t.profilemodal2513 || 'Git Provider verbinden'}
                {gitIntegrationAccess?.has_access && gitIntegrationAccess.is_patron && (
                  <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: colors.accent, color: colors.textInverse }}>Patron</span>
                )}
                {gitIntegrationAccess?.has_access && !gitIntegrationAccess.is_patron && gitIntegrationAccess.days_remaining !== undefined && (
                  <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: colors.infoBorder, color: colors.textInverse }}>
                    {gitIntegrationAccess.days_remaining} {t.profilemodal2519}
                  </span>
                )}
              </h3>
              <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                {t.profilemodal2524}
              </p>
            </div>

            {/* Subscription Required Banner */}
            {gitIntegrationAccess && !gitIntegrationAccess.has_access && (
              <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1" style={{ color: colors.infoText }}>
                      <i className="pi pi-lock"></i>
                      <span className="font-semibold">{t.profilemodal2535}</span>
                    </div>
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                      {t.profilemodal2538}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold mb-1" style={{ color: colors.infoText }}>
                      {gitIntegrationAccess.unlock_cost} Credits
                    </div>
                    <div className="text-xs mb-2" style={{ color: colors.textMuted }}>{t.profilemodal2545}</div>
                    <Button
                      type="button"
                      label={unlockingGit ? t.profilemodal2548 : t.profilemodal2548_2}
                      icon={unlockingGit ? "pi pi-spinner pi-spin" : "pi pi-unlock"}
                      className="p-button-sm"
                      style={{ backgroundColor: colors.accent, borderColor: colors.accent }}
                      onClick={unlockGitIntegration}
                      disabled={unlockingGit || (cliStatus?.credits || 0) < (gitIntegrationAccess.unlock_cost || 50)}
                    />
                    {(cliStatus?.credits || 0) < (gitIntegrationAccess.unlock_cost || 50) && (
                      <p className="text-xs mt-1" style={{ color: colors.errorText }}>{t.profilemodal2556}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {loadingGitProviders ? (
              <div className="flex justify-center py-8">
                <i className="pi pi-spinner pi-spin text-2xl" style={{ color: colors.accent }}></i>
              </div>
            ) : gitIntegrationAccess?.has_access === false ? (
              <div className="text-center py-8" style={{ color: colors.textMuted }}>
                <i className="pi pi-lock text-4xl mb-2"></i>
                <p>{t.profilemodal2570}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* GitHub */}
                <div className="rounded-lg p-4" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.bgHover }}>
                        <i className="pi pi-github text-xl" style={{ color: colors.textPrimary }}></i>
                      </div>
                      <div>
                        <h4 className="font-semibold" style={{ color: colors.textPrimary }}>GitHub</h4>
                        {gitProviders.find(p => p.provider === 'github') ? (
                          <p className="text-sm flex items-center gap-1" style={{ color: colors.successText }}>
                            <i className="pi pi-check-circle"></i>
                            {t.profilemodal2586}@{gitProviders.find(p => p.provider === 'github')?.username}
                          </p>
                        ) : (
                          <p className="text-sm" style={{ color: colors.textMuted }}>{t.profilemodal2589}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      {gitProviders.find(p => p.provider === 'github') ? (
                        <Button
                          type="button"
                          label={t.profilemodal2597}
                          icon={disconnectingProvider === 'github' ? 'pi pi-spinner pi-spin' : 'pi pi-times'}
                          className="p-button-danger p-button-sm"
                          onClick={() => disconnectGitProvider('github')}
                          disabled={disconnectingProvider !== null}
                        />
                      ) : (
                        <Button
                          type="button"
                          label={t.profilemodal2606}
                          icon={connectingProvider === 'github' ? 'pi pi-spinner pi-spin' : 'pi pi-link'}
                          className="p-button-primary p-button-sm"
                          onClick={() => connectGitProvider('github')}
                          disabled={connectingProvider !== null}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* GitLab */}
                <div className="rounded-lg p-4" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.warningBg }}>
                        <svg width="20" height="20" viewBox="0 0 380 380" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M190.044 362.424L258.115 153.039H121.973L190.044 362.424Z" fill="#E24329"/>
                          <path d="M190.044 362.424L121.973 153.039H18.3215L190.044 362.424Z" fill="#FC6D26"/>
                          <path d="M18.3215 153.039L0.548553 207.679C-1.03196 212.551 0.774928 217.903 5.00759 220.977L190.044 362.424L18.3215 153.039Z" fill="#FCA326"/>
                          <path d="M18.3215 153.039H121.973L79.0326 21.5082C77.2303 15.9733 69.3552 15.9733 67.5528 21.5082L18.3215 153.039Z" fill="#E24329"/>
                          <path d="M190.044 362.424L258.115 153.039H361.766L190.044 362.424Z" fill="#FC6D26"/>
                          <path d="M361.766 153.039L379.539 207.679C381.12 212.551 379.313 217.903 375.08 220.977L190.044 362.424L361.766 153.039Z" fill="#FCA326"/>
                          <path d="M361.766 153.039H258.115L301.055 21.5082C302.858 15.9733 310.733 15.9733 312.535 21.5082L361.766 153.039Z" fill="#E24329"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold" style={{ color: colors.textPrimary }}>GitLab</h4>
                        {gitProviders.find(p => p.provider === 'gitlab') ? (
                          <p className="text-sm flex items-center gap-1" style={{ color: colors.successText }}>
                            <i className="pi pi-check-circle"></i>
                            {t.profilemodal2637}@{gitProviders.find(p => p.provider === 'gitlab')?.username}
                          </p>
                        ) : (
                          <p className="text-sm" style={{ color: colors.textMuted }}>Nicht verbunden</p>
                        )}
                      </div>
                    </div>
                    <div>
                      {gitProviders.find(p => p.provider === 'gitlab') ? (
                        <Button
                          type="button"
                          label={t.profilemodal2648}
                          icon={disconnectingProvider === 'gitlab' ? 'pi pi-spinner pi-spin' : 'pi pi-times'}
                          className="p-button-danger p-button-sm"
                          onClick={() => disconnectGitProvider('gitlab')}
                          disabled={disconnectingProvider !== null}
                        />
                      ) : (
                        <Button
                          type="button"
                          label={t.profilemodal2657}
                          icon={connectingProvider === 'gitlab' ? 'pi pi-spinner pi-spin' : 'pi pi-link'}
                          className="p-button-primary p-button-sm"
                          onClick={() => connectGitProvider('gitlab')}
                          disabled={connectingProvider !== null}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="rounded-lg p-4 mt-4" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}>
                  <h5 className="font-semibold mb-2 flex items-center gap-2" style={{ color: colors.infoText }}>
                    <i className="pi pi-info-circle"></i>
                    {t.profilemodal2672}
                  </h5>
                  <ul className="text-sm space-y-1" style={{ color: colors.textMuted }}>
                    <li>{t.profilemodal2675}</li>
                    <li>{t.profilemodal2676}</li>
                    <li>{t.profilemodal2677}</li>
                    <li>{t.profilemodal2678}</li>
                    <li>{t.profilemodal2679}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
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
                {t.profilemodal2708}
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
                {t.profilemodal2740}"DELETE"{t.profilemodal2740_2}
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
                {t.profilemodal2753}"DELETE"{t.profilemodal2753_2}
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