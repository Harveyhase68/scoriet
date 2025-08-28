import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { TabView, TabPanel } from 'primereact/tabview';

interface ProfileModalProps {
  visible: boolean;
  onHide: () => void;
}

interface UserData {
  id?: number;
  name: string;
  email: string;
  email_verified_at?: string;
  created_at?: string;
  updated_at?: string;
}

export default function ProfileModal({ visible, onHide }: ProfileModalProps) {
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [profileError, setProfileError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [profileSuccess, setProfileSuccess] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<string>('');

  // Load user data when opening
  useEffect(() => {
    if (visible) {
      loadUserData();
    }
  }, [visible]);

  const loadUserData = async () => {
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
      setUserData(user);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Error loading');
    }
  };

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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating');
      }

      setProfileSuccess('Profile updated successfully');
      
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoadingProfile(false);
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

      setPasswordSuccess('Password changed successfully');
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

  const handleHide = () => {
    // Reset form when closing
    setUserData({ name: '', email: '' });
    setPasswordData({ current_password: '', password: '', password_confirmation: '' });
    setProfileError('');
    setPasswordError('');
    setProfileSuccess('');
    setPasswordSuccess('');
    setLoadingProfile(false);
    setLoadingPassword(false);
    onHide();
  };

  return (
    <Dialog
      header="My Profile"
      visible={visible}
      onHide={handleHide}
      style={{ width: '500px' }}
      modal
      closable
      draggable={false}
      resizable={false}
      className="p-dialog-custom"
    >
      <TabView>
        <TabPanel header="Edit Profile" leftIcon="pi pi-user">
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
              <label htmlFor="profile-name" className="block text-sm font-medium mb-2">
                Name
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
                E-Mail
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

            <Button
              type="submit"
              label={loadingProfile ? "Saving..." : "Save Profile"}
              icon={loadingProfile ? "pi pi-spinner pi-spin" : "pi pi-save"}
              className="w-full"
              disabled={loadingProfile}
            />
          </form>
        </TabPanel>

        <TabPanel header="Change Password" leftIcon="pi pi-lock">
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
                Current Password
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
                New Password
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
                Confirm New Password
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
              label={loadingPassword ? "Changing..." : "Change Password"}
              icon={loadingPassword ? "pi pi-spinner pi-spin" : "pi pi-key"}
              className="w-full"
              disabled={loadingPassword}
            />
          </form>
        </TabPanel>
      </TabView>
    </Dialog>
  );
}