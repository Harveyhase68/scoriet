import React, { useRef } from 'react';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { SupportedLanguage, supportedLanguages, LanguageOption } from '@/utils/i18n';
import CSSFlag from '@/Components/CSSFlag';

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
  variant?: 'button' | 'flag-only' | 'compact';
  size?: 'small' | 'normal' | 'large';
}

export default function LanguageSelector({
  currentLanguage,
  onLanguageChange,
  variant = 'button',
}: LanguageSelectorProps) {
  const overlayRef = useRef<OverlayPanel>(null);

  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage) || supportedLanguages[0];

  const handleLanguageSelect = (language: SupportedLanguage) => {
    onLanguageChange(language);
    overlayRef.current?.hide();
  };

  const getButtonContent = () => {
    switch (variant) {
      case 'flag-only':
        return (
          <span title={currentLang.nativeName}>
            <CSSFlag country={currentLang.code === 'en' ? 'us' : currentLang.code} size="md" />
          </span>
        );
      case 'compact':
        return (
          <span className="flex items-center space-x-2">
            <CSSFlag country={currentLang.code === 'en' ? 'us' : currentLang.code} size="sm" />
            <span className="uppercase font-medium">{currentLang.code}</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-2">
            <CSSFlag country={currentLang.code === 'en' ? 'us' : currentLang.code} size="md" />
            <span>{currentLang.nativeName}</span>
            <i className="pi pi-chevron-down text-xs"></i>
          </span>
        );
    }
  };

  return (
    <>
      <Button
        onClick={(e) => {
          e.preventDefault();
          overlayRef.current?.toggle(e);
        }}
        className={`p-button-text p-button p-component`}
        style={{
          borderRadius: '8px',
          minWidth: variant === 'flag-only' ? '40px' : 'auto',
          paddingTop: '6px',
          paddingBottom: '6px'
        }}
        aria-label="Select Language"
        tooltip="Select Language"
        tooltipOptions={{ position: 'bottom' }}
      >
        {getButtonContent()}
      </Button>

      <OverlayPanel
        ref={overlayRef}
        showCloseIcon={false}
        dismissable={true}
        style={{
          width: '200px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}
        className="language-selector-overlay"
      >
        <div className="flex flex-col space-y-1">
          <div className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-2 px-2">
            Choose Language
          </div>
          {supportedLanguages.map((lang: LanguageOption) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors w-full ${
                currentLanguage === lang.code ? 'active' : ''
              }`}
            >
              <span className="flex-shrink-0">
                <CSSFlag country={lang.code === 'en' ? 'us' : lang.code} size="md" />
              </span>
              <div className="flex-1">
                <div className="font-medium text-gray-100">{lang.nativeName}</div>
                <div className="text-xs text-gray-400">{lang.name}</div>
              </div>
              {currentLanguage === lang.code && (
                <i className="pi pi-check text-blue-400 text-sm"></i>
              )}
            </button>
          ))}
        </div>
      </OverlayPanel>
    </>
  );
}

// CSS for better styling - DARK THEME DEFAULT
const styles = `
.language-selector-overlay .p-overlaypanel-content {
  padding: 0.75rem !important;
  background: #374151 !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
  border: 1px solid #4b5563 !important;
}

.language-selector-overlay button {
  min-height: 44px !important;
  padding: 0.75rem !important;
  color: #f3f4f6 !important;
  background: transparent !important;
  border: none !important;
  border-radius: 6px !important;
  transition: background-color 0.2s ease !important;
}

.language-selector-overlay button:hover {
  background-color: #4b5563 !important;
  color: #ffffff !important;
}

.language-selector-overlay button.active {
  background-color: #1e40af !important;
  color: #ffffff !important;
}

.flag-icon-simple {
  display: inline-block !important;
  font-style: normal !important;
  font-variant: normal !important;
  text-rendering: optimizeLegibility !important;
  line-height: 1 !important;
  font-family: system-ui, -apple-system, "Segoe UI", "Apple Color Emoji", "Segoe UI Emoji", sans-serif !important;
  min-width: 18px !important;
  text-align: center !important;
  user-select: none !important;
  vertical-align: middle !important;
}

/* Force dark theme always for lobby */
.language-selector-overlay .p-overlaypanel-content {
  background: #374151 !important;
  border-color: #4b5563 !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('language-selector-styles');
  if (!existingStyle) {
    const styleElement = document.createElement('style');
    styleElement.id = 'language-selector-styles';
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }
}