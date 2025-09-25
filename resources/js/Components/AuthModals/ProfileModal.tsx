import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { TabView, TabPanel } from 'primereact/tabview';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { Dropdown } from 'primereact/dropdown';
import { SupportedLanguage, supportedLanguages, getStoredLanguage, setStoredLanguage, useTranslation } from '@/utils/i18n';
import CSSFlag from '@/Components/CSSFlag';

interface ProfileModalProps {
  visible: boolean;
  onHide: () => void;
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
}

export default function ProfileModal({ visible, onHide }: ProfileModalProps) {
  // Get current language for translations
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

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
    return () => document.head.removeChild(style);
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

  const loadUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setProfileError('Not logged in');
        return;
      }

      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error loading user data');
      }

      const user = await response.json();
      setUserData({
        ...user,
        language: user.language || getStoredLanguage()
      });

      // Update stored language to user's preference
      if (user.language) {
        setStoredLanguage(user.language as SupportedLanguage);
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Error loading');
    }
  }, []);

  // Load user data when opening
  useEffect(() => {
    if (visible) {
      loadUserData();
    }
  }, [visible, loadUserData]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not logged in');
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
        throw new Error(errorData.message || 'Error updating');
      }

      setProfileSuccess(t.profileUpdateSuccess);

    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Profile update error');
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

      // Also save to backend
      const token = localStorage.getItem('access_token');
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
    } catch (error) {
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
      setPasswordError('New passwords do not match');
      setLoadingPassword(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not logged in');
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
        throw new Error(errorData.message || 'Error changing password');
      }

      setPasswordSuccess(t.passwordChangeSuccess);
      setPasswordData({ current_password: '', password: '', password_confirmation: '' });
      
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'An error occurred');
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
    if (deleteData.confirmText !== 'DELETE') {
      setDeleteError('Sie müssen "DELETE" eingeben, um Ihren Account zu löschen');
      setLoadingDelete(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not logged in');
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
        throw new Error(errorData.message || 'Fehler beim Löschen des Accounts');
      }

      setDeleteSuccess('Account erfolgreich gelöscht. Sie werden automatisch abgemeldet.');
      
      // Clear tokens and reload page after 2 seconds
      setTimeout(() => {
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('refresh_token');
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
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
      style={{ width: '700px' }}
      modal
      closable
      draggable={false}
      resizable={false}
      className="p-dialog-custom"
    >
      <TabView>
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
                The username cannot be changed after registration.
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
                placeholder="Your full name"
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
                placeholder="ihre.email@example.com"
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
                placeholder="Your current password"
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
                placeholder="Your new password"
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
                placeholder="Repeat new password"
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

        <TabPanel header="Plans & Billing" leftIcon="pi pi-credit-card">
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-l-blue-400">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">Current Plan</h3>
                <Badge value="Free" severity="info" />
              </div>
              <p className="text-gray-300 mb-4">
                You're currently on the <strong className="text-blue-400">Free plan</strong>. Upgrade to unlock more features!
              </p>
            </div>

            {/* Available Plans */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Available Plans</h3>
              
              {/* Free Plan */}
              <Card className="border-l-4 border-l-gray-400 bg-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-white">Free</h4>
                    <p className="text-2xl font-bold text-white mb-2">€0 <span className="text-sm font-normal text-gray-300">forever</span></p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Up to 3 projects</li>
                      <li>• Basic templates</li>
                      <li>• Community support</li>
                    </ul>
                  </div>
                  <Badge value="Current" severity="info" />
                </div>
              </Card>

              {/* Premium Plan */}
              <Card className="border-l-4 border-l-blue-500 bg-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-white">Premium</h4>
                    <p className="text-2xl font-bold text-blue-400 mb-2">€2.99 <span className="text-sm font-normal text-gray-300">/month</span></p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Unlimited projects</li>
                      <li>• Advanced templates</li>
                      <li>• Priority support</li>
                      <li>• Team collaboration</li>
                    </ul>
                  </div>
                  <Button 
                    label="Upgrade" 
                    size="small" 
                    className="p-button-primary"
                    onClick={() => alert('Upgrade to Premium - Coming Soon!')}
                  />
                </div>
              </Card>

              {/* Patron Plan */}
              <Card className="border-l-4 border-l-purple-500 bg-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-white">Patron</h4>
                    <p className="text-2xl font-bold text-purple-400 mb-2">€5+ <span className="text-sm font-normal text-gray-300">/month</span></p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• All Premium features</li>
                      <li>• Early access to features</li>
                      <li>• Community Discord access</li>
                      <li>• Custom amount (€5-50+)</li>
                    </ul>
                  </div>
                  <Button 
                    label="Become Patron" 
                    size="small" 
                    className="p-button-help"
                    onClick={() => alert('Become Patron - Coming Soon!')}
                  />
                </div>
              </Card>
            </div>
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
                Warning: Delete account
              </h3>
              <p className="text-red-700 text-sm mb-3">
                This action cannot be undone. Your account and all associated data will be permanently deleted.
              </p>
              <ul className="text-red-700 text-sm list-disc list-inside space-y-1">
                <li>All your projects and templates will be deleted</li>
                <li>Your team memberships will be terminated</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>

            <div className="field">
              <label htmlFor="delete-password" className="block text-sm font-medium mb-2">
                Confirm current password
              </label>
              <Password
                id="delete-password"
                value={deleteData.password}
                onChange={(e) => handleDeleteInputChange('password', e.target.value)}
                placeholder="Your current password"
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
              disabled={loadingDelete || deleteData.confirmText !== 'DELETE'}
            />
          </form>
        </TabPanel>
      </TabView>
    </Dialog>
  );
}