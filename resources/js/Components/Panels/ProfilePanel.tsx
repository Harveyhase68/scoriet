import React, { useState, useEffect, useCallback } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { Avatar } from 'primereact/avatar';
import { Message } from 'primereact/message';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Divider } from 'primereact/divider';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import PlanModal from '@/Components/AuthModals/PlanModal';

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  created_at: string;
  last_login_at?: string;
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

export default function ProfilePanel() {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Profile Form Data
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  });

  // Password Form Data
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });

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

  // Benutzer-Daten beim Mount laden
  useEffect(() => {
    loadUserData();
    loadCliStatus();
  }, []);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t.profilepanel58);
      }

      const userData = await response.json();
      setUser(userData);
      setProfileData({
        name: userData.name,
        email: userData.email
      });
      // Load seller data
      setSellerData({
        is_seller: userData.is_seller || false,
        company_name: userData.company_name || '',
        company_address: userData.company_address || '',
        company_country: userData.company_country || '',
        vat_id: userData.vat_id || '',
        business_registration: userData.business_registration || '',
        tax_id: userData.tax_id || '',
        payout_method: userData.payout_method || '',
        paypal_payout_email: userData.paypal_payout_email || '',
        bank_iban: userData.bank_iban || '',
        bank_bic: userData.bank_bic || '',
        bank_account_holder: userData.bank_account_holder || '',
      });

    } catch {
      setError(_ instanceof Error ? _.message : t.authmodalsegistermodal109);
    } finally {
      setLoading(false);
    }
  };

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
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
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

      setSuccess(data.message);
      // Reload status
      loadCliStatus();
      loadUserData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
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
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
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

      setSuccess('Verkäufer-Profil erfolgreich gespeichert');
      loadUserData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setSavingSeller(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.profilepanel100);
      }

      setSuccess(t.authcontroller310);
      setUser(prev => prev ? { ...prev, ...profileData } : null);

    } catch {
      setError(_ instanceof Error ? _.message : t.authmodalsegistermodal109);
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    // Passwort-Bestätigung prüfen
    if (passwordData.password !== passwordData.password_confirmation) {
      setError(t.profilemodal246);
      setUpdating(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.profilepanel145);
      }

      setSuccess(t.authcontroller346);
      setPasswordData({
        current_password: '',
        password: '',
        password_confirmation: ''
      });

    } catch {
      setError(_ instanceof Error ? _.message : t.authmodalsegistermodal109);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-full">
        <i className="pi pi-spinner pi-spin" style={{ fontSize: '2rem' }}></i>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Avatar 
            label={user?.name.charAt(0).toUpperCase()} 
            size="xlarge" 
            className="bg-blue-500 text-white"
          />
          <div>
            <h1 className="text-2xl font-bold">{user?.name}</h1>
            <p className="text-gray-600">{user?.email}</p>
            {user?.last_login_at && (
              <p className="text-sm text-gray-500">
                Letzter Login: {new Date(user.last_login_at).toLocaleString('de-DE')}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <Message severity="error" text={error} className="w-full mb-4" />
      )}

      {success && (
        <Message severity="success" text={success} className="w-full mb-4" />
      )}

      <TabView>
        <TabPanel header={t.profilepanel200} leftIcon="pi pi-user">
          <Card className="shadow-md">
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="field">
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name
                </label>
                <InputText
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({...prev, name: e.target.value}))}
                  className="w-full"
                  disabled={updating}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  E-Mail
                </label>
                <InputText
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({...prev, email: e.target.value}))}
                  className="w-full"
                  disabled={updating}
                  required
                />
              </div>

              <Button
                type="submit"
                label={updating ? "Speichern..." : t.updateProfile}
                icon={updating ? "pi pi-spinner pi-spin" : "pi pi-save"}
                disabled={updating}
              />
            </form>
          </Card>
        </TabPanel>

        <TabPanel header={t.passwordTab} leftIcon="pi pi-key">
          <Card className="shadow-md">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="field">
                <label htmlFor="current_password" className="block text-sm font-medium mb-2">
                  Aktuelles Passwort
                </label>
                <Password
                  id="current_password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData(prev => ({...prev, current_password: e.target.value}))}
                  className="w-full"
                  inputClassName="w-full"
                  disabled={updating}
                  feedback={false}
                  toggleMask
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="new_password" className="block text-sm font-medium mb-2">
                  Neues Passwort
                </label>
                <Password
                  id="new_password"
                  value={passwordData.password}
                  onChange={(e) => setPasswordData(prev => ({...prev, password: e.target.value}))}
                  className="w-full"
                  inputClassName="w-full"
                  disabled={updating}
                  feedback={true}
                  toggleMask
                  required
                  promptLabel={t.panelsegisterpanel161}
                  weakLabel={t.panelsegisterpanel162}
                  mediumLabel={t.panelsegisterpanel163}
                  strongLabel={t.panelsegisterpanel164}
                />
              </div>

              <div className="field">
                <label htmlFor="password_confirmation" className="block text-sm font-medium mb-2">
                  Neues Passwort bestätigen
                </label>
                <Password
                  id="password_confirmation"
                  value={passwordData.password_confirmation}
                  onChange={(e) => setPasswordData(prev => ({...prev, password_confirmation: e.target.value}))}
                  className="w-full"
                  inputClassName="w-full"
                  disabled={updating}
                  feedback={false}
                  toggleMask
                  required
                />
              </div>

              <Button
                type="submit"
                label={updating ? t.profilepanel302 : t.passwordTab}
                icon={updating ? "pi pi-spinner pi-spin" : "pi pi-key"}
                disabled={updating}
              />
            </form>
          </Card>
        </TabPanel>

        <TabPanel header={t.profilepanel310} leftIcon="pi pi-info-circle">
          <Card className="shadow-md">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Benutzer-ID
                </label>
                <p className="text-gray-900">{user?.id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registriert seit
                </label>
                <p className="text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('de-DE') : '-'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail verifiziert
                </label>
                <p className="text-gray-900">
                  {user?.email_verified_at ? (
                    <span className="text-green-600">
                      <i className="pi pi-check-circle mr-1"></i>
                      Verifiziert am {new Date(user.email_verified_at).toLocaleDateString('de-DE')}
                    </span>
                  ) : (
                    <span className="text-orange-600">
                      <i className="pi pi-exclamation-triangle mr-1"></i>
                      Nicht verifiziert
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Letzter Login
                </label>
                <p className="text-gray-900">
                  {user?.last_login_at ? 
                    new Date(user.last_login_at).toLocaleString('de-DE') : 
                    t.profilepanel355
                  }
                </p>
              </div>
            </div>
          </Card>
        </TabPanel>

        <TabPanel header="Subscriptions" leftIcon="pi pi-unlock">
          <Card className="shadow-md">
            <div className="space-y-6">
              {/* Credits Display */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-lg">Ihre Credits:</span>
                  <span className="text-white font-bold text-2xl">{cliStatus?.credits || user?.credits || 0}</span>
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

              {/* Patron Notice or Upgrade Option */}
              {cliStatus?.cli.is_patron ? (
                <div className="bg-purple-900/30 border border-purple-600 rounded-lg p-4">
                  <p className="text-purple-300 flex items-center gap-2">
                    <i className="pi pi-star-fill text-yellow-400"></i>
                    <strong>Patron Status</strong> - Sie haben unbegrenzten Zugang zu allen Features!
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
          </Card>
        </TabPanel>

        {/* Seller Profile Tab */}
        <TabPanel header="Verkäufer" leftIcon="pi pi-shopping-bag">
          <Card className="shadow-md">
            <form onSubmit={handleSellerSubmit} className="space-y-6">
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
                  {(user?.pending_earnings || user?.total_earnings) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
                        <p className="text-gray-400 text-sm">Ausstehende Auszahlung</p>
                        <p className="text-2xl font-bold text-green-400">
                          {(user?.pending_earnings || 0).toFixed(2)} €
                        </p>
                      </div>
                      <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                        <p className="text-gray-400 text-sm">Gesamt verdient</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {(user?.total_earnings || 0).toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  )}

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
                          required
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
                          required
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
                        required
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
                          required={sellerData.payout_method === 'paypal'}
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
                            required={sellerData.payout_method === 'bank_transfer'}
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
                            required={sellerData.payout_method === 'bank_transfer'}
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
          </Card>
        </TabPanel>
      </TabView>

      {/* Plan Modal for buying credits or viewing subscription plans */}
      <PlanModal
        visible={showPlanModal}
        onHide={handlePlanModalClose}
        initialTab={planModalTab}
      />
    </div>
  );
}