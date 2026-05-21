import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
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

  const displayVersion = currentVersion || t.profilemodal640;

  return (
    <Dialog
      visible={isOpen}
      onHide={onClose}
      header={t.versionconfirmationmodal29}
      style={{ width: '500px' }}
      modal
      draggable
      resizable
      className="p-fluid p-dialog-custom"
      contentStyle={{ padding: '0' }}
    >
      <div className="flex flex-col">
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

        {/* Footer — Cancel button, anchored at bottom via flex-shrink-0. */}
        <div className="flex justify-end gap-2 px-6 pb-4 pt-3 flex-shrink-0" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
          <Button
            label={t.versionconfirmationmodal102}
            icon="pi pi-times"
            className="p-button-text"
            onClick={onClose}
          />
        </div>
      </div>
    </Dialog>
  );
}