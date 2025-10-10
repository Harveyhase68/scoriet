import React from 'react';

interface CSSFlagProps {
  country: string; // us, de, fr, es, it
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function CSSFlag({ country, size = 'md', className = '' }: CSSFlagProps) {
  const getDimensions = () => {
    switch (size) {
      case 'sm': return { width: 24, height: 18 };  // 50% größer (war 16x12)
      case 'lg': return { width: 32, height: 24 };  // 33% größer (war 24x18)
      default: return { width: 28, height: 21 };    // 40% größer (war 20x15)
    }
  };

  const dimensions = getDimensions();

  // Use high-quality flags from flagcdn (w80 for better quality at larger sizes)
  const flagUrl = `https://flagcdn.com/w80/${country}.png`;

  return (
    <img
      src={flagUrl}
      alt={`${country.toUpperCase()} flag`}
      className={`css-flag ${className}`}
      style={{
        display: 'inline-block',
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '2px',
        objectFit: 'cover',
        verticalAlign: 'middle',
      }}
      title={`${country.toUpperCase()} Flag`}
      loading="lazy"
    />
  );
}