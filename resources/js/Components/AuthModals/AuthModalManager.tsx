import React, { useState } from 'react';
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
  const [currentModal, setCurrentModal] = useState<AuthModalType>(null);

  // Update currentModal when activeModal changes
  React.useEffect(() => {
    setCurrentModal(activeModal);
  }, [activeModal]);

  const handleSwitchModal = (modalType: AuthModalType) => {
    setCurrentModal(modalType);
  };

  const handleCloseModal = () => {
    // Prevent closing login modal if not closable
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
        onHide={() => handleSwitchModal('login')} // X button returns to login
        onSwitchToLogin={() => handleSwitchModal('login')}
        onRegistrationSuccess={onRegistrationSuccess}
      />

      <ForgotPasswordModal
        visible={currentModal === 'forgot'}
        onHide={() => handleSwitchModal('login')} // X button returns to login
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