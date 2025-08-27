import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: () => void;
}

export default function CreateTeamModal({ isOpen, onClose, onTeamCreated }: CreateTeamModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_name: 'default'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setFormData({ name: '', description: '', project_name: 'default' });
        onTeamCreated();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create team');
      }
    } catch {
      setError('Network error occurred');
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
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700 shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <i className="pi pi-users mr-2 text-blue-400"></i>
            Create New Team
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
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
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Core Team, Quality Check"
              maxLength={255}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="What does this team do?"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project
            </label>
            <input
              type="text"
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Project name"
              maxLength={255}
            />
            <p className="text-xs text-gray-500 mt-1">
              Teams are organized by project. Default is "default".
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