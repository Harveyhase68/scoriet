import React, { useState } from 'react';
import LoginPanel from './LoginPanel';
import RegisterPanel from './RegisterPanel';
import ProfilePanel from './ProfilePanel';
import ForgotPasswordPanel from './ForgotPasswordPanel';

type AuthPanelType = 'login' | 'register' | 'profile' | 'forgot';

interface AuthPanelProps {
  initialPanel?: AuthPanelType;
}

export default function AuthPanel({ initialPanel = 'login' }: AuthPanelProps) {
  const [currentPanel, setCurrentPanel] = useState<AuthPanelType>(initialPanel);

  const handleSwitchPanel = (panelType: string) => {
    setCurrentPanel(panelType as AuthPanelType);
  };

  switch (currentPanel) {
    case 'login':
      return <LoginPanel onSwitchPanel={handleSwitchPanel} />;
    case 'register':
      return <RegisterPanel onSwitchPanel={handleSwitchPanel} />;
    case 'profile':
      return <ProfilePanel />;
    case 'forgot':
      return <ForgotPasswordPanel onSwitchPanel={handleSwitchPanel} />;
    default:
      return <LoginPanel onSwitchPanel={handleSwitchPanel} />;
  }
}