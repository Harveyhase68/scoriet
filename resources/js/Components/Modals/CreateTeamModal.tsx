import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import PlanModal from '@/Components/AuthModals/PlanModal';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: () => void;
}

interface TeamSubscriptionInfo {
  active_subscriptions: number;
  owned_teams: number;
  max_allowed: number;
  needs_unlock: boolean;
  free_teams_allowed: number;
}

export default function CreateTeamModal({ isOpen, onClose, onTeamCreated }: CreateTeamModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  const { projects } = useProject();
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    project_ids: number[];
  }>({
    name: '',
    description: '',
    project_ids: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // Subscription/unlock state
  const [subscriptionInfo, setSubscriptionInfo] = useState<TeamSubscriptionInfo | null>(null);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [unlockConfirmed, setUnlockConfirmed] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ credits: number; user_type?: string } | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planModalInitialTab, setPlanModalInitialTab] = useState(0);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  // Check subscription status when modal opens
  const checkSubscription = useCallback(async () => {
    setCheckingSubscription(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setCheckingSubscription(false);
        return;
      }

      // Load user data
      const userResponse = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData);

        const isFreeUser = userData.user_type === 'free' || !userData.user_type;

        // If not a free user, they can create unlimited teams
        if (!isFreeUser) {
          setNeedsUnlock(false);
          setCheckingSubscription(false);
          return;
        }
      }

      // Load team subscription info
      const response = await fetch('/api/teams?all=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.subscription_info) {
          setSubscriptionInfo(data.subscription_info);
          setNeedsUnlock(data.subscription_info.needs_unlock);
        }
      }
    } catch (err) {
      console.error('Error checking team subscription:', err);
    } finally {
      setCheckingSubscription(false);
    }
  }, []);

  // Refresh user credits
  const refreshCredits = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch (err) {
      console.error('Error refreshing credits:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkSubscription();
      setUnlockConfirmed(false);
    }
  }, [isOpen, checkSubscription]);

  // Handle unlock confirmation
  const handleUnlockConfirm = () => {
    setUnlockConfirmed(true);
    setNeedsUnlock(false);
  };

  // Handle buy credits
  const handleBuyCredits = () => {
    setPlanModalInitialTab(1);
    setShowPlanModal(true);
  };

  // Handle plan modal close
  const handlePlanModalClose = () => {
    setShowPlanModal(false);
    // Refresh credits and subscription info
    refreshCredits();
    checkSubscription();
  };

  const handleNameChange = (value: string) => {
    // Convert to lowercase and remove invalid characters
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');

    // Check if any characters were removed (invalid input)
    if (value !== sanitized) {
      setNameError('Only lowercase letters, numbers, and underscores are allowed');
    } else {
      setNameError(null);
    }

    setFormData({ ...formData, name: sanitized });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ name: '', description: '', project_ids: [] });
        // Dispatch event to notify other components about credit change (if credits were spent)
        if (unlockConfirmed) {
          window.dispatchEvent(new CustomEvent('creditsChanged'));
        }
        setUnlockConfirmed(false);
        onTeamCreated();
        onClose();
      } else {
        const errorData = await response.json();

        // Handle insufficient credits error
        if (errorData.error_code === 'INSUFFICIENT_CREDITS') {
          setError(`Nicht genug Credits! Sie benötigen ${errorData.required_credits} Credits, haben aber nur ${errorData.current_credits}.`);
          // Re-show unlock screen
          setNeedsUnlock(true);
          setUnlockConfirmed(false);
          return;
        }

        setError(errorData.message || t.createteammodal49);
      }
    } catch {
      setError(t.createteammodal52);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Calculate credit info for unlock screen
  const hasEnoughCredits = (currentUser?.credits || 0) >= 50;
  const creditsNeeded = 50 - (currentUser?.credits || 0);
  const ownedTeams = subscriptionInfo?.owned_teams || 0;
  const activeSubscriptions = subscriptionInfo?.active_subscriptions || 0;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        className="portal-modal-content rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="portal-modal-header flex justify-between items-center">
          <h2 className="flex items-center">
            <i className="pi pi-users mr-2"></i>
            {needsUnlock ? 'Unlock Team Feature' : 'Create New Team'}
          </h2>
          <button
            onClick={onClose}
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        {/* Loading State */}
        {checkingSubscription && (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Checking subscription...</p>
          </div>
        )}

        {/* Unlock Screen */}
        {!checkingSubscription && needsUnlock && (
          <div className="space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <p className="text-yellow-300 text-sm mb-2">
                <strong>Team Feature - Free Tier</strong>
              </p>
              <p className="text-gray-300 text-sm">
                Teams is an additional feature for free users. Each team costs <strong>50 credits per year</strong>.
              </p>
              {ownedTeams > 0 && (
                <p className="text-gray-300 text-sm mt-2">
                  You currently have <strong>{ownedTeams} team{ownedTeams > 1 ? 's' : ''}</strong>
                  {activeSubscriptions > 0 && ` (${activeSubscriptions} subscription${activeSubscriptions > 1 ? 's' : ''})`}.
                </p>
              )}
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Your Credits:</span>
                <span className="text-white font-bold text-lg">{currentUser?.credits || 0}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Required Credits:</span>
                <span className="text-yellow-400 font-bold text-lg">50</span>
              </div>
              <hr className="border-gray-700 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-gray-300">After Unlock:</span>
                <span className={`font-bold text-lg ${hasEnoughCredits ? 'text-green-400' : 'text-red-400'}`}>
                  {hasEnoughCredits ? (currentUser?.credits || 0) - 50 : `Need ${creditsNeeded} more`}
                </span>
              </div>
            </div>

            {!hasEnoughCredits && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <p className="text-red-300 text-sm">
                  You don't have enough credits. You need <strong>{creditsNeeded} more credits</strong> to unlock the team feature.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {hasEnoughCredits ? (
                <button
                  type="button"
                  onClick={handleUnlockConfirm}
                  className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white transition-colors flex items-center justify-center gap-2"
                >
                  <i className="pi pi-unlock"></i>
                  Unlock Team (50 Credits)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBuyCredits}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-white transition-colors flex items-center justify-center gap-2"
                >
                  <i className="pi pi-shopping-cart"></i>
                  Buy Credits
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 text-center">
              Or upgrade to{' '}
              <button
                type="button"
                onClick={() => { setPlanModalInitialTab(0); setShowPlanModal(true); }}
                className="text-yellow-400 hover:text-yellow-300 underline font-semibold"
              >
                Patron Monthly
              </button>
              {' '}for unlimited teams!
            </p>
          </div>
        )}

        {/* Team Creation Form */}
        {!checkingSubscription && !needsUnlock && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                nameError ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="gen_team_96"
              maxLength={255}
            />
            <small className="text-gray-400 text-xs mt-1 block">
              Only lowercase letters (a-z), numbers (0-9), and underscores (_) allowed
            </small>
            {nameError && (
              <small className="text-red-400 text-xs mt-1 block">{nameError}</small>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t.createteammodal110}
              rows={3}
              maxLength={1000}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Projects
            </label>
            <select
              multiple
              value={formData.project_ids.map(String)}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value));
                setFormData({ ...formData, project_ids: selectedOptions });
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              size={Math.min(4, projects.length || 1)}
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select one or more projects for this team. Hold Ctrl/Cmd to select multiple.
            </p>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim() || formData.project_ids.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded text-white transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <i className="pi pi-check"></i>
                  <span>Create Team{unlockConfirmed ? ' (50 Credits)' : ''}</span>
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );

  // Render modal content in a portal to the document body
  return (
    <>
      {createPortal(modalContent, document.body)}
      <PlanModal
        visible={showPlanModal}
        onHide={handlePlanModalClose}
        initialTab={planModalInitialTab}
      />
    </>
  );
}