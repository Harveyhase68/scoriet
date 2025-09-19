import React from 'react';

interface CountryFlagProps {
  country: string; // us, de, fr, es, it
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function CountryFlag({ country, size = 'md', className = '' }: CountryFlagProps) {
  const getFlagColors = (countryCode: string) => {
    const flagColors: Record<string, { primary: string; secondary: string; emoji: string }> = {
      'us': { primary: '#1e40af', secondary: '#dc2626', emoji: '🇺🇸' },
      'de': { primary: '#000000', secondary: '#dc2626', emoji: '🇩🇪' },
      'fr': { primary: '#1e40af', secondary: '#dc2626', emoji: '🇫🇷' },
      'es': { primary: '#dc2626', secondary: '#fbbf24', emoji: '🇪🇸' },
      'it': { primary: '#16a34a', secondary: '#dc2626', emoji: '🇮🇹' }
    };
    return flagColors[countryCode] || { primary: '#6b7280', secondary: '#9ca3af', emoji: '🏳️' };
  };

  const getDimensions = () => {
    switch (size) {
      case 'sm': return { width: '16px', height: '12px', fontSize: '12px' };
      case 'lg': return { width: '24px', height: '18px', fontSize: '18px' };
      default: return { width: '20px', height: '15px', fontSize: '16px' };
    }
  };

  const flagColors = getFlagColors(country);
  const dimensions = getDimensions();

  // Try emoji first, fallback to CSS flag
  return (
    <span className={`country-flag ${className}`} title={country.toUpperCase()}>
      <span
        style={{
          fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif',
          fontSize: dimensions.fontSize,
          lineHeight: '1',
          display: 'inline-block',
          fontVariantEmoji: 'emoji',
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        }}
      >
        {flagColors.emoji}
      </span>

      {/* Fallback CSS flag if emoji doesn't work */}
      <style>{`
        .country-flag-fallback-${country} {
          display: inline-block;
          width: ${dimensions.width};
          height: ${dimensions.height};
          background: linear-gradient(to right, ${flagColors.primary} 50%, ${flagColors.secondary} 50%);
          border: 1px solid #ccc;
          border-radius: 2px;
          vertical-align: middle;
        }
      `}</style>
    </span>
  );
}