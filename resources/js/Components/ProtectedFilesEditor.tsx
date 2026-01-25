import React, { useState } from 'react';
//import { useTranslation } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { colors } = useTheme();
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
      {title && <h3 className="text-lg font-semibold mb-3 theme-text-primary">{title}</h3>}

      <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}`, color: colors.infoText }}>
        <strong>Info:</strong> These files will not be overwritten during updates.
        They are typically configuration files like <code style={{ backgroundColor: colors.bgTertiary }} className="px-1 rounded">.env</code>, <code style={{ backgroundColor: colors.bgTertiary }} className="px-1 rounded">config.toml</code>, or database files.
      </div>

      {!readOnly && (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newFile}
            onChange={(e) => setNewFile(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., .env, config.toml, data/local.db"
            className="flex-1 px-3 py-2 border rounded focus:outline-none"
            style={{
              backgroundColor: colors.bgSecondary,
              color: colors.textPrimary,
              borderColor: colors.borderPrimary,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.accent;
              e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.accent}40`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.borderPrimary;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <button
            type="button"
            onClick={handleAdd}
            className="px-4 py-2 rounded transition"
            style={{ backgroundColor: colors.buttonPrimary, color: colors.textInverse }}
            disabled={!newFile.trim()}
          >
            Add File
          </button>
        </div>
      )}

      <div className="space-y-2">
        {files.length === 0 ? (
          <div className="italic p-3 text-center border border-dashed rounded theme-text-muted theme-border-primary">
            No protected files defined
          </div>
        ) : (
          files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded transition"
              style={{
                backgroundColor: colors.bgTertiary,
                border: `1px solid ${colors.borderPrimary}`,
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.bgTertiary}
            >
              <span className="font-mono text-sm theme-text-primary">{file}</span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="font-bold"
                  style={{ color: colors.buttonDanger }}
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
