import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
//import { Badge } from 'primereact/badge';

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
      contentStyle={{ padding: '24px', backgroundColor: '#111827', color: 'white' }}
      headerStyle={{ backgroundColor: '#1f2937', color: 'white', border: 'none' }}
      className="resource-unlock-modal"
    >
      <div className="space-y-6">
        {/* Limit Reached Info */}
        <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i className="pi pi-lock text-yellow-400 text-2xl"></i>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                Free Plan Limit Reached
              </h3>
              <p className="text-gray-300 text-sm">
                You currently have <strong className="text-white">{currentCount} {currentCount === 1 ? resourceName.toLowerCase() : resourceNamePlural}</strong> (maximum for Free plan: {maxFreeCount}).
              </p>
            </div>
          </div>
        </div>

        {/* Unlock Details */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
          <h4 className="text-white font-semibold mb-4 flex items-center">
            <i className="pi pi-key text-blue-400 mr-2"></i>
            Unlock +1 {resourceName} for 1 Year
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-300">Cost:</span>
              <span className="text-xl font-bold text-blue-400">{creditCost} Credits</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-gray-300">Your Balance:</span>
              <span className={`text-xl font-bold ${hasEnoughCredits ? 'text-green-400' : 'text-red-400'}`}>
                {currentCredits} Credits
              </span>
            </div>
          </div>

          {!hasEnoughCredits && (
            <div className="mt-4 bg-red-900 bg-opacity-30 border border-red-600 rounded p-3">
              <p className="text-sm text-red-300">
                <i className="pi pi-exclamation-triangle mr-2"></i>
                You need <strong>{creditsNeeded} more credits</strong> to unlock this {resourceName.toLowerCase()}.
              </p>
            </div>
          )}

          {hasEnoughCredits && (
            <div className="mt-4 bg-green-900 bg-opacity-30 border border-green-600 rounded p-3">
              <p className="text-sm text-green-300">
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
        <div className="text-center text-gray-400 text-xs">
          <p>
            💡 <strong>Tip:</strong> Upgrade to{' '}
            {onUpgradePatron ? (
              <button
                type="button"
                onClick={onUpgradePatron}
                className="text-yellow-400 hover:text-yellow-300 underline font-semibold"
              >
                {unlimitedPlan}
              </button>
            ) : (
              <span className="text-yellow-400 font-semibold">{unlimitedPlan}</span>
            )}
            {' '}for unlimited {resourceNamePlural}!
          </p>
        </div>
      </div>
    </Dialog>
  );
}
