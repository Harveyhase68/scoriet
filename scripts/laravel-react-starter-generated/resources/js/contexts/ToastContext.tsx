import React, { createContext, useState, useContext, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface ToastContextType {
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showInfo: (message: string) => void;
    showWarn: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const toastRef = useRef<Toast>(null);
    const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);

    const showSuccess = (message: string) => {
        toastRef.current?.show({
            severity: 'success',
            summary: t.toastSuccess || 'Success',
            detail: message,
            life: 3000
        });
    };

    const showError = (message: string) => {
        toastRef.current?.show({
            severity: 'error',
            summary: t.toastError || 'Error',
            detail: message,
            life: 4000
        });
    };

    const showInfo = (message: string) => {
        toastRef.current?.show({
            severity: 'info',
            summary: t.toastInfo || 'Info',
            detail: message,
            life: 3000
        });
    };

    const showWarn = (message: string) => {
        toastRef.current?.show({
            severity: 'warn',
            summary: t.toastWarning || 'Warning',
            detail: message,
            life: 3000
        });
    };

    return (
        <ToastContext.Provider value={{ showSuccess, showError, showInfo, showWarn }}>
            <Toast ref={toastRef} position="top-right" />
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
