import React from 'react';

interface FlagIconProps {
  country: string; // us, de, fr, es, it
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function FlagIcon({ country, size = 'md', className = '' }: FlagIconProps) {
  // Einfache, direkte Emoji-Darstellung ohne komplizierte Fallbacks
  const getFlag = (countryCode: string): string => {
    // Regional Indicator Symbols für Flaggen
    const flags: Record<string, string> = {
      'us': '\u{1F1FA}\u{1F1F8}', // 🇺🇸
      'de': '\u{1F1E9}\u{1F1EA}', // 🇩🇪
      'fr': '\u{1F1EB}\u{1F1F7}', // 🇫🇷
      'es': '\u{1F1EA}\u{1F1F8}', // 🇪🇸
      'it': '\u{1F1EE}\u{1F1F9}'  // 🇮🇹
    };
    return flags[countryCode] || '\u{1F3F3}\u{FE0F}'; // 🏳️ als Fallback
  };

  const sizeMap = {
    'sm': '14px',
    'md': '16px',
    'lg': '20px'
  };

  return (
    <span
      className={`flag-icon-simple ${className}`}
      style={{
        fontSize: sizeMap[size],
        lineHeight: '1',
        display: 'inline-block',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
        fontWeight: 'normal',
        minWidth: sizeMap[size],
        textAlign: 'center',
        userSelect: 'none'
      }}
      title={`${country.toUpperCase()} Flag`}
      role="img"
      aria-label={`${country.toUpperCase()} flag`}
    >
      {getFlag(country)}
    </span>
  );
}