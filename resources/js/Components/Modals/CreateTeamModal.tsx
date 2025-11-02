import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: () => void;
}

export default function CreateTeamModal({ isOpen, onClose, onTeamCreated }: CreateTeamModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  const { projects } = useProject();
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    project_ids: number[];
  }>({
    name: '',
    description: '',
    project_ids: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    // Convert to lowercase and remove invalid characters
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');

    // Check if any characters were removed (invalid input)
    if (value !== sanitized) {
      setNameError('Only lowercase letters, numbers, and underscores are allowed');
    } else {
      setNameError(null);
    }

    setFormData({ ...formData, name: sanitized });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ name: '', description: '', project_ids: [] });
        onTeamCreated();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || t.createteammodal49);
      }
    } catch {
      setError(t.createteammodal52);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ 
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        className="portal-modal-content rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="portal-modal-header flex justify-between items-center">
          <h2 className="flex items-center">
            <i className="pi pi-users mr-2"></i>
            Create New Team
          </h2>
          <button
            onClick={onClose}
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                nameError ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="gen_team_96"
              maxLength={255}
            />
            <small className="text-gray-400 text-xs mt-1 block">
              Only lowercase letters (a-z), numbers (0-9), and underscores (_) allowed
            </small>
            {nameError && (
              <small className="text-red-400 text-xs mt-1 block">{nameError}</small>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t.createteammodal110}
              rows={3}
              maxLength={1000}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Projects
            </label>
            <select
              multiple
              value={formData.project_ids.map(String)}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value));
                setFormData({ ...formData, project_ids: selectedOptions });
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              size={Math.min(4, projects.length || 1)}
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select one or more projects for this team. Hold Ctrl/Cmd to select multiple.
            </p>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded text-white transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <i className="pi pi-check"></i>
                  <span>Create Team</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Render modal content in a portal to the document body
  return createPortal(modalContent, document.body);
}