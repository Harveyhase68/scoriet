import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { useTheme } from '@/contexts/ThemeContext';

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

  // Dynamic text based on resource type
  const resourceName = resourceType === 'project' ? 'Project' : 'Database';
  const resourceNamePlural = resourceType === 'project' ? 'projects' : 'databases';
  const unlimitedPlan = resourceType === 'project' ? 'Patron Monthly' : 'Patron Annual or Monthly';

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      header={`🔓 Unlock Additional ${resourceName}`}
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
                Free Plan Limit Reached
              </h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                You currently have <strong style={{ color: colors.textPrimary }}>{currentCount} {currentCount === 1 ? resourceName.toLowerCase() : resourceNamePlural}</strong> (maximum for Free plan: {maxFreeCount}).
              </p>
            </div>
          </div>
        </div>

        {/* Unlock Details */}
        <div className="rounded-lg p-6" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}>
          <h4 className="font-semibold mb-4 flex items-center" style={{ color: colors.textPrimary }}>
            <i className="pi pi-key mr-2" style={{ color: colors.accent }}></i>
            Unlock +1 {resourceName} for 1 Year
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${colors.borderSecondary}` }}>
              <span style={{ color: colors.textSecondary }}>Cost:</span>
              <span className="text-xl font-bold" style={{ color: colors.accent }}>{creditCost} Credits</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span style={{ color: colors.textSecondary }}>Your Balance:</span>
              <span className="text-xl font-bold" style={{ color: hasEnoughCredits ? colors.successText : colors.errorText }}>
                {currentCredits} Credits
              </span>
            </div>
          </div>

          {!hasEnoughCredits && (
            <div className="mt-4 rounded p-3" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorText}` }}>
              <p className="text-sm" style={{ color: colors.errorText }}>
                <i className="pi pi-exclamation-triangle mr-2"></i>
                You need <strong>{creditsNeeded} more credits</strong> to unlock this {resourceName.toLowerCase()}.
              </p>
            </div>
          )}

          {hasEnoughCredits && (
            <div className="mt-4 rounded p-3" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successText}` }}>
              <p className="text-sm" style={{ color: colors.successText }}>
                <i className="pi pi-check-circle mr-2"></i>
                You have enough credits! After unlocking, this {resourceName.toLowerCase()} will be available for <strong>1 year</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            label={`Unlock ${resourceName} (${creditCost} Credits)`}
            icon="pi pi-unlock"
            className="p-button-success w-full"
            style={{ borderRadius: '8px', paddingTop: '12px', paddingBottom: '12px', fontSize: '16px' }}
            disabled={!hasEnoughCredits}
            onClick={onConfirm}
          />

          <div className="grid grid-cols-2 gap-3">
            <Button
              label="Cancel"
              icon="pi pi-times"
              className="p-button-secondary p-button-outlined w-full"
              style={{ borderRadius: '8px', paddingTop: '10px', paddingBottom: '10px' }}
              onClick={onHide}
            />

            {!hasEnoughCredits && (
              <Button
                label="Buy Credits"
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
                label="View Plans"
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
            💡 <strong>Tip:</strong> Upgrade to{' '}
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
            {' '}for unlimited {resourceNamePlural}!
          </p>
        </div>
      </div>
    </Dialog>
  );
}
