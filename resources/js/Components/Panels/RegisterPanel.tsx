import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface RegisterPanelProps {
  onSwitchPanel?: (panelType: string) => void;
}

export default function RegisterPanel({ onSwitchPanel }: RegisterPanelProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Passwort-Bestätigung prüfen
    if (formData.password !== formData.password_confirmation) {
      setError(t.authmodalsegistermodal58);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.password_confirmation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.panelsegisterpanel54);
      }

      setSuccess(t.panelsegisterpanel57);
      
      // Formular zurücksetzen
      setFormData({
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
      });

      // Nach 2 Sekunden zum Login wechseln
      setTimeout(() => {
        if (onSwitchPanel) {
          onSwitchPanel('login');
        }
      }, 2000);

    } catch {
      setError(_ instanceof Error ? _.message : t.authmodalsegistermodal109);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Fehler löschen bei Eingabe
    if (success) setSuccess(''); // Erfolg löschen bei Eingabe
  };

  return (
    <div className="flex justify-center items-center min-h-full bg-gray-50 p-4">
      <Card 
        title={t.authmodalsegistermodal203} 
        className="w-full max-w-md shadow-lg"
        pt={{
          root: { className: 'border border-gray-200' },
          title: { className: 'text-center text-xl font-semibold mb-4' }
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Name
            </label>
            <InputText
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={t.authmodalsegistermodal239}
              className="w-full"
              disabled={loading}
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
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder={t.forgotpasswordmodal113}
              className="w-full"
              disabled={loading}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Passwort
            </label>
            <Password
              id="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder={t.panelsegisterpanel154}
              className="w-full"
              inputClassName="w-full"
              disabled={loading}
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
              Passwort bestätigen
            </label>
            <Password
              id="password_confirmation"
              value={formData.password_confirmation}
              onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
              placeholder={t.authmodalsegistermodal312}
              className="w-full"
              inputClassName="w-full"
              disabled={loading}
              feedback={false}
              toggleMask
              required
            />
          </div>

          <Button
            type="submit"
            label={loading ? t.registermodal379 : t.authmodalsegistermodal203}
            icon={loading ? "pi pi-spinner pi-spin" : "pi pi-user-plus"}
            className="w-full"
            disabled={loading}
          />

          {onSwitchPanel && (
            <div className="text-center mt-4">
              <Button
                type="button"
                label={t.panelsegisterpanel198}
                className="p-button-link p-button-sm"
                onClick={() => onSwitchPanel('login')}
              />
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}