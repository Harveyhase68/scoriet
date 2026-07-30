import React, { useState } from 'react';
import { useTranslation, SupportedLanguage, getStoredLanguage, setStoredLanguage, supportedLanguages } from '@/i18n';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';

interface NavigationPanelProps {
  onOpenPanel?: (panelId: string, title?: string) => void;
  initialCollapsed?: boolean;
}

export default function MenuPanel({ onOpenPanel, initialCollapsed = false }: NavigationPanelProps) {
  const [currentLanguage, setCurrentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors, themeMode, setThemeMode } = useTheme();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setStoredLanguage(lang);
    setCurrentLanguage(lang);
    window.location.reload();
  };

  const handleToggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    window.dispatchEvent(new CustomEvent('navCollapsed', { detail: { collapsed: next } }));
  };

  const themeOptions: { mode: ThemeMode; icon: string; labelKey: keyof typeof t }[] = [
    { mode: 'dark', icon: 'pi pi-moon', labelKey: 'navThemeDark' },
    { mode: 'light', icon: 'pi pi-sun', labelKey: 'navThemeLight' },
    { mode: 'green', icon: 'pi pi-palette', labelKey: 'navThemeGreen' },
    { mode: 'auto', icon: 'pi pi-clock', labelKey: 'navThemeAuto' },
  ];

  return (
    <div
      className="h-full flex flex-col"
      style={{
        backgroundColor: colors.bgPrimary,
        color: colors.textPrimary,
        overflow: 'hidden',
      }}
    >
      {/* Collapse/Expand Button */}
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          borderBottom: `1px solid ${colors.borderPrimary}`,
          height: '36px',
        }}
      >
        <button
          onClick={handleToggleCollapse}
          title={collapsed ? (t.navExpand || 'Expand Menu') : (t.navCollapse || 'Collapse Menu')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.textMuted,
            fontSize: '14px',
            padding: '4px 8px',
            lineHeight: 1,
          }}
        >
          <i className={collapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'} />
        </button>
      </div>

      <div className="flex-1 overflow-auto" style={{ padding: collapsed ? '4px' : '8px' }}>
        {/* Menu Items */}
        <div className="space-y-1">
          {!collapsed && (
            <div
              className="text-xs font-semibold uppercase tracking-wider px-2 py-1"
              style={{ color: colors.textMuted }}
            >
              Menu
            </div>
          )}

          <button
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-2 px-3'} py-2 rounded text-sm transition-colors hover:opacity-80`}
            style={{ color: colors.textPrimary }}
            title={collapsed ? (t.navWelcome || 'Welcome') : undefined}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            onClick={() => onOpenPanel?.('welcome-tab', t.navWelcome || 'Welcome')}
          >
            <i className="pi pi-home"></i>
            {!collapsed && <span>{t.navWelcome || 'Welcome'}</span>}
          </button>

          <button
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-2 px-3'} py-2 rounded text-sm transition-colors hover:opacity-80`}
            style={{ color: colors.textPrimary }}
            title={collapsed ? (t.navProducts || 'Products') : undefined}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            onClick={() => onOpenPanel?.('product-management', t.panelTitle || 'Product Management')}
          >
            <i className="pi pi-box"></i>
            {!collapsed && <span>{t.navProducts || 'Products'}</span>}
          </button>
        </div>

        {/* Theme Selector */}
        <div className={collapsed ? 'mt-3 space-y-1' : 'mt-6 space-y-1'}>
          {!collapsed && (
            <div
              className="text-xs font-semibold uppercase tracking-wider px-2 py-1"
              style={{ color: colors.textMuted }}
            >
              {t.navTheme || 'Theme'}
            </div>
          )}
          {collapsed && (
            <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, marginBottom: '4px' }} />
          )}
          {themeOptions.map((opt) => (
            <button
              key={opt.mode}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-2 px-3'} py-1.5 rounded text-sm transition-colors`}
              style={{
                color: themeMode === opt.mode ? colors.accent : colors.textSecondary,
                backgroundColor: themeMode === opt.mode ? colors.bgTertiary : 'transparent',
              }}
              title={collapsed ? (t[opt.labelKey] as string || opt.mode) : undefined}
              onMouseEnter={(e) => {
                if (themeMode !== opt.mode) e.currentTarget.style.backgroundColor = colors.bgHover;
              }}
              onMouseLeave={(e) => {
                if (themeMode !== opt.mode) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={() => setThemeMode(opt.mode)}
            >
              <i className={opt.icon}></i>
              {!collapsed && <span>{t[opt.labelKey] || opt.mode}</span>}
            </button>
          ))}
        </div>

        {/* Language Selector */}
        <div className={collapsed ? 'mt-3 space-y-1' : 'mt-6 space-y-1'}>
          {!collapsed && (
            <div
              className="text-xs font-semibold uppercase tracking-wider px-2 py-1"
              style={{ color: colors.textMuted }}
            >
              {t.navLanguage || 'Language'}
            </div>
          )}
          {collapsed && (
            <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, marginBottom: '4px' }} />
          )}
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-2 px-3'} py-1.5 rounded text-sm transition-colors`}
              style={{
                color: currentLanguage === lang.code ? colors.accent : colors.textSecondary,
                backgroundColor: currentLanguage === lang.code ? colors.bgTertiary : 'transparent',
              }}
              title={collapsed ? lang.nativeName : undefined}
              onMouseEnter={(e) => {
                if (currentLanguage !== lang.code) e.currentTarget.style.backgroundColor = colors.bgHover;
              }}
              onMouseLeave={(e) => {
                if (currentLanguage !== lang.code) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <span>{lang.flag}</span>
              {!collapsed && <span>{lang.nativeName}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}