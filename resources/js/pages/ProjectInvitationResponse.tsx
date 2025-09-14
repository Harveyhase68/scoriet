import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';

interface ProjectInvitationResponseProps {
  token: string;
  action: 'accept' | 'decline';
}

interface InvitationData {
  id: number;
  invited_email: string;
  role: string;
  message?: string;
  expires_at: string;
  project: {
    id: number;
    name: string;
    description?: string;
    owner: {
      name: string;
      email: string;
    };
  };
  inviter: {
    name: string;
    email: string;
  };
}

export default function ProjectInvitationResponse({ token, action }: ProjectInvitationResponseProps) {
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [userExists, setUserExists] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [completed, setCompleted] = useState(false);

  // Registration modal state
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: ''
  });

  const loadInvitationInfo = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Get invitation info via the API (we'll need a new endpoint for this)
      const response = await fetch(`/api/project-invitations/info/${token}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid or expired invitation');
      }

      const data = await response.json();
      setInvitation(data.invitation);
      setUserExists(data.user_exists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInvitationInfo();
  }, [loadInvitationInfo]);

  const handleResponse = async () => {
    if (!invitation) return;

    try {
      setProcessing(true);
      setError('');

      const response = await fetch(`/api/project-invitations/${action}/${token}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setCompleted(true);
      } else {
        throw new Error(data.message || `Failed to ${action} invitation`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Error ${action}ing invitation`);
    } finally {
      setProcessing(false);
    }
  };

  const goToApp = () => {
    window.location.href = '/app';
  };

  const openRegistrationModal = () => {
    if (invitation) {
      setRegistrationForm(prev => ({
        ...prev,
        email: invitation.invited_email
      }));
      setShowRegistrationModal(true);
    }
  };

  const handleRegistration = async () => {
    if (!registrationForm.name || !registrationForm.username || !registrationForm.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (registrationForm.password !== registrationForm.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    try {
      setRegistering(true);
      setError('');

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationForm),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Please check your email to verify your account.');
        setShowRegistrationModal(false);
        setTimeout(() => {
          setCompleted(true);
        }, 2000);
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error during registration');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ProgressSpinner />
          <p className="text-gray-300 mt-4">Loading invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🚀 Scoriet</h1>
          <p className="text-gray-400">Enterprise Code Generator</p>
        </div>

        <Card className="bg-gray-800 border border-gray-700">
          <div className="p-6">
            {error && (
              <Message 
                severity="error" 
                text={error} 
                className="mb-4"
              />
            )}

            {success && (
              <Message 
                severity="success" 
                text={success} 
                className="mb-4"
              />
            )}

            {!completed && invitation && (
              <>
                {!userExists ? (
                  // User doesn't exist - show registration prompt
                  <>
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        Welcome to Scoriet! 🎉
                      </h2>
                      <p className="text-gray-300">
                        You've been invited to join a project, but first you need to create an account
                      </p>
                    </div>
                  </>
                ) : (
                  // User exists - show normal accept/decline
                  <>
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {action === 'accept' ? 'Accept' : 'Decline'} Project Invitation
                      </h2>
                      <p className="text-gray-300">
                        You've been invited to join a project on Scoriet
                      </p>
                    </div>
                  </>
                )}

                {/* Invitation Details */}
                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {invitation.project.name}
                      </h3>
                      {invitation.project.description && (
                        <p className="text-gray-300 mb-3">{invitation.project.description}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Invited by:</span>
                        <div className="text-white font-medium">
                          {invitation.inviter.name}
                        </div>
                        <div className="text-gray-300">
                          {invitation.inviter.email}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-400">Role:</span>
                        <div className="text-white font-medium capitalize">
                          {invitation.role}
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-400">Project Owner:</span>
                        <div className="text-white font-medium">
                          {invitation.project.owner.name}
                        </div>
                        <div className="text-gray-300">
                          {invitation.project.owner.email}
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-400">Expires:</span>
                        <div className="text-white font-medium">
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {invitation.message && (
                      <div className="border-t border-gray-600 pt-4">
                        <span className="text-gray-400 text-sm">Personal message:</span>
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mt-2 rounded">
                          <p className="text-yellow-800 italic">"{invitation.message}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="text-center space-y-4">
                  {!userExists ? (
                    // User doesn't exist - show registration button
                    <>
                      <Button
                        label="🚀 Create Account & Join Project"
                        icon="pi pi-user-plus"
                        onClick={openRegistrationModal}
                        className="p-button-success p-button-lg w-full"
                        size="large"
                      />
                      <p className="text-gray-400 text-sm">
                        You'll create a free Scoriet account and automatically join this project as a {invitation.role}.
                      </p>
                      <div className="text-center mt-4">
                        <p className="text-gray-500 text-sm">
                          Already have an account?{' '}
                          <button
                            onClick={() => window.location.href = `/?login=1&email=${encodeURIComponent(invitation.invited_email)}`}
                            className="text-blue-400 hover:text-blue-300 underline"
                          >
                            Sign in here
                          </button>
                        </p>
                      </div>
                    </>
                  ) : (
                    // User exists - show normal accept/decline buttons
                    <>
                      {action === 'accept' ? (
                        <>
                          <Button
                            label="✅ Accept Invitation"
                            icon={processing ? "pi pi-spinner pi-spin" : "pi pi-check"}
                            onClick={handleResponse}
                            disabled={processing}
                            className="p-button-success p-button-lg w-full"
                            size="large"
                          />
                          <p className="text-gray-400 text-sm">
                            By accepting, you'll become a {invitation.role} of this project and gain access to collaborate with the team.
                          </p>
                        </>
                      ) : (
                        <>
                          <Button
                            label="❌ Decline Invitation"
                            icon={processing ? "pi pi-spinner pi-spin" : "pi pi-times"}
                            onClick={handleResponse}
                            disabled={processing}
                            className="p-button-danger p-button-lg w-full"
                            size="large"
                          />
                          <p className="text-gray-400 text-sm">
                            You can decline this invitation if you're not interested in joining this project.
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {completed && (
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {action === 'accept' ? '🎉' : '👋'}
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {action === 'accept' 
                    ? 'Welcome to the team!' 
                    : 'Invitation declined'
                  }
                </h2>
                <p className="text-gray-300 mb-6">
                  {action === 'accept'
                    ? 'You can now access the project and start collaborating with your team.'
                    : 'The project owner has been notified of your decision.'
                  }
                </p>
                
                {action === 'accept' && (
                  <Button
                    label="Go to Scoriet App"
                    icon="pi pi-arrow-right"
                    onClick={goToApp}
                    className="p-button-primary p-button-lg"
                    size="large"
                  />
                )}
              </div>
            )}
          </div>
        </Card>

        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>This is an automated message from Scoriet - Enterprise Code Generator</p>
        </div>
      </div>

      {/* Registration Modal */}
      <Dialog
        visible={showRegistrationModal}
        onHide={() => setShowRegistrationModal(false)}
        header="Create Your Scoriet Account"
        style={{ width: '500px' }}
        closable={!registering}
        dismissableMask={!registering}
        className="p-fluid"
      >
        <div className="space-y-4">
          {error && <Message severity="error" text={error} />}

          <div className="field">
            <label htmlFor="name" className="font-medium">Full Name *</label>
            <InputText
              id="name"
              value={registrationForm.name}
              onChange={(e) => setRegistrationForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="John Doe"
              disabled={registering}
            />
          </div>

          <div className="field">
            <label htmlFor="username" className="font-medium">Username *</label>
            <InputText
              id="username"
              value={registrationForm.username}
              onChange={(e) => setRegistrationForm(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
              placeholder="johndoe"
              disabled={registering}
            />
            <small className="text-gray-500">Only lowercase letters, numbers, hyphens and underscores</small>
          </div>

          <div className="field">
            <label htmlFor="email" className="font-medium">Email Address *</label>
            <InputText
              id="email"
              type="email"
              value={registrationForm.email}
              onChange={(e) => setRegistrationForm(prev => ({ ...prev, email: e.target.value }))}
              disabled={true}
              className="bg-gray-100"
            />
            <small className="text-gray-500">Pre-filled from invitation</small>
          </div>

          <div className="field">
            <label htmlFor="password" className="font-medium">Password *</label>
            <Password
              id="password"
              value={registrationForm.password}
              onChange={(e) => setRegistrationForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter your password"
              disabled={registering}
              feedback={false}
              toggleMask
            />
          </div>

          <div className="field">
            <label htmlFor="password_confirmation" className="font-medium">Confirm Password *</label>
            <Password
              id="password_confirmation"
              value={registrationForm.password_confirmation}
              onChange={(e) => setRegistrationForm(prev => ({ ...prev, password_confirmation: e.target.value }))}
              placeholder="Confirm your password"
              disabled={registering}
              feedback={false}
              toggleMask
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowRegistrationModal(false)}
              className="p-button-text"
              disabled={registering}
            />
            <Button
              label="Create Account"
              icon={registering ? "pi pi-spinner pi-spin" : "pi pi-check"}
              onClick={handleRegistration}
              disabled={registering}
              className="p-button-success"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}