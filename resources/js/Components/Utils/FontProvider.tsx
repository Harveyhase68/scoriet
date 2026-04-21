import React, { useEffect } from 'react';
import { loadFont, fontClasses } from '@/styles/fonts';

interface FontProviderProps {
  children: React.ReactNode;
  className?: string;
}

// Font identifier is a technical key (matches fontConfig in @/styles/fonts),
// not a UI string — must not be translated. A prior version read the name
// from i18n (`t.fontprovider16`) which meant ES/IT users got `instrumentoSans`
// / `strumentoSans` back, which isn't a registered font, so no font loaded.
const FONT_NAME = 'instrumentSans' as const;

// FontProvider component ensures fonts are loaded before components render
export const FontProvider: React.FC<FontProviderProps> = ({
  children,
  className = fontClasses.instrumentSans
}) => {
  useEffect(() => {
    loadFont(FONT_NAME);
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
    loadFont(FONT_NAME);
  }, []);

  return fontClasses;
};

export default FontProvider;