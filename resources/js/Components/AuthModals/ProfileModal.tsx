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
  username?: string;
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
    // Reset form when closing
    setUserData({ name: '', email: '' });
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
                Der Username kann nach der Registrierung nicht mehr geändert werden.
              </small>
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

        <TabPanel header="Delete Account" leftIcon="pi pi-trash">
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
              label={loadingDelete ? "Account will be deleted..." : "Permanently delete account"}
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