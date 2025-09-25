// Font configuration for Scoriet
// This approach prevents preload warnings by managing fonts in React rather than HTML

export const fontConfig = {
  // Instrument Sans font from Bunny Fonts
  instrumentSans: {
    family: 'Instrument Sans',
    weights: [400, 500, 600] as const,
    url: 'https://fonts.bunny.net/css?family=instrument-sans:400,500,600',
    preconnectUrl: 'https://fonts.bunny.net'
  }
};

// Function to load fonts dynamically
export const loadFont = (fontName: keyof typeof fontConfig) => {
  const font = fontConfig[fontName];
  
  // Check if font is already loaded
  const existingLink = document.querySelector(`link[href="${font.url}"]`);
  if (existingLink) {
    return;
  }

  // Add preconnect for performance
  const preconnectLink = document.createElement('link');
  preconnectLink.rel = 'preconnect';
  preconnectLink.href = font.preconnectUrl;
  document.head.appendChild(preconnectLink);

  // Add font stylesheet
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = font.url;
  fontLink.onload = () => {
    // Font loaded successfully
  };
  fontLink.onerror = () => {
    // Failed to load font
  };
  
  document.head.appendChild(fontLink);
};

// CSS class names for fonts
export const fontClasses = {
  instrumentSans: 'font-instrument-sans'
} as const;

// Initialize fonts when module loads
if (typeof window !== 'undefined') {
  // Load primary font immediately
  loadFont('instrumentSans');
}