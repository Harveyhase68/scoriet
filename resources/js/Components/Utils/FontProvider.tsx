import { useEffect } from 'react';
import { loadFont, fontClasses } from '@/styles/fonts';

interface FontProviderProps {
  children: React.ReactNode;
  className?: string;
}

// FontProvider component ensures fonts are loaded before components render
export const FontProvider: React.FC<FontProviderProps> = ({ 
  children, 
  className = fontClasses.instrumentSans 
}) => {
  useEffect(() => {
    // Ensure fonts are loaded
    loadFont('instrumentSans');
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
    loadFont('instrumentSans');
  }, []);

  return fontClasses;
};

export default FontProvider;