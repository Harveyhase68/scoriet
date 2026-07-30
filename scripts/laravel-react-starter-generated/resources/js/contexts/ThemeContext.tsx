import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light' | 'green' | 'auto';

export interface ThemeColors {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgHover: string;
    bgSelected: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    borderPrimary: string;
    borderSecondary: string;
    borderFocus: string;
    buttonPrimary: string;
    buttonPrimaryHover: string;
    buttonSecondary: string;
    buttonSecondaryHover: string;
    buttonDanger: string;
    buttonDangerHover: string;
    buttonSuccess: string;
    buttonSuccessHover: string;
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
    accent: string;
    accentHover: string;
    dialogHeader: string;
    dialogContent: string;
    dialogFooter: string;
}

const darkTheme: ThemeColors = {
    bgPrimary: '#1a1a1a',
    bgSecondary: '#1f2937',
    bgTertiary: '#374151',
    bgHover: '#4b5563',
    bgSelected: '#3b82f6',
    textPrimary: '#f3f4f6',
    textSecondary: '#d1d5db',
    textMuted: '#9ca3af',
    textInverse: '#ffffff',
    borderPrimary: '#4b5563',
    borderSecondary: '#374151',
    borderFocus: '#3b82f6',
    buttonPrimary: '#3b82f6',
    buttonPrimaryHover: '#2563eb',
    buttonSecondary: '#4b5563',
    buttonSecondaryHover: '#6b7280',
    buttonDanger: '#dc2626',
    buttonDangerHover: '#b91c1c',
    buttonSuccess: '#16a34a',
    buttonSuccessHover: '#15803d',
    successBg: 'rgba(22, 163, 74, 0.2)',
    successBorder: '#15803d',
    successText: '#86efac',
    errorBg: 'rgba(220, 38, 38, 0.2)',
    errorBorder: '#b91c1c',
    errorText: '#fca5a5',
    warningBg: 'rgba(202, 138, 4, 0.2)',
    warningBorder: '#a16207',
    warningText: '#9c8c3a',
    infoBg: 'rgba(59, 130, 246, 0.2)',
    infoBorder: '#1d4ed8',
    infoText: '#93c5fd',
    accent: '#3b82f6',
    accentHover: '#60a5fa',
    dialogHeader: '#111827',
    dialogContent: '#1f2937',
    dialogFooter: '#111827',
};

const lightTheme: ThemeColors = {
    bgPrimary: '#f9fafb',
    bgSecondary: '#ffffff',
    bgTertiary: '#f3f4f6',
    bgHover: '#e5e7eb',
    bgSelected: '#3b82f6',
    textPrimary: '#111827',
    textSecondary: '#1f2937',
    textMuted: '#4b5563',
    textInverse: '#ffffff',
    borderPrimary: '#d1d5db',
    borderSecondary: '#e5e7eb',
    borderFocus: '#3b82f6',
    buttonPrimary: '#3b82f6',
    buttonPrimaryHover: '#2563eb',
    buttonSecondary: '#e5e7eb',
    buttonSecondaryHover: '#d1d5db',
    buttonDanger: '#dc2626',
    buttonDangerHover: '#b91c1c',
    buttonSuccess: '#16a34a',
    buttonSuccessHover: '#15803d',
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
    accent: '#3b82f6',
    accentHover: '#2563eb',
    dialogHeader: '#f3f4f6',
    dialogContent: '#ffffff',
    dialogFooter: '#f3f4f6',
};

const greenTheme: ThemeColors = {
    bgPrimary: '#f0fdf4',
    bgSecondary: '#ffffff',
    bgTertiary: '#ecfdf5',
    bgHover: '#d1fae5',
    bgSelected: '#16a34a',
    textPrimary: '#111827',
    textSecondary: '#374151',
    textMuted: '#6b7280',
    textInverse: '#ffffff',
    borderPrimary: '#a7f3d0',
    borderSecondary: '#d1fae5',
    borderFocus: '#16a34a',
    buttonPrimary: '#16a34a',
    buttonPrimaryHover: '#15803d',
    buttonSecondary: '#d1fae5',
    buttonSecondaryHover: '#a7f3d0',
    buttonDanger: '#dc2626',
    buttonDangerHover: '#b91c1c',
    buttonSuccess: '#16a34a',
    buttonSuccessHover: '#15803d',
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
    accent: '#16a34a',
    accentHover: '#15803d',
    dialogHeader: '#ecfdf5',
    dialogContent: '#ffffff',
    dialogFooter: '#ecfdf5',
};

const themes: Record<Exclude<ThemeMode, 'auto'>, ThemeColors> = {
    dark: darkTheme,
    light: lightTheme,
    green: greenTheme,
};

interface ThemeContextType {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    colors: ThemeColors;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
        const stored = localStorage.getItem('template_theme');
        if (stored && ['dark', 'light', 'green', 'auto'].includes(stored)) {
            return stored as ThemeMode;
        }
        return 'dark';
    });

    const [resolvedTheme, setResolvedTheme] = useState<Exclude<ThemeMode, 'auto'>>(() => {
        if (themeMode === 'auto') {
            const hour = new Date().getHours();
            return (hour >= 6 && hour < 18) ? 'light' : 'dark';
        }
        return themeMode as Exclude<ThemeMode, 'auto'>;
    });

    useEffect(() => {
        if (themeMode === 'auto') {
            const updateAutoTheme = () => {
                const hour = new Date().getHours();
                setResolvedTheme((hour >= 6 && hour < 18) ? 'light' : 'dark');
            };
            updateAutoTheme();
            const interval = setInterval(updateAutoTheme, 60000);
            return () => clearInterval(interval);
        } else {
            setResolvedTheme(themeMode as Exclude<ThemeMode, 'auto'>);
        }
    }, [themeMode]);

    const setThemeMode = useCallback((mode: ThemeMode) => {
        localStorage.setItem('template_theme', mode);
        setThemeModeState(mode);
    }, []);

    const colors = themes[resolvedTheme];
    const isDark = resolvedTheme === 'dark';

    useEffect(() => {
        const root = document.documentElement;

        root.style.setProperty('--theme-bg-primary', colors.bgPrimary);
        root.style.setProperty('--theme-bg-secondary', colors.bgSecondary);
        root.style.setProperty('--theme-bg-tertiary', colors.bgTertiary);
        root.style.setProperty('--theme-bg-hover', colors.bgHover);
        root.style.setProperty('--theme-text-primary', colors.textPrimary);
        root.style.setProperty('--theme-text-secondary', colors.textSecondary);
        root.style.setProperty('--theme-text-muted', colors.textMuted);
        root.style.setProperty('--theme-border-primary', colors.borderPrimary);
        root.style.setProperty('--theme-border-secondary', colors.borderSecondary);
        root.style.setProperty('--theme-accent', colors.accent);
        root.style.setProperty('--theme-accent-hover', colors.accentHover);
        root.style.setProperty('--theme-accent-transparent', `${colors.accent}4d`);
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
        root.style.setProperty('--theme-button-primary', colors.buttonPrimary);
        root.style.setProperty('--theme-button-secondary', colors.buttonSecondary);
        root.style.setProperty('--theme-button-danger', colors.buttonDanger);
        root.style.setProperty('--theme-button-success', colors.buttonSuccess);
        root.style.setProperty('--theme-dialog-header', colors.dialogHeader);
        root.style.setProperty('--theme-dialog-content', colors.dialogContent);
        root.style.setProperty('--theme-dialog-footer', colors.dialogFooter);
        root.style.setProperty('--theme-text-inverse', colors.textInverse);
        root.style.setProperty('--theme-scrollbar-track', colors.bgSecondary);
        root.style.setProperty('--theme-scrollbar-thumb', colors.borderPrimary);
        root.style.setProperty('--theme-scrollbar-thumb-hover', colors.textMuted);

        document.body.classList.remove('theme-dark', 'theme-light', 'theme-green');
        document.body.classList.add(`theme-${resolvedTheme}`);

        const colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light';
        root.style.setProperty('color-scheme', colorScheme);
        document.body.style.colorScheme = colorScheme;
    }, [colors, resolvedTheme]);

    return (
        <ThemeContext.Provider value={{ themeMode, setThemeMode, colors, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export { darkTheme, lightTheme, greenTheme, themes };
