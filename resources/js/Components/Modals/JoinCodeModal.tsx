import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { Card } from 'primereact/card';

interface Project {
  id: number;
  name: string;
  description: string;
  owner: {
    id: number;
    name: string;
    username?: string;
  };
  teams_count?: number;
  created_at: string;
}

interface JoinCodeModalProps {
  visible: boolean;
  onHide: () => void;
  onSuccess?: () => void;
}

export default function JoinCodeModal({ visible, onHide, onSuccess }: JoinCodeModalProps) {
  const [joinCode, setJoinCode] = useState('');
  const [message, setMessage] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'input' | 'preview' | 'applied'>('input');

  const handleLookupProject = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a join code');
      return;
    }

    setLoading(true);
    setError('');
    setProject(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/join-code/${joinCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid join code');
      }

      const data = await response.json();
      setProject(data.project);
      
      if (data.has_applied) {
        setError('You have already applied to this project');
        return;
      }

      setStep('preview');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error looking up project');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!project || !joinCode) return;

    setApplying(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/project-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          join_code: joinCode,
          message: message
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit application');
      }

      setStep('applied');
      setSuccess('Application submitted successfully! The project owner will review your request.');
      
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error submitting application');
    } finally {
      setApplying(false);
    }
  };

  const handleClose = () => {
    setJoinCode('');
    setMessage('');
    setProject(null);
    setError('');
    setSuccess('');
    setStep('input');
    onHide();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog
      header={
        step === 'input' ? "Join Project" :
        step === 'preview' ? "Apply to Project" :
        "Application Sent"
      }
      visible={visible}
      onHide={handleClose}
      style={{ width: '500px' }}
      modal
      closable
      draggable={false}
      resizable={false}
      className="p-dialog-custom"
    >
      <div className="space-y-4">
        {error && (
          <Message severity="error" text={error} />
        )}

        {success && (
          <Message severity="success" text={success} />
        )}

        {step === 'input' && (
          <>
            <div className="field">
              <label htmlFor="join-code" className="block text-sm font-medium text-gray-700 mb-2">
                Join Code
              </label>
              <div className="flex space-x-2">
                <InputText
                  id="join-code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="PROJ-XXXXXXXX"
                  className="flex-1"
                  disabled={loading}
                  maxLength={13}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleLookupProject();
                    }
                  }}
                />
                <Button
                  label="Lookup"
                  icon={loading ? "pi pi-spinner pi-spin" : "pi pi-search"}
                  onClick={handleLookupProject}
                  disabled={loading || !joinCode.trim()}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter the project join code provided by the project owner.
              </p>
            </div>
          </>
        )}

        {step === 'preview' && project && (
          <>
            <Card title="Project Information" className="mb-4">
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                  <p className="text-gray-600 text-sm">
                    {project.description || 'No description provided'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Owner:</span>
                    <div className="flex items-center space-x-1 mt-1">
                      <i className="pi pi-user text-blue-500"></i>
                      <span>{project.owner.name}</span>
                      {project.owner.username && (
                        <span className="text-gray-500">(@{project.owner.username})</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <div className="mt-1">{formatDate(project.created_at)}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {project.teams_count || 0}
                    </div>
                    <div className="text-xs text-gray-500">Teams</div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="field">
              <label htmlFor="application-message" className="block text-sm font-medium text-gray-700 mb-2">
                Application Message (Optional)
              </label>
              <InputTextarea
                id="application-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell the project owner why you'd like to join this project..."
                className="w-full"
                rows={4}
                disabled={applying}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {message.length}/500 characters
              </p>
            </div>
          </>
        )}

        {step === 'applied' && (
          <div className="text-center py-6">
            <i className="pi pi-check-circle text-6xl text-green-500 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Application Sent!</h3>
            <p className="text-gray-600">
              Your application has been submitted to <strong>{project?.name}</strong>.
              The project owner will review your request and notify you of their decision.
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          {step === 'input' && (
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={handleClose}
              className="p-button-text"
              disabled={loading}
            />
          )}

          {step === 'preview' && (
            <>
              <Button
                label="Back"
                icon="pi pi-arrow-left"
                onClick={() => setStep('input')}
                className="p-button-text"
                disabled={applying}
              />
              <Button
                label={applying ? "Submitting..." : "Apply to Project"}
                icon={applying ? "pi pi-spinner pi-spin" : "pi pi-send"}
                onClick={handleApply}
                disabled={applying}
              />
            </>
          )}

          {step === 'applied' && (
            <Button
              label="Done"
              icon="pi pi-check"
              onClick={handleClose}
            />
          )}
        </div>
      </div>
    </Dialog>
  );
}