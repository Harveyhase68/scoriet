import React, { useState } from 'react';
//import { useTranslation } from '@/i18n';

interface ProtectedFilesEditorProps {
  files: string[];
  onChange: (files: string[]) => void;
  readOnly?: boolean;
  title?: string;
}

export const ProtectedFilesEditor: React.FC<ProtectedFilesEditorProps> = ({
  files,
  onChange,
  readOnly = false,
  title
}) => {
  //const { t } = useTranslation('en');
  const [newFile, setNewFile] = useState('');

  const handleAdd = () => {
    if (newFile.trim() && !files.includes(newFile.trim())) {
      onChange([...files, newFile.trim()]);
      setNewFile('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="protected-files-editor">
      {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}

      <div className="mb-4 p-3 bg-blue-900 border border-blue-700 rounded text-sm text-blue-100">
        <strong>Info:</strong> These files will not be overwritten during updates.
        They are typically configuration files like <code className="bg-blue-800 px-1 rounded">.env</code>, <code className="bg-blue-800 px-1 rounded">config.toml</code>, or database files.
      </div>

      {!readOnly && (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newFile}
            onChange={(e) => setNewFile(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., .env, config.toml, data/local.db"
            className="flex-1 px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            disabled={!newFile.trim()}
          >
            Add File
          </button>
        </div>
      )}

      <div className="space-y-2">
        {files.length === 0 ? (
          <div className="text-gray-400 italic p-3 text-center border border-dashed border-gray-600 rounded">
            No protected files defined
          </div>
        ) : (
          files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 transition"
            >
              <span className="font-mono text-sm text-gray-100">{file}</span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="text-red-500 hover:text-red-700 font-bold"
                  title="Remove"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
