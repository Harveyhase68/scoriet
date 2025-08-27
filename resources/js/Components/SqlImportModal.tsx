// resources/js/Components/SqlImportModal.tsx
import React, { useState, useRef } from 'react';

interface SqlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

export default function SqlImportModal({ isOpen, onClose, onSuccess }: SqlImportModalProps) {
  const [sqlScript, setSqlScript] = useState('');
  const [versionName, setVersionName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModal = () => {
    setSqlScript('');
    setVersionName('');
    setDescription('');
    setError(null);
    setActiveTab('paste');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetModal();
      onClose();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSqlScript(content);
        
        // Auto-generate version name from filename
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        setVersionName(fileName || `Import ${new Date().toLocaleDateString()}`);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sqlScript.trim()) {
      setError('SQL script is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const payload = {
        sql_script: sqlScript,
        version_name: versionName || `Version ${new Date().toLocaleString()}`,
        description: description || null,
      };

      const response = await fetch('/api/sql-parse-and-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to import SQL');
      }

      // Success!
      onSuccess(result);
      handleClose();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-600">
          <div>
            <h2 className="text-xl font-bold text-white">📥 Import SQL Schema</h2>
            <p className="text-sm text-gray-400">Import database schema from SQL script</p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Tabs */}
          <div className="flex border-b border-gray-600">
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'paste'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📝 Paste SQL
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📁 Upload File
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded text-red-200">
                <div className="flex items-center">
                  <span className="mr-2">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Version Info */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Version Name
                </label>
                <input
                  type="text"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder="e.g., V1.0 or Schema Update"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Content Area */}
            {activeTab === 'paste' ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SQL Script
                </label>
                <textarea
                  value={sqlScript}
                  onChange={(e) => setSqlScript(e.target.value)}
                  placeholder="Paste your SQL CREATE TABLE statements here..."
                  rows={12}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none font-mono text-sm resize-none"
                />
                <div className="mt-2 text-xs text-gray-400">
                  Supports MySQL CREATE TABLE, ALTER TABLE statements and constraints
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload SQL File
                </label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".sql,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {sqlScript ? (
                    <div className="text-green-400">
                      <div className="text-2xl mb-2">✅</div>
                      <p className="font-medium">File loaded successfully!</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {sqlScript.length} characters loaded
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                      >
                        Choose Different File
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <div className="text-4xl mb-3">📁</div>
                      <p className="font-medium mb-2">Click to select SQL file</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Supports .sql and .txt files
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                      >
                        Choose File
                      </button>
                    </div>
                  )}
                </div>
                
                {sqlScript && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Preview (first 500 characters)
                    </label>
                    <div className="bg-gray-900 border border-gray-600 rounded p-3 text-xs font-mono text-gray-300 max-h-32 overflow-y-auto">
                      {sqlScript.substring(0, 500)}
                      {sqlScript.length > 500 && '...'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-600 bg-gray-900">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !sqlScript.trim()}
              className={`px-6 py-2 rounded font-medium transition-colors ${
                loading || !sqlScript.trim()
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2">⚪</div>
                  Importing...
                </div>
              ) : (
                '📥 Import Schema'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}