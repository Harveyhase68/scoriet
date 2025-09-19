import React from 'react';

interface CSSFlagProps {
  country: string; // us, de, fr, es, it
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function CSSFlag({ country, size = 'md', className = '' }: CSSFlagProps) {
  const getDimensions = () => {
    switch (size) {
      case 'sm': return { width: '16px', height: '12px' };
      case 'lg': return { width: '24px', height: '18px' };
      default: return { width: '20px', height: '15px' };
    }
  };

  const dimensions = getDimensions();

  const getFlagStyles = (countryCode: string) => {
    switch (countryCode) {
      case 'us':
        return {
          background: `
            linear-gradient(to bottom,
              #B22234 0%, #B22234 7.69%,
              #FFFFFF 7.69%, #FFFFFF 15.38%,
              #B22234 15.38%, #B22234 23.08%,
              #FFFFFF 23.08%, #FFFFFF 30.77%,
              #B22234 30.77%, #B22234 38.46%,
              #FFFFFF 38.46%, #FFFFFF 46.15%,
              #B22234 46.15%, #B22234 53.85%,
              #FFFFFF 53.85%, #FFFFFF 61.54%,
              #B22234 61.54%, #B22234 69.23%,
              #FFFFFF 69.23%, #FFFFFF 76.92%,
              #B22234 76.92%, #B22234 84.62%,
              #FFFFFF 84.62%, #FFFFFF 92.31%,
              #B22234 92.31%, #B22234 100%
            ),
            linear-gradient(to right,
              #3C3B6E 0%, #3C3B6E 40%,
              transparent 40%
            )
          `,
          position: 'relative' as const
        };

      case 'de':
        return {
          background: `
            linear-gradient(to bottom,
              #000000 0%, #000000 33.33%,
              #DD0000 33.33%, #DD0000 66.66%,
              #FFCC00 66.66%, #FFCC00 100%
            )`
        };

      case 'fr':
        return {
          background: `
            linear-gradient(to right,
              #0055A4 0%, #0055A4 33.33%,
              #FFFFFF 33.33%, #FFFFFF 66.66%,
              #EF4135 66.66%, #EF4135 100%
            )`
        };

      case 'es':
        return {
          background: `
            linear-gradient(to bottom,
              #AA151B 0%, #AA151B 25%,
              #F1BF00 25%, #F1BF00 75%,
              #AA151B 75%, #AA151B 100%
            )`
        };

      case 'it':
        return {
          background: `
            linear-gradient(to right,
              #009246 0%, #009246 33.33%,
              #FFFFFF 33.33%, #FFFFFF 66.66%,
              #CE2B37 66.66%, #CE2B37 100%
            )`
        };

      default:
        return {
          background: '#6B7280'
        };
    }
  };

  const flagStyles = getFlagStyles(country);

  return (
    <span
      className={`css-flag ${className}`}
      style={{
        display: 'inline-block',
        width: dimensions.width,
        height: dimensions.height,
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '2px',
        overflow: 'hidden',
        verticalAlign: 'middle',
        ...flagStyles
      }}
      title={`${country.toUpperCase()} Flag`}
      role="img"
      aria-label={`${country.toUpperCase()} flag`}
    />
  );
}