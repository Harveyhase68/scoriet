import React, { useState, useEffect } from 'react';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

export default function TopBar() {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="h-12 flex items-center justify-between px-4 relative"
      style={{
        backgroundColor: colors.bgSecondary,
        borderBottom: `1px solid ${colors.borderPrimary}`
      }}
    >
      {/* Left: Nav Toggle + Logo and Brand */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggleNavPanel'))}
            className="p-2 rounded transition-colors hover:opacity-80"
            style={{ color: colors.textMuted }}
            title={t.topbarToggleNav || 'Toggle Navigation'}
          >
            <i className="pi pi-bars text-lg"></i>
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <i className="pi pi-box text-xl" style={{ color: colors.accent }}></i>
          <span className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
            {t.topbarBrand || 'Laravel React Template'}
          </span>
        </div>
      </div>

      {/* Right: Clock */}
      <div className="flex items-center space-x-2 text-xs" style={{ color: colors.textMuted }}>
        <i className="pi pi-clock"></i>
        <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}