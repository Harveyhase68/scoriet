import React, { createContext, useContext, useRef } from 'react';
import { Toast } from 'primereact/toast';

interface ToastContextType {
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showInfo: (message: string) => void;
    showWarn: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const toastRef = useRef<Toast>(null);

    const showSuccess = (message: string) => {
        toastRef.current?.show({
            severity: 'success',
            summary: 'Erfolg',
            detail: message,
            life: 3000
        });
    };

    const showError = (message: string) => {
        toastRef.current?.show({
            severity: 'error',
            summary: 'Fehler',
            detail: message,
            life: 4000
        });
    };

    const showInfo = (message: string) => {
        toastRef.current?.show({
            severity: 'info',
            summary: 'Info',
            detail: message,
            life: 3000
        });
    };

    const showWarn = (message: string) => {
        toastRef.current?.show({
            severity: 'warn',
            summary: 'Warnung',
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
