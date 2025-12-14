import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
// import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { MultiSelect } from 'primereact/multiselect';
import { Message } from 'primereact/message';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import PlanModal from '@/Components/AuthModals/PlanModal';

interface TeamSubscriptionInfo {
  active_subscriptions: number;
  owned_teams: number;
  max_allowed: number;
  needs_unlock: boolean;
  free_teams_allowed: number;
}

interface TeamMember {
  id: number;
  user_id: number;
  role: string;
  joined_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
}

interface Team {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  project_owner_id: number;
  project_id?: number;
  project?: {
    id: number;
    name: string;
  };
  projects?: Array<{
    id: number;
    name: string;
  }>;
  owner: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
  members: TeamMember[];
  members_count?: number;
}

interface TeamModalProps {
  visible: boolean;
  onHide: () => void;
  team?: Team | null;
  onSave: () => void;
}

export default function TeamModal({ visible, onHide, team, onSave }: TeamModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  const { projects } = useProject();
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    project_ids: number[];
    is_active: boolean;
  }>({
    name: '',
    description: '',
    project_ids: [],
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  // Subscription/unlock state (only for creating new teams)
  const [subscriptionInfo, setSubscriptionInfo] = useState<TeamSubscriptionInfo | null>(null);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [_unlockConfirmed, setUnlockConfirmed] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ credits: number; user_type?: string } | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planModalInitialTab, setPlanModalInitialTab] = useState(0);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  // Check subscription status when modal opens for new team
  const checkSubscription = useCallback(async () => {
    // Only check for new teams, not edits
    if (team) {
      setNeedsUnlock(false);
      setCheckingSubscription(false);
      return;
    }

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
  }, [team]);

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

  // Handle unlock confirmation
  const handleUnlockConfirm = () => {
    setUnlockConfirmed(true);
    setNeedsUnlock(false);
  };

  // Handle buy credits
  const handleBuyCredits = () => {
    setPlanModalInitialTab(1); // Tab 1 = Buy Credits
    setShowPlanModal(true);
  };

  // Handle plan modal close
  const handlePlanModalClose = () => {
    setShowPlanModal(false);
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

    setFormData(prev => ({ ...prev, name: sanitized }));
  };

  useEffect(() => {
    if (visible && team) {
      // Editing existing team - no unlock needed
      setFormData({
        name: team.name,
        description: team.description || '',
        project_ids: team.projects?.map((p: any) => p.id) || [],
        is_active: team.is_active
      });
      setNeedsUnlock(false);
      setUnlockConfirmed(false);
    } else if (visible && !team) {
      // Creating new team - check if unlock is needed
      setFormData({
        name: '',
        description: '',
        project_ids: [],
        is_active: true
      });
      setUnlockConfirmed(false);
      checkSubscription();
    }
    setError('');
  }, [visible, team, checkSubscription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError(t.teammodal98);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      const url = team ? `/api/teams/${team.id}` : '/api/teams';
      const method = team ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle insufficient credits error
        if (errorData.error_code === 'INSUFFICIENT_CREDITS') {
          setError(`Nicht genug Credits! Sie benötigen ${errorData.required_credits} Credits, haben aber nur ${errorData.current_credits}.`);
          // Re-show unlock screen
          setNeedsUnlock(true);
          setUnlockConfirmed(false);
          return;
        }

        // Handle Laravel validation errors
        if (errorData.errors && errorData.errors.name) {
          throw new Error(errorData.errors.name[0]);
        }

        throw new Error(errorData.message || t.teammodal132);
      }

      // Dispatch event to notify other components about credit change (if credits were spent)
      if (!team && needsUnlock) {
        window.dispatchEvent(new CustomEvent('creditsChanged'));
      }

      onSave();
    } catch (error) {
      setError(error instanceof Error ? error.message : t.teammodal132);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  // Calculate credit info for unlock screen
  const hasEnoughCredits = (currentUser?.credits || 0) >= 50;
  const creditsNeeded = 50 - (currentUser?.credits || 0);
  const ownedTeams = subscriptionInfo?.owned_teams || 0;
  const activeSubscriptions = subscriptionInfo?.active_subscriptions || 0;

  return (
    <>
    <Dialog
      header={team ? t.teammanagementpanel394 : (needsUnlock ? 'Unlock Team Feature' : t.teammodal155)}
      visible={visible}
      onHide={onHide}
      style={{ width: '500px' }}
      modal
      className="p-fluid"
    >
      {/* Loading State */}
      {checkingSubscription && !team && (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Checking subscription...</p>
        </div>
      )}

      {/* Unlock Screen - only for new teams */}
      {!checkingSubscription && needsUnlock && !team && (
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
              <Button
                type="button"
                onClick={handleUnlockConfirm}
                className="flex-1 p-button-success"
                icon="pi pi-unlock"
                label="Unlock Team (50 Credits)"
              />
            ) : (
              <Button
                type="button"
                onClick={handleBuyCredits}
                className="flex-1 p-button-warning"
                icon="pi pi-shopping-cart"
                label="Buy Credits"
              />
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

      {/* Team Form - show when not checking and (editing OR unlocked) */}
      {(!checkingSubscription && !needsUnlock) || team ? (
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          {error && (
            <Message severity="error" text={error} />
          )}

          <div className="field">
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-100">
              Team Name *
            </label>
            <InputText
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="gen_team_96"
              required
              className={nameError ? 'p-invalid' : ''}
            />
            <small className="text-gray-400 text-xs mt-1 block">
              Only lowercase letters (a-z), numbers (0-9), and underscores (_) allowed
            </small>
            {nameError && (
              <small className="text-red-400 text-xs mt-1 block">{nameError}</small>
            )}
          </div>

          <div className="field">
            <label htmlFor="description" className="block text-sm font-medium mb-2 text-gray-100">
              Description
            </label>
            <InputTextarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t.teammodal189}
              rows={3}
            />
          </div>

          <div className="field">
            <label htmlFor="project_ids" className="block text-sm font-medium mb-2 text-gray-100">
              Projects
            </label>
            <MultiSelect
              id="project_ids"
              value={formData.project_ids}
              options={projects.map(project => ({
                label: project.name,
                value: project.id
              }))}
              onChange={(e) => setFormData(prev => ({ ...prev, project_ids: e.value }))}
              placeholder={t.teammodal206}
              display="chip"
              className="w-full"
            />
            <small className="text-gray-600">
              Select one or more projects for this team
            </small>
          </div>

          <div className="field">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.checked || false }))}
              />
              <label htmlFor="is_active" className="text-sm text-gray-100">
                Team is active
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-600 mt-6">
          <Button
            type="button"
            label={t.applicationsmodal432}
            icon="pi pi-times"
            className="p-button-text"
            onClick={onHide}
            disabled={loading}
          />
          <Button
            type="submit"
            label={team ? 'Update' : t.teammodal240}
            icon={team ? 'pi pi-check' : 'pi pi-plus'}
            loading={loading}
          />
        </div>
      </form>
      ) : null}

    </Dialog>
    <PlanModal
      visible={showPlanModal}
      onHide={handlePlanModalClose}
      initialTab={planModalInitialTab}
    />
    </>
  );
}