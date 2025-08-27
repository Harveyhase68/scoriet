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
}

export default function AuthModalManager({ 
  activeModal, 
  onCloseModal, 
  onLoginSuccess,
  onRegistrationSuccess,
  resetPasswordToken,
  resetPasswordEmail
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
      />

      <RegisterModal
        visible={currentModal === 'register'}
        onHide={handleCloseModal}
        onSwitchToLogin={() => handleSwitchModal('login')}
        onRegistrationSuccess={onRegistrationSuccess}
      />

      <ForgotPasswordModal
        visible={currentModal === 'forgot'}
        onHide={handleCloseModal}
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