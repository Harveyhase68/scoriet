import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { TabView, TabPanel } from 'primereact/tabview';
import { Avatar } from 'primereact/avatar';

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  created_at: string;
  last_login_at?: string;
}

export default function ProfilePanel() {
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

  // Benutzer-Daten beim Mount laden
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Nicht authentifiziert');
      }

      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Benutzer-Daten konnten nicht geladen werden');
      }

      const userData = await response.json();
      setUser(userData);
      setProfileData({
        name: userData.name,
        email: userData.email
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Nicht authentifiziert');
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
        throw new Error(data.message || 'Profil konnte nicht aktualisiert werden');
      }

      setSuccess('Profil erfolgreich aktualisiert');
      setUser(prev => prev ? { ...prev, ...profileData } : null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
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
      setError('Neue Passwörter stimmen nicht überein');
      setUpdating(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Nicht authentifiziert');
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
        throw new Error(data.message || 'Passwort konnte nicht geändert werden');
      }

      setSuccess('Passwort erfolgreich geändert');
      setPasswordData({
        current_password: '',
        password: '',
        password_confirmation: ''
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
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
        <TabPanel header="Profil bearbeiten" leftIcon="pi pi-user">
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
                label={updating ? "Speichern..." : "Profil aktualisieren"}
                icon={updating ? "pi pi-spinner pi-spin" : "pi pi-save"}
                disabled={updating}
              />
            </form>
          </Card>
        </TabPanel>

        <TabPanel header="Passwort ändern" leftIcon="pi pi-key">
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
                  promptLabel="Passwort eingeben"
                  weakLabel="Schwach"
                  mediumLabel="Mittel"
                  strongLabel="Stark"
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
                label={updating ? "Ändern..." : "Passwort ändern"}
                icon={updating ? "pi pi-spinner pi-spin" : "pi pi-key"}
                disabled={updating}
              />
            </form>
          </Card>
        </TabPanel>

        <TabPanel header="Account Info" leftIcon="pi pi-info-circle">
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
                    'Noch nie angemeldet'
                  }
                </p>
              </div>
            </div>
          </Card>
        </TabPanel>
      </TabView>
    </div>
  );
}