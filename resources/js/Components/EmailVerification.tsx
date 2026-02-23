import React, { useEffect, useState, useCallback } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

interface EmailVerificationProps {
  userId?: string;
  hash?: string;
}

export default function EmailVerification({ userId, hash }: EmailVerificationProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_verified'>('loading');
  const [message, setMessage] = useState<string>('');
  const [invitationAccepted, setInvitationAccepted] = useState<boolean>(false);
  const [projectName, setProjectName] = useState<string | null>(null);

  const verifyEmail = useCallback(async () => {
    try {
      const response = await fetch(`/api/auth/email/verify/${userId}/${hash}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Store the access token if provided
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        if (data.already_verified) {
          setStatus('already_verified');
        } else {
          setStatus('success');
        }
        setMessage(data.message);

        // Check if invitation was auto-accepted
        if (data.invitation_auto_accepted) {
          setInvitationAccepted(true);
          setProjectName(data.project_name || null);
        }

        // Auto-redirect to app after a short delay
        setTimeout(() => {
          window.location.href = '/app';
        }, data.invitation_auto_accepted ? 3000 : 2000);  // Give more time to read the project message
      } else {
        setStatus('error');
        setMessage(data.message || t.emailverification55);
      }
    } catch {
      setStatus('error');
      setMessage(t.emailverification59);
    }
  }, [userId, hash]);

  useEffect(() => {
    if (userId && hash) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage(t.emailverification68);
    }
  }, [userId, hash, verifyEmail]);

  const handleGoToLogin = () => {
    // Redirect to main page or trigger login modal
    window.location.href = '/';
  };

  const getIcon = () => {
    switch (status) {
      case 'success':
        return 'pi pi-check-circle';
      case 'already_verified':
        return 'pi pi-info-circle';
      case 'error':
        return 'pi pi-times-circle';
      default:
        return '';
    }
  };

  const getSeverity = () => {
    switch (status) {
      case 'success':
        return 'success';
      case 'already_verified':
        return 'info';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bgPrimary }}>
      <Card className="w-full max-w-md p-6 border" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: colors.textPrimary }}>{t.emailverification112}</h2>

          {status === 'loading' && (
            <div className="space-y-4">
              <ProgressSpinner />
              <p style={{ color: colors.textSecondary }}>{t.emailverification117}</p>
            </div>
          )}

          {status !== 'loading' && (
            <div className="space-y-4">
              <Message
                severity={getSeverity()}
                text={message}
                icon={getIcon()}
                className="w-full"
              />

              {(status === 'success' || status === 'already_verified') && (
                <div className="space-y-3">
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {t.emailverification133}
                  </p>
                  {invitationAccepted && projectName && (
                    <div className="p-4 rounded" style={{ backgroundColor: colors.successBg, borderLeft: `4px solid ${colors.successBorder}` }}>
                      <p className="font-semibold text-base" style={{ color: colors.successText }}>
                        {t.emailverification138}{projectName}!
                      </p>
                      <p className="text-sm mt-1" style={{ color: colors.successText }}>
                        {t.emailverification141}
                      </p>
                    </div>
                  )}
                  <Button
                    label={t.emailverification141}
                    icon="pi pi-arrow-right"
                    onClick={() => window.location.href = '/app'}
                    className="w-full"
                  />
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {t.emailverification157}
                  </p>
                  <Button
                    label={t.emailverification155}
                    icon="pi pi-home"
                    onClick={handleGoToLogin}
                    className="w-full p-button-outlined"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}