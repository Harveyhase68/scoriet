import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// =============================================================================
// THEME TYPES
// =============================================================================

export type ThemeMode = 'dark' | 'light' | 'green' | 'auto';

export interface ThemeColors {
    // Background colors
    bgPrimary: string;      // Main page background
    bgSecondary: string;    // Card/panel backgrounds
    bgTertiary: string;     // Input backgrounds, nested containers
    bgHover: string;        // Hover states
    bgSelected: string;     // Selected items

    // Text colors
    textPrimary: string;    // Main text
    textSecondary: string;  // Secondary/muted text
    textMuted: string;      // Very muted text (hints, placeholders)
    textInverse: string;    // Text on colored backgrounds

    // Border colors
    borderPrimary: string;  // Main borders
    borderSecondary: string; // Subtle borders
    borderFocus: string;    // Focus state borders

    // Button colors
    buttonPrimary: string;       // Primary action buttons
    buttonPrimaryHover: string;  // Primary button hover
    buttonSecondary: string;     // Secondary buttons
    buttonSecondaryHover: string; // Secondary button hover
    buttonDanger: string;        // Danger/delete buttons
    buttonDangerHover: string;   // Danger button hover
    buttonSuccess: string;       // Success buttons
    buttonSuccessHover: string;  // Success button hover

    // Status colors (alerts, messages)
    successBg: string;
    successBorder: string;
    successText: string;
    errorBg: string;
    errorBorder: string;
    errorText: string;
    warningBg: string;
    warningBorder: string;
    warningText: string;
    infoBg: string;
    infoBorder: string;
    infoText: string;

    // Accent colors
    accent: string;         // Primary accent (links, highlights)
    accentHover: string;    // Accent hover state

    // Dialog/Modal specific
    dialogHeader: string;
    dialogContent: string;
    dialogFooter: string;
}

// =============================================================================
// THEME DEFINITIONS
// =============================================================================

const darkTheme: ThemeColors = {
    // Background colors
    bgPrimary: '#1a1a1a',
    bgSecondary: '#1f2937',
    bgTertiary: '#374151',
    bgHover: '#4b5563',
    bgSelected: '#3b82f6',

    // Text colors
    textPrimary: '#f3f4f6',
    textSecondary: '#d1d5db',
    textMuted: '#9ca3af',
    textInverse: '#ffffff',

    // Border colors
    borderPrimary: '#4b5563',
    borderSecondary: '#374151',
    borderFocus: '#3b82f6',

    // Button colors
    buttonPrimary: '#3b82f6',
    buttonPrimaryHover: '#2563eb',
    buttonSecondary: '#4b5563',
    buttonSecondaryHover: '#6b7280',
    buttonDanger: '#dc2626',
    buttonDangerHover: '#b91c1c',
    buttonSuccess: '#16a34a',
    buttonSuccessHover: '#15803d',

    // Status colors
    successBg: 'rgba(22, 163, 74, 0.2)',
    successBorder: '#15803d',
    successText: '#86efac',
    errorBg: 'rgba(220, 38, 38, 0.2)',
    errorBorder: '#b91c1c',
    errorText: '#fca5a5',
    warningBg: 'rgba(202, 138, 4, 0.2)',
    warningBorder: '#a16207',
    warningText: '#fde047',
    infoBg: 'rgba(59, 130, 246, 0.2)',
    infoBorder: '#1d4ed8',
    infoText: '#93c5fd',

    // Accent colors
    accent: '#3b82f6',
    accentHover: '#60a5fa',

    // Dialog/Modal specific
    dialogHeader: '#111827',
    dialogContent: '#1f2937',
    dialogFooter: '#111827',
};

const lightTheme: ThemeColors = {
    // Background colors
    bgPrimary: '#f9fafb',
    bgSecondary: '#ffffff',
    bgTertiary: '#f3f4f6',
    bgHover: '#e5e7eb',
    bgSelected: '#3b82f6',

    // Text colors
    textPrimary: '#111827',
    textSecondary: '#1f2937',
    textMuted: '#4b5563',
    textInverse: '#ffffff',

    // Border colors
    borderPrimary: '#d1d5db',
    borderSecondary: '#e5e7eb',
    borderFocus: '#3b82f6',

    // Button colors
    buttonPrimary: '#3b82f6',
    buttonPrimaryHover: '#2563eb',
    buttonSecondary: '#e5e7eb',
    buttonSecondaryHover: '#d1d5db',
    buttonDanger: '#dc2626',
    buttonDangerHover: '#b91c1c',
    buttonSuccess: '#16a34a',
    buttonSuccessHover: '#15803d',

    // Status colors
    successBg: 'rgba(22, 163, 74, 0.1)',
    successBorder: '#16a34a',
    successText: '#15803d',
    errorBg: 'rgba(220, 38, 38, 0.1)',
    errorBorder: '#dc2626',
    errorText: '#b91c1c',
    warningBg: 'rgba(202, 138, 4, 0.1)',
    warningBorder: '#ca8a04',
    warningText: '#a16207',
    infoBg: 'rgba(59, 130, 246, 0.1)',
    infoBorder: '#3b82f6',
    infoText: '#1d4ed8',

    // Accent colors
    accent: '#3b82f6',
    accentHover: '#2563eb',

    // Dialog/Modal specific
    dialogHeader: '#f3f4f6',
    dialogContent: '#ffffff',
    dialogFooter: '#f3f4f6',
};

const greenTheme: ThemeColors = {
    // Background colors
    bgPrimary: '#f0fdf4',
    bgSecondary: '#ffffff',
    bgTertiary: '#ecfdf5',
    bgHover: '#d1fae5',
    bgSelected: '#16a34a',

    // Text colors
    textPrimary: '#111827',
    textSecondary: '#374151',
    textMuted: '#6b7280',
    textInverse: '#ffffff',

    // Border colors
    borderPrimary: '#a7f3d0',
    borderSecondary: '#d1fae5',
    borderFocus: '#16a34a',

    // Button colors (green as primary)
    buttonPrimary: '#16a34a',
    buttonPrimaryHover: '#15803d',
    buttonSecondary: '#d1fae5',
    buttonSecondaryHover: '#a7f3d0',
    buttonDanger: '#dc2626',
    buttonDangerHover: '#b91c1c',
    buttonSuccess: '#16a34a',
    buttonSuccessHover: '#15803d',

    // Status colors
    successBg: 'rgba(22, 163, 74, 0.1)',
    successBorder: '#16a34a',
    successText: '#15803d',
    errorBg: 'rgba(220, 38, 38, 0.1)',
    errorBorder: '#dc2626',
    errorText: '#b91c1c',
    warningBg: 'rgba(202, 138, 4, 0.1)',
    warningBorder: '#ca8a04',
    warningText: '#a16207',
    infoBg: 'rgba(22, 163, 74, 0.1)',
    infoBorder: '#16a34a',
    infoText: '#15803d',

    // Accent colors (green)
    accent: '#16a34a',
    accentHover: '#15803d',

    // Dialog/Modal specific
    dialogHeader: '#ecfdf5',
    dialogContent: '#ffffff',
    dialogFooter: '#ecfdf5',
};

// Theme map for easy access
const themes: Record<Exclude<ThemeMode, 'auto'>, ThemeColors> = {
    dark: darkTheme,
    light: lightTheme,
    green: greenTheme,
};

// =============================================================================
// CONTEXT
// =============================================================================

interface ThemeContextType {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    colors: ThemeColors;
    isDark: boolean;
    syncThemeFromUser: (userTheme: ThemeMode) => void; // Call this after login to sync theme from user profile
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    // Load theme from localStorage or default to 'dark'
    const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
        const stored = localStorage.getItem('scoriet_theme');
        if (stored && ['dark', 'light', 'green', 'auto'].includes(stored)) {
            return stored as ThemeMode;
        }
        return 'dark';
    });

    // Calculate actual theme for 'auto' mode
    const [resolvedTheme, setResolvedTheme] = useState<Exclude<ThemeMode, 'auto'>>(() => {
        if (themeMode === 'auto') {
            const hour = new Date().getHours();
            return (hour >= 6 && hour < 18) ? 'light' : 'dark';
        }
        return themeMode as Exclude<ThemeMode, 'auto'>;
    });

    // Update resolved theme when mode changes or for auto mode
    useEffect(() => {
        if (themeMode === 'auto') {
            const updateAutoTheme = () => {
                const hour = new Date().getHours();
                setResolvedTheme((hour >= 6 && hour < 18) ? 'light' : 'dark');
            };

            updateAutoTheme();

            // Check every minute for auto mode
            const interval = setInterval(updateAutoTheme, 60000);
            return () => clearInterval(interval);
        } else {
            setResolvedTheme(themeMode as Exclude<ThemeMode, 'auto'>);
        }
    }, [themeMode]);

    // Save theme mode to localStorage and optionally to server
    const setThemeMode = useCallback((mode: ThemeMode) => {
        localStorage.setItem('scoriet_theme', mode);
        setThemeModeState(mode);

        // If user is logged in, also save to server
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (token) {
            fetch('/api/profile/theme', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ theme: mode }),
            }).catch(err => {
                console.warn('Failed to save theme to server:', err);
            });
        }
    }, []);

    // Sync theme from user profile (call this after login)
    const syncThemeFromUser = useCallback((userTheme: ThemeMode) => {
        if (userTheme && ['dark', 'light', 'green', 'auto'].includes(userTheme)) {
            localStorage.setItem('scoriet_theme', userTheme);
            setThemeModeState(userTheme);
        }
    }, []);

    // Get current theme colors
    const colors = themes[resolvedTheme];
    const isDark = resolvedTheme === 'dark';

    // Apply CSS variables for global access
    useEffect(() => {
        const root = document.documentElement;

        // Background colors
        root.style.setProperty('--theme-bg-primary', colors.bgPrimary);
        root.style.setProperty('--theme-bg-secondary', colors.bgSecondary);
        root.style.setProperty('--theme-bg-tertiary', colors.bgTertiary);
        root.style.setProperty('--theme-bg-hover', colors.bgHover);

        // Text colors
        root.style.setProperty('--theme-text-primary', colors.textPrimary);
        root.style.setProperty('--theme-text-secondary', colors.textSecondary);
        root.style.setProperty('--theme-text-muted', colors.textMuted);

        // Border colors
        root.style.setProperty('--theme-border-primary', colors.borderPrimary);
        root.style.setProperty('--theme-border-secondary', colors.borderSecondary);

        // Accent
        root.style.setProperty('--theme-accent', colors.accent);
        root.style.setProperty('--theme-accent-hover', colors.accentHover);
        root.style.setProperty('--theme-accent-transparent', `${colors.accent}4d`); // 30% opacity

        // Status colors
        root.style.setProperty('--theme-success-bg', colors.successBg);
        root.style.setProperty('--theme-success-border', colors.successBorder);
        root.style.setProperty('--theme-success-text', colors.successText);
        root.style.setProperty('--theme-error-bg', colors.errorBg);
        root.style.setProperty('--theme-error-border', colors.errorBorder);
        root.style.setProperty('--theme-error-text', colors.errorText);
        root.style.setProperty('--theme-warning-bg', colors.warningBg);
        root.style.setProperty('--theme-warning-border', colors.warningBorder);
        root.style.setProperty('--theme-warning-text', colors.warningText);
        root.style.setProperty('--theme-info-bg', colors.infoBg);
        root.style.setProperty('--theme-info-border', colors.infoBorder);
        root.style.setProperty('--theme-info-text', colors.infoText);

        // Button colors
        root.style.setProperty('--theme-button-primary', colors.buttonPrimary);
        root.style.setProperty('--theme-button-secondary', colors.buttonSecondary);
        root.style.setProperty('--theme-button-danger', colors.buttonDanger);
        root.style.setProperty('--theme-button-success', colors.buttonSuccess);

        // Dialog colors
        root.style.setProperty('--theme-dialog-header', colors.dialogHeader);
        root.style.setProperty('--theme-dialog-content', colors.dialogContent);
        root.style.setProperty('--theme-dialog-footer', colors.dialogFooter);

        // Text inverse (for buttons)
        root.style.setProperty('--theme-text-inverse', colors.textInverse);

        // Scrollbar colors
        root.style.setProperty('--theme-scrollbar-track', colors.bgSecondary);
        root.style.setProperty('--theme-scrollbar-thumb', colors.borderPrimary);
        root.style.setProperty('--theme-scrollbar-thumb-hover', colors.textMuted);

        // Add a class to body for CSS-based theming
        document.body.classList.remove('theme-dark', 'theme-light', 'theme-green');
        document.body.classList.add(`theme-${resolvedTheme}`);

        // Set color-scheme for native browser elements (scrollbars, form controls)
        const colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light';
        root.style.setProperty('color-scheme', colorScheme);
        document.body.style.colorScheme = colorScheme;

    }, [colors, resolvedTheme]);

    return (
        <ThemeContext.Provider value={{ themeMode, setThemeMode, colors, isDark, syncThemeFromUser }}>
            {children}
        </ThemeContext.Provider>
    );
};

// =============================================================================
// HOOK
// =============================================================================

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// =============================================================================
// EXPORT THEMES FOR REFERENCE
// =============================================================================

export { darkTheme, lightTheme, greenTheme, themes };
