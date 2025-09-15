import React from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import ProfileModal from './ProfileModal';
import ResetPasswordModal from './ResetPasswordModal';

export type AuthModalType = 'login' | 'register' | 'forgot' | 'profile' | 'reset' | null;

interface AuthModalManagerProps {
  activeModal: AuthModalType;
  onCloseModal: () => void;
  onLoginSuccess?: () => void;
  onRegistrationSuccess?: () => void;
  resetPasswordToken?: string;
  resetPasswordEmail?: string;
  isLoginClosable?: boolean;
}

export default function AuthModalManager({
  activeModal,
  onCloseModal,
  onLoginSuccess,
  onRegistrationSuccess,
  resetPasswordToken,
  resetPasswordEmail,
  isLoginClosable = true
}: AuthModalManagerProps) {

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
      />

      <RegisterModal
        visible={currentModal === 'register'}
        onHide={handleCloseModal} // X button closes modal completely
        onSwitchToLogin={() => handleSwitchModal('login')}
        onRegistrationSuccess={onRegistrationSuccess}
      />

      <ForgotPasswordModal
        visible={currentModal === 'forgot'}
        onHide={handleCloseModal} // X button closes modal completely
        onSwitchToLogin={() => handleSwitchModal('login')}
      />

      <ProfileModal
        visible={currentModal === 'profile'}
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