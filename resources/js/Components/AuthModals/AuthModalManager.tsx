import React from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import ProfileModal from './ProfileModal';
import ResetPasswordModal from './ResetPasswordModal';
import PlanModal from './PlanModal';
import { SupportedLanguage, getStoredLanguage } from '@/i18n';

export type AuthModalType = 'login' | 'register' | 'forgot' | 'profile' | 'plan' | 'reset' | null;

interface AuthModalManagerProps {
  activeModal: AuthModalType;
  onCloseModal: () => void;
  onLoginSuccess?: () => void;
  onRegistrationSuccess?: (message: string) => void;
  resetPasswordToken?: string;
  resetPasswordEmail?: string;
  isLoginClosable?: boolean;
  currentLanguage?: SupportedLanguage;
  profileDefaultTab?: number; // Tab index to open in ProfileModal (0=Profile, 1=Password, 2=Subscriptions, etc.)
  inviteToken?: string | null; // Registration invite token
  prefillEmail?: string;
  prefillPassword?: string;
  demoSystemBypass?: string;
}

export default function AuthModalManager({
  activeModal,
  onCloseModal,
  onLoginSuccess,
  onRegistrationSuccess,
  resetPasswordToken,
  resetPasswordEmail,
  isLoginClosable = true,
  currentLanguage: propLanguage,
  profileDefaultTab = 0,
  inviteToken,
  prefillEmail,
  prefillPassword,
  demoSystemBypass
}: AuthModalManagerProps) {
  // Use prop language or fallback to stored language
  const currentLanguage = propLanguage || getStoredLanguage();

  const [currentModal, setCurrentModal] = React.useState<AuthModalType>(activeModal);

  // Update local state when prop changes - but don't override our local management
  React.useEffect(() => {
    // Only update if activeModal is not null or if we don't have a current modal
    if (activeModal !== null) {
      setCurrentModal(activeModal);
    } else if (currentModal === null) {
      setCurrentModal(null);
    } else {
      // Don't override - keep the current modal for proper closing
    }
  }, [activeModal, currentModal]);

  const handleSwitchModal = (modalType: AuthModalType) => {
    // DIRECT APPROACH: Set local state immediately
    setCurrentModal(modalType);
    localStorage.setItem('auth_modal_interaction', 'true');

    // Also dispatch event (for future when cache works)
    const event = new CustomEvent('auth-modal-switch', {
      detail: { modalType }
    });
    window.dispatchEvent(event);
  };

  const handleCloseModal = () => {
    // Only prevent closing if it's DIRECTLY the login modal and not closable
    // Don't prevent closing other modals (register, forgot password)
    if (currentModal === 'login' && !isLoginClosable) {
      return;
    }

    setCurrentModal(null);
    onCloseModal();
  };

  return (
    <>
      <LoginModal
        visible={currentModal === 'login'}
        onHide={handleCloseModal}
        onSwitchToRegister={() => handleSwitchModal('register')}
        onSwitchToForgotPassword={() => handleSwitchModal('forgot')}
        onLoginSuccess={onLoginSuccess}
        closable={isLoginClosable}
        currentLanguage={currentLanguage}
        prefillEmail={prefillEmail}
        prefillPassword={prefillPassword}
        demoSystemBypass={demoSystemBypass}
      />

      <RegisterModal
        visible={currentModal === 'register'}
        onHide={handleCloseModal} // X button closes modal completely
        onSwitchToLogin={() => handleSwitchModal('login')}
        onRegistrationSuccess={onRegistrationSuccess}
        currentLanguage={currentLanguage}
        inviteToken={inviteToken}
      />

      <ForgotPasswordModal
        visible={currentModal === 'forgot'}
        onHide={handleCloseModal} // X button closes modal completely
        onSwitchToLogin={() => handleSwitchModal('login')}
      />

      <ProfileModal
        visible={currentModal === 'profile'}
        onHide={handleCloseModal}
        defaultTab={profileDefaultTab}
      />

      <PlanModal
        visible={currentModal === 'plan'}
        onHide={handleCloseModal}
      />

      {resetPasswordToken && resetPasswordEmail && (
        <ResetPasswordModal
          visible={currentModal === 'reset'}
          onHide={handleCloseModal}
          token={resetPasswordToken}
          email={resetPasswordEmail}
          onSwitchToLogin={() => handleSwitchModal('login')}
        />
      )}
    </>
  );
}