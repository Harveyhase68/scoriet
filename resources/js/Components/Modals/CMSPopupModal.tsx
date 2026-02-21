import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface CMSPopup {
  id: number;
  title: string;
  content: string;
  popup_priority: number;
  popup_version: number;
  slug: string;
}

interface CMSPopupModalProps {
  popups: CMSPopup[];
  storageKeyPrefix: string; // 'cms_popup_lobby_' or 'cms_popup_app_'
  userId?: number | string | null; // User ID for per-user tracking, null/undefined = 'guest'
  onAllPopupsClosed?: () => void;
}

// Build the full storage key including user ID
const buildStorageKey = (storageKeyPrefix: string, userId: number | string | null | undefined, popupId: number): string => {
  const userPart = userId ? `u${userId}_` : 'guest_';
  return `${storageKeyPrefix}${userPart}${popupId}`;
};

// LocalStorage helper functions
const getClosedPopupVersion = (storageKeyPrefix: string, userId: number | string | null | undefined, popupId: number): number | null => {
  try {
    const key = buildStorageKey(storageKeyPrefix, userId, popupId);
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
};

const setClosedPopupVersion = (storageKeyPrefix: string, userId: number | string | null | undefined, popupId: number, version: number): void => {
  try {
    const key = buildStorageKey(storageKeyPrefix, userId, popupId);
    localStorage.setItem(key, version.toString());
  } catch {
    // LocalStorage not available
  }
};

export default function CMSPopupModal({
  popups,
  storageKeyPrefix,
  userId,
  onAllPopupsClosed
}: CMSPopupModalProps) {
  const { colors } = useTheme();
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const [currentPopupIndex, setCurrentPopupIndex] = useState<number>(-1);
  const [visiblePopups, setVisiblePopups] = useState<CMSPopup[]>([]);
  const [isUpdateVersion, setIsUpdateVersion] = useState<boolean>(false);

  // Filter popups to only show those that haven't been seen with current version
  const filterUnseenPopups = useCallback((allPopups: CMSPopup[]): CMSPopup[] => {
    return allPopups.filter(popup => {
      const closedVersion = getClosedPopupVersion(storageKeyPrefix, userId, popup.id);
      const popupVersion = Number(popup.popup_version) || 1;
      const storedVersion = closedVersion !== null ? Number(closedVersion) : null;

      // Show if never closed or if server version is greater than stored version
      return storedVersion === null || popupVersion > storedVersion;
    }).sort((a, b) => a.popup_priority - b.popup_priority); // Sort by priority (1 = highest)
  }, [storageKeyPrefix, userId]);

  // Initialize on mount or when popups change
  useEffect(() => {
    if (popups && popups.length > 0) {
      const unseen = filterUnseenPopups(popups);
      setVisiblePopups(unseen);
      if (unseen.length > 0) {
        setCurrentPopupIndex(0);
        // Check if this is an update
        const firstPopup = unseen[0];
        const closedVersion = getClosedPopupVersion(storageKeyPrefix, userId, firstPopup.id);
        const isUpdate = closedVersion !== null && Number(firstPopup.popup_version) > Number(closedVersion);
        setIsUpdateVersion(isUpdate);
      }
    }
  }, [popups, filterUnseenPopups, storageKeyPrefix, userId]);

  const handleClose = () => {
    if (currentPopupIndex >= 0 && currentPopupIndex < visiblePopups.length) {
      const currentPopup = visiblePopups[currentPopupIndex];
      // Mark as closed with current version
      setClosedPopupVersion(storageKeyPrefix, userId, currentPopup.id, currentPopup.popup_version);

      // Move to next popup
      const nextIndex = currentPopupIndex + 1;
      if (nextIndex < visiblePopups.length) {
        setCurrentPopupIndex(nextIndex);
        // Check if next popup is an update
        const nextPopup = visiblePopups[nextIndex];
        const closedVersion = getClosedPopupVersion(storageKeyPrefix, userId, nextPopup.id);
        setIsUpdateVersion(closedVersion !== null && nextPopup.popup_version > closedVersion);
      } else {
        // All popups have been shown
        setCurrentPopupIndex(-1);
        if (onAllPopupsClosed) {
          onAllPopupsClosed();
        }
      }
    }
  };

  // Don't render if no popup to show
  if (currentPopupIndex < 0 || currentPopupIndex >= visiblePopups.length) {
    return null;
  }

  const currentPopup = visiblePopups[currentPopupIndex];
  const remainingCount = visiblePopups.length - currentPopupIndex - 1;

  return (
    <Dialog
      visible={true}
      onHide={handleClose}
      modal
      closable={true}
      closeOnEscape={true}
      dismissableMask={false}
      style={{ width: '90vw', maxWidth: '800px' }}
      contentStyle={{
        padding: '20px',
        backgroundColor: colors.bgPrimary,
        color: colors.textPrimary
      }}
      headerStyle={{
        backgroundColor: colors.dialogHeader,
        color: colors.textPrimary,
        border: 'none'
      }}
      header={
        <div className="flex items-center gap-3">
          <span>{currentPopup.title}</span>
          {isUpdateVersion && (
            <Badge value={t.cmspopupmodal146} severity="warning" />
          )}
          {remainingCount > 0 && (
            <Badge value={`+${remainingCount}${t.cmspopupmodal149}`} severity="info" />
          )}
        </div>
      }
      footer={
        <div className="flex justify-between items-center">
          <span className="text-sm" style={{ color: colors.textMuted }}>
            {currentPopupIndex + 1} / {visiblePopups.length}
          </span>
          <Button
            label={remainingCount > 0 ? t.cmspopupmodal156 : t.cmspopupmodal156_2}
            icon={remainingCount > 0 ? 'pi pi-arrow-right' : 'pi pi-check'}
            onClick={handleClose}
            className="p-button-primary"
            style={{ borderRadius: '8px' }}
          />
        </div>
      }
    >
      {/* CMS Content */}
      <div
        className="cms-popup-content"
        dangerouslySetInnerHTML={{ __html: currentPopup.content }}
      />

      {/* Styles for CMS content */}
      <style>{`
        .cms-popup-content {
          max-width: none;
          color: var(--theme-text-secondary);
          line-height: 1.6;
        }
        .cms-popup-content h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.75rem;
          color: var(--theme-text-primary);
        }
        .cms-popup-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.75rem;
          color: var(--theme-text-primary);
        }
        .cms-popup-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: var(--theme-text-primary);
        }
        .cms-popup-content p {
          margin-bottom: 0.75rem;
        }
        .cms-popup-content ul, .cms-popup-content ol {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .cms-popup-content ul {
          list-style-type: disc;
        }
        .cms-popup-content ol {
          list-style-type: decimal;
        }
        .cms-popup-content li {
          margin-bottom: 0.25rem;
        }
        .cms-popup-content a {
          color: var(--theme-accent);
          text-decoration: underline;
        }
        .cms-popup-content a:hover {
          color: var(--theme-accent-hover);
        }
        .cms-popup-content strong, .cms-popup-content b {
          font-weight: 700;
        }
      `}</style>
    </Dialog>
  );
}
