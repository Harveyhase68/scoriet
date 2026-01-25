import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export default function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  // Theme
  const { colors } = useTheme();

  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  const handleReloadWithReset = () => {
    // Clear all storage to reset the app completely
    sessionStorage.clear();
    localStorage.clear();

    // Reload the page
    window.location.reload();
  };

  return (
    <div className="h-full p-4" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <Card className="h-full" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
        <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
          <div className="text-6xl">💥</div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: colors.errorText }}>
              Oops! Etwas ist schiefgelaufen
            </h2>

            <Message
              severity="error"
              text={t.errorfallback34}
              className="w-full max-w-md"
            />
          </div>

          <div className="p-4 rounded max-w-lg w-full" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
            <h3 className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Fehlerdetails:</h3>
            <pre className="text-xs whitespace-pre-wrap break-words" style={{ color: colors.errorText }}>
              {error.message}
            </pre>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs cursor-pointer" style={{ color: colors.textMuted }}>
                  Stack Trace anzeigen
                </summary>
                <pre className="text-xs mt-2 whitespace-pre-wrap break-words max-h-32 overflow-auto" style={{ color: colors.textMuted }}>
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              label={t.errorfallback58}
              icon="pi pi-refresh"
              onClick={resetError}
              severity="info"
            />

            <Button
              label={t.errorfallback65}
              icon="pi pi-replay"
              onClick={handleReloadWithReset}
              severity="warning"
              outlined
            />
          </div>

          <div className="text-xs max-w-md" style={{ color: colors.textMuted }}>
            <p className="mb-2">
              <strong style={{ color: colors.warningText }}>{t.errorfallback75}</strong> Der "{t.errorfallback65}" {t.errorfallback65_2}
            </p>
            <p>
              {t.errorfallback77}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
