import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface ProjectUnlockModalProps {
  visible: boolean;
  onHide: () => void;
  onConfirm: () => void;
  onBuyCredits: () => void;
  onUpgradePatron?: () => void;
  currentCredits: number;
  creditCost?: number;
  resourceType?: 'project' | 'database';
  currentCount?: number;
  maxFreeCount?: number;
}

export default function ProjectUnlockModal({
  visible,
  onHide,
  onConfirm,
  onBuyCredits,
  onUpgradePatron,
  currentCredits,
  creditCost = 50,
  resourceType = 'project',
  currentCount = 1,
  maxFreeCount = 1
}: ProjectUnlockModalProps) {
  const { colors } = useTheme();
  const hasEnoughCredits = currentCredits >= creditCost;
  const creditsNeeded = creditCost - currentCredits;
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  // Dynamic text based on resource type
  const resourceName = resourceType === 'project' ? 'Project' : 'Database';
  const resourceNamePlural = resourceType === 'project' ? 'projects' : 'databases';
  const unlimitedPlan = resourceType === 'project' ? 'Patron Monthly' : 'Patron Annual or Monthly';

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      header={`${t.projectunlockmodal49}${resourceName}`}
      style={{ width: '90vw', maxWidth: '600px' }}
      className="resource-unlock-modal"
    >
      <div className="space-y-6">
        {/* Limit Reached Info */}
        <div className="rounded-lg p-4" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningText}` }}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i className="pi pi-lock text-2xl" style={{ color: colors.warningText }}></i>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-semibold mb-2" style={{ color: colors.warningText }}>
                {t.projectunlockmodal62}
              </h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {t.projectunlockmodal65}<strong style={{ color: colors.textPrimary }}>{currentCount} {currentCount === 1 ? resourceName.toLowerCase() : resourceNamePlural}</strong>{t.projectunlockmodal65_2}{maxFreeCount}).
              </p>
            </div>
          </div>
        </div>

        {/* Unlock Details */}
        <div className="rounded-lg p-6" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}>
          <h4 className="font-semibold mb-4 flex items-center" style={{ color: colors.textPrimary }}>
            <i className="pi pi-key mr-2" style={{ color: colors.accent }}></i>
            {t.projectunlockmodal75}{resourceName}{t.projectunlockmodal75_2}
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${colors.borderSecondary}` }}>
              <span style={{ color: colors.textSecondary }}>{t.projectunlockmodal80}</span>
              <span className="text-xl font-bold" style={{ color: colors.accent }}>{creditCost}{t.projectunlockmodal81}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span style={{ color: colors.textSecondary }}>{t.projectunlockmodal85}</span>
              <span className="text-xl font-bold" style={{ color: hasEnoughCredits ? colors.successText : colors.errorText }}>
                {currentCredits}{t.projectunlockmodal87}
              </span>
            </div>
          </div>

          {!hasEnoughCredits && (
            <div className="mt-4 rounded p-3" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorText}` }}>
              <p className="text-sm" style={{ color: colors.errorText }}>
                <i className="pi pi-exclamation-triangle mr-2"></i>
                {t.projectunlockmodal96}<strong>{creditsNeeded}{t.projectunlockmodal96_2}</strong>{t.projectunlockmodal96_3}{resourceName.toLowerCase()}.
              </p>
            </div>
          )}

          {hasEnoughCredits && (
            <div className="mt-4 rounded p-3" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successText}` }}>
              <p className="text-sm" style={{ color: colors.successText }}>
                <i className="pi pi-check-circle mr-2"></i>
                {t.projectunlockmodal105}{resourceName.toLowerCase()}{t.projectunlockmodal105_2}<strong>{t.projectunlockmodal105_3}</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            label={`${t.projectunlockmodal110}${resourceName} (${creditCost}${t.projectunlockmodal110_2})`}
            icon="pi pi-unlock"
            className="p-button-success w-full"
            style={{ borderRadius: '8px', paddingTop: '12px', paddingBottom: '12px', fontSize: '16px' }}
            disabled={!hasEnoughCredits}
            onClick={onConfirm}
          />

          <div className="grid grid-cols-2 gap-3">
            <Button
              label={t.projectunlockmodal120}
              icon="pi pi-times"
              className="p-button-secondary p-button-outlined w-full"
              style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
              onClick={onHide}
            />

            {!hasEnoughCredits && (
              <Button
                label={t.projectunlockmodal129}
                icon="pi pi-shopping-cart"
                className="p-button-info w-full"
                style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                onClick={() => {
                  onHide();
                  onBuyCredits();
                }}
              />
            )}

            {hasEnoughCredits && (
              <Button
                label={t.projectunlockmodal142}
                icon="pi pi-star"
                className="p-button-outlined w-full"
                style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
                onClick={() => {
                  onHide();
                  onBuyCredits(); // Opens plan modal
                }}
              />
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center text-xs" style={{ color: colors.textMuted }}>
          <p>
            💡 <strong>{t.projectunlockmodal162_2}</strong>{t.projectunlockmodal162}{' '}
            {onUpgradePatron ? (
              <button
                type="button"
                onClick={onUpgradePatron}
                className="underline font-semibold"
                style={{ color: colors.warningText }}
              >
                {unlimitedPlan}
              </button>
            ) : (
              <span className="font-semibold" style={{ color: colors.warningText }}>{unlimitedPlan}</span>
            )}
            {' '}{t.projectunlockmodal175}{resourceNamePlural}!
          </p>
        </div>
      </div>
    </Dialog>
  );
}
