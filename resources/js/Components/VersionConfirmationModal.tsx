import React from 'react';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { colors } = useTheme();

  if (!isOpen) return null;

  const displayVersion = currentVersion || t.profilemodal640;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 999999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div
        className="rounded-lg w-full max-w-md mx-4"
        style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center p-4"
          style={{ borderBottom: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.dialogHeader }}
        >
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            {t.versionconfirmationmodal29}
          </h3>
          <button
            onClick={onClose}
            className="transition-colors hover:opacity-80"
            style={{ color: colors.textMuted }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-6">
            <p className="mb-2" style={{ color: colors.textSecondary }}>
              {t.versionconfirmationmodal51}<span className="font-semibold" style={{ color: colors.accent }}>{actionDescription}</span>.
            </p>
            {tableName && (
              <div
                className="mt-4 p-3 rounded"
                style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}` }}
              >
                <p className="font-bold text-center" style={{ color: colors.errorText }}>
                  {t.versionconfirmationmodal56} "{tableName}" {t.versionconfirmationmodal56a}
                </p>
              </div>
            )}
            <p className="text-sm" style={{ color: colors.textMuted }}>
              {t.versionconfirmationmodal53}
            </p>
          </div>

          <div className="space-y-3">
            {/* New Version Option Button */}
            <button
              onClick={onNewVersion}
              className="w-full p-4 rounded transition-all duration-200 group hover:opacity-90"
              style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successBorder}` }}
            >
              <div className="flex items-center">
                <span className="text-xl mr-3 group-hover:scale-110 transition-transform">🔄</span>
                <div className="text-left">
                  <div className="font-medium text-base" style={{ color: colors.successText }}>{t.versionconfirmationmodal67}</div>
                  <div className="text-sm" style={{ color: colors.successText, opacity: 0.8 }}>
                    {displayVersion} → {displayVersion.replace(/\d+$/, (match) => String(parseInt(match) + 1))}
                  </div>
                </div>
              </div>
            </button>

            {/* Continue Editing Option Button */}
            <button
              onClick={onContinueEditing}
              className="w-full p-4 rounded transition-all duration-200 group hover:opacity-90"
              style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}
            >
              <div className="flex items-center">
                <span className="text-xl mr-3 group-hover:scale-110 transition-transform">✏️</span>
                <div className="text-left">
                  <div className="font-medium text-base" style={{ color: colors.infoText }}>{t.versionconfirmationmodal90}{displayVersion}{t.versionconfirmationmodal90a}</div>
                  <div className="text-sm" style={{ color: colors.infoText, opacity: 0.8 }}>
                    {t.versionconfirmationmodal84}
                  </div>
                </div>
              </div>
            </button>
          </div>

          <div
            className="mt-4 p-3 rounded text-xs"
            style={{ backgroundColor: colors.bgTertiary, color: colors.textMuted }}
          >
            {t.versionconfirmationmodal92}
          </div>
        </div>

        {/* Footer - nur Abbrechen Button */}
        <div
          className="flex justify-end gap-3 p-4"
          style={{ borderTop: `1px solid ${colors.borderPrimary}` }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded transition-colors hover:opacity-90"
            style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
          >
            {t.versionconfirmationmodal102}
          </button>
        </div>
      </div>
    </div>
  );
}