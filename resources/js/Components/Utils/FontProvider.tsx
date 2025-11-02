import React, { useEffect } from 'react';
import { loadFont, fontClasses } from '@/styles/fonts';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface FontProviderProps {
  children: React.ReactNode;
  className?: string;
}

// FontProvider component ensures fonts are loaded before components render
export const FontProvider: React.FC<FontProviderProps> = ({ 
  children, 
  className = fontClasses.instrumentSans 
}) => {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  useEffect(() => {
    // Ensure fonts are loaded
    loadFont(t.fontprovider16);
  }, []);

  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Hook to use font classes in components
export const useFontClasses = () => {
  useEffect(() => {
    loadFont(t.fontprovider16);
  }, []);

  return fontClasses;
};

export default FontProvider;