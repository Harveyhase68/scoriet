import React from 'react';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface VersionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewVersion: () => void;
  onContinueEditing: () => void;
  actionDescription: string;
  currentVersion?: string;
  tableName?: string; // Add explicit table name for safety
}

export default function VersionConfirmationModal({
  isOpen,
  onClose,
  onNewVersion,
  onContinueEditing,
  actionDescription,
  currentVersion,
  tableName
}: VersionConfirmationModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  if (!isOpen) return null;

  const displayVersion = currentVersion || t.profilemodal640;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 999999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-gray-800 rounded-lg border border-gray-600 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-600">
          <h3 className="text-lg font-semibold text-white">
            {t.versionconfirmationmodal29}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-300 mb-2">
              {t.versionconfirmationmodal51}<span className="font-semibold text-blue-400">{actionDescription}</span>.
            </p>
            {tableName && (
              <div className="mt-4 p-3 bg-red-900 border border-red-500 rounded">
                <p className="text-red-200 font-bold text-center">
                  {t.versionconfirmationmodal56} "{tableName}" {t.versionconfirmationmodal56a}
                </p>
              </div>
            )}
            <p className="text-gray-400 text-sm">
              {t.versionconfirmationmodal53}
            </p>
          </div>

          <div className="space-y-3">
            {/* New Version Option Button */}
            <button
              onClick={onNewVersion}
              className="w-full p-4 bg-green-900/20 border border-green-600/50 rounded hover:bg-green-900/40 hover:border-green-500 transition-all duration-200 group"
            >
              <div className="flex items-center">
                <span className="text-xl mr-3 group-hover:scale-110 transition-transform">🔄</span>
                <div className="text-left">
                  <div className="font-medium text-green-400 text-base">{t.versionconfirmationmodal67}</div>
                  <div className="text-sm text-green-300/80">
                    {displayVersion} → {displayVersion.replace(/\d+$/, (match) => String(parseInt(match) + 1))}
                  </div>
                </div>
              </div>
            </button>

            {/* Continue Editing Option Button */}
            <button
              onClick={onContinueEditing}
              className="w-full p-4 bg-blue-900/20 border border-blue-600/50 rounded hover:bg-blue-900/40 hover:border-blue-500 transition-all duration-200 group"
            >
              <div className="flex items-center">
                <span className="text-xl mr-3 group-hover:scale-110 transition-transform">✏️</span>
                <div className="text-left">
                  <div className="font-medium text-blue-400 text-base">{t.versionconfirmationmodal90}{displayVersion}{t.versionconfirmationmodal90a}</div>
                  <div className="text-sm text-blue-300/80">
                    {t.versionconfirmationmodal84}
                  </div>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-4 p-3 bg-gray-700/50 rounded text-xs text-gray-400">
            {t.versionconfirmationmodal92}
          </div>
        </div>

        {/* Footer - nur Abbrechen Button */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-600">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
          >
            {t.versionconfirmationmodal102}
          </button>
        </div>
      </div>
    </div>
  );
}