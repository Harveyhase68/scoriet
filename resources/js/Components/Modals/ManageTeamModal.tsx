import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { TabPanel } from 'primereact/tabview';
import TabViewSideMenu from '@/Components/TabViewSideMenu';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { apiClient } from '@/lib/api';

// Tab order in the side menu — keep these constants in sync with the
// <TabPanel> children below. Numeric indices because TabView/TabViewSideMenu
// speaks indices, not labels.
const TAB_OVERVIEW = 0;
const TAB_MEMBERS = 1;
const TAB_INVITATIONS = 2;

interface Team {
  id: number;
  name: string;
  description: string;
  project_name: string;
  is_active: boolean;
  owner: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
  members: TeamMember[];
  pending_invitations?: TeamInvitation[];
}

interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    username?: string;
  };
}

interface TeamInvitation {
  id: number;
  team_id: number;
  invited_user_id: string;
  invited_email?: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  expires_at: string;
  token: string;
  inviter: {
    name: string;
    email: string;
    username?: string;
  };
}

interface ManageTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  onTeamUpdated: () => void;
  currentUserId: number;
}

export default function ManageTeamModal({ isOpen, onClose, team, onTeamUpdated, currentUserId }: ManageTeamModalProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  // TabViewSideMenu speaks numeric indices — see TAB_* constants above.
  const [activeTabIndex, setActiveTabIndex] = useState<number>(TAB_OVERVIEW);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({
    invited_user_id: '',
    invited_email: '',
    role: 'member' as 'admin' | 'member',
    message: ''
  });
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [teamInvitations, setTeamInvitations] = useState<TeamInvitation[]>([]);

  const isOwner = team?.owner?.id === currentUserId;
  const currentUserMember = team?.members?.find(m => m.user_id === currentUserId);
  const isAdmin = currentUserMember?.role === 'admin' || isOwner;

  const fetchTeamInvitations = useCallback(async () => {
    if (!team || !isAdmin) return;

    try {
      const data = await apiClient.get(`/teams/${team.id}/invitations`);
      setTeamInvitations(data.invitations || []);
    } catch {
      // Error fetching invitations
    }
  }, [team, isAdmin]);

  useEffect(() => {
    if (isOpen && team) {
      fetchTeamInvitations();
    }
  }, [isOpen, team, fetchTeamInvitations]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !inviteForm.invited_user_id.trim()) return;

    setLoading(true);
    setError(null);

    try {
      try {
        await apiClient.post(`/teams/${team.id}/invitations`, inviteForm);
        setInviteForm({ invited_user_id: '', invited_email: '', role: 'member', message: '' });
        setShowInviteForm(false);
        await fetchTeamInvitations();
        onTeamUpdated();
      } catch (err: any) {
        setError(err?.response?.data?.message || t.manageteammodal129);
      }
    } catch {
      setError(t.createteammodal52);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!team || !confirm(t.manageteammodal139)) return;

    try {
      await apiClient.delete(`/teams/${team.id}/members/${userId}`);
      onTeamUpdated();
    } catch (err: any) {
      alert(err?.response?.data?.message || t.manageteammodal155);
    }
  };

  const handleChangeRole = async (userId: number, newRole: 'admin' | 'member') => {
    if (!team) return;

    try {
      await apiClient.put(`/teams/${team.id}/members/${userId}/role`, { role: newRole });
      onTeamUpdated();
    } catch (err: any) {
      alert(err?.response?.data?.message || t.manageteammodal181);
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    if (!team || !confirm(t.manageteammodal189)) return;

    try {
      await apiClient.delete(`/teams/${team.id}/invitations/${invitationId}`);
      await fetchTeamInvitations();
      onTeamUpdated();
    } catch (err: any) {
      alert(err?.response?.data?.message || t.manageteammodal206);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isOpen) return null;

  const modalContent = !team ? (
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
        className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          <span className="text-white">{t.manageteammodal249}</span>
        </div>
      </div>
    </div>
  ) : (
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
        /* h-[85vh] instead of max-h-[90vh] so the inner flex-column has a
         * concrete height to distribute. flex flex-col turns the header /
         * tab region / footer into proper flex children so the TabViewSideMenu
         * in the middle can grow into the remaining vertical space. */
        className="portal-modal-content rounded-lg w-full max-w-4xl mx-4 h-[85vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header — flex-shrink-0 keeps its natural height in the flex-column
         * portal modal layout. */}
        <div className="portal-modal-header flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="flex items-center">
              <i className="pi pi-cog mr-2"></i>
              {t.manageteammodal272}{team.name}
            </h2>
            <p className="text-gray-300 text-sm mt-1">
              {team.members?.length || 0} members • Project: {team.project_name}
            </p>
          </div>
          <button
            onClick={onClose}
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        {/* Custom horizontal button tab-bar replaced by <TabViewSideMenu>
         * (vertical side-menu) for consistency with every other modal in the
         * app. activeTabIndex (number) replaces the previous string union.
         * The TabViewSideMenu sits in a flex-1 / min-h-0 region so it
         * absorbs whatever vertical space the header above and the footer
         * below don't claim. */}
        <div className="flex-1 min-h-0">
          <TabViewSideMenu
            storageKey="manageTeamModal"
            defaultWidth={200}
            activeIndex={activeTabIndex}
            onTabChange={(e) => setActiveTabIndex(e.index)}
          >
            <TabPanel header={<span><i className="pi pi-info-circle mr-2" />{t.manageteammodal283}</span>}>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">{t.manageteammodal313}</h3>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">{t.manageteammodal317}</label>
                      <p className="text-white">{team.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">{t.manageteammodal321}</label>
                      <p className="text-white">{team.project_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">{t.manageteammodal325}</label>
                      <p className="text-white">{team.owner?.username || team.owner?.name || t.testprojectschemas50}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">{t.manageteammodal329}</label>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        team.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {team.is_active ? t.templatesStatusActive : t.manageteammodal328}
                      </span>
                    </div>
                  </div>
                  {team.description && (
                    <div className="mt-4">
                      <label className="block text-sm text-gray-400 mb-1">{t.manageteammodal339}</label>
                      <p className="text-white">{team.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </TabPanel>

            {/* Members Tab */}
            <TabPanel header={<span><i className="pi pi-users mr-2" />{`${t.manageteammodal289}(${team.members?.length || 0})`}</span>}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">{t.manageteammodal352}</h3>
                {isAdmin && (
                  <button
                    onClick={() => setShowInviteForm(!showInviteForm)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm flex items-center space-x-2 transition-colors"
                  >
                    <i className="pi pi-plus"></i>
                    <span>{t.manageteammodal359}</span>
                  </button>
                )}
              </div>

              {/* Invite Form */}
              {showInviteForm && isAdmin && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-4">{t.manageteammodal367}</h4>
                  <form onSubmit={handleInviteUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">{t.manageteammodal371}</label>
                        <input
                          type="text"
                          required
                          value={inviteForm.invited_user_id}
                          onChange={(e) => setInviteForm({ ...inviteForm, invited_user_id: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={t.manageteammodal378}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">{t.manageteammodal382}</label>
                        <input
                          type="email"
                          value={inviteForm.invited_email}
                          onChange={(e) => setInviteForm({ ...inviteForm, invited_email: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={t.manageteammodal383}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">{t.manageteammodal393}</label>
                      <select
                        value={inviteForm.role}
                        onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'admin' | 'member' })}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="member">{t.manageteammodal399}</option>
                        <option value="admin">{t.manageteammodal400}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">{t.manageteammodal404}</label>
                      <textarea
                        value={inviteForm.message}
                        onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t.manageteammodal404}
                        rows={2}
                      />
                    </div>
                    {error && (
                      <div className="bg-red-900 border border-red-700 rounded p-3">
                        <p className="text-red-300 text-sm">{error}</p>
                      </div>
                    )}
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowInviteForm(false);
                          setError(null);
                        }}
                        className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                      >
                        {t.manageteammodal427}
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !inviteForm.invited_user_id.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded text-white transition-colors flex items-center space-x-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>{t.manageteammodal437}</span>
                          </>
                        ) : (
                          <>
                            <i className="pi pi-send"></i>
                            <span>{t.manageteammodal442}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-3">
                {team.members?.map(member => (
                  <div key={member.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-600 rounded-full w-10 h-10 flex items-center justify-center">
                        <i className="pi pi-user text-gray-300"></i>
                      </div>
                      <div>
                        <p className="text-white font-medium">{member.user.username || member.user.name}</p>
                        <p className="text-gray-400 text-sm">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                      {isAdmin && member.role !== 'owner' && Number(member.user_id) !== Number(currentUserId) && (
                        <div className="flex items-center space-x-2">
                          {member.role === 'member' ? (
                            <button
                              onClick={() => handleChangeRole(member.user_id, 'admin')}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                              title={t.manageteammodal469}
                            >
                              <i className="pi pi-arrow-up"></i>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleChangeRole(member.user_id, 'member')}
                              className="text-yellow-400 hover:text-yellow-300 text-sm"
                              title={t.manageteammodal477}
                            >
                              <i className="pi pi-arrow-down"></i>
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                            title={t.manageteammodal485}
                          >
                            <i className="pi pi-trash"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </TabPanel>

            {/* Invitations Tab */}
            <TabPanel header={<span><i className="pi pi-envelope mr-2" />{`${t.manageteammodal290}(${teamInvitations.filter(i => i.status === 'pending').length})`}</span>}>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">{t.manageteammodal506}</h3>
              {teamInvitations.filter(inv => inv.status === 'pending').length === 0 ? (
                <div className="text-center py-8">
                  <i className="pi pi-envelope text-4xl text-gray-600 mb-4"></i>
                  <p className="text-gray-400">{t.manageteammodal510}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamInvitations.filter(inv => inv.status === 'pending').map(invitation => (
                    <div key={invitation.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-white font-medium">{invitation.invited_user_id}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getRoleColor(invitation.role)}`}>
                              {invitation.role}
                            </span>
                          </div>
                          {invitation.invited_email && (
                            <p className="text-gray-400 text-sm">{invitation.invited_email}</p>
                          )}
                          <p className="text-gray-400 text-sm">
                            {t.manageteammodal528}{invitation.inviter.username || invitation.inviter.name} • 
                            t.manageteammodal529{new Date(invitation.expires_at).toLocaleDateString()}
                          </p>
                          {invitation.message && (
                            <p className="text-gray-300 text-sm italic mt-2">"{invitation.message}"</p>
                          )}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="text-red-400 hover:text-red-300 p-2"
                            title={t.manageteammodal534}
                          >
                            <i className="pi pi-times"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </TabPanel>
          </TabViewSideMenu>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Render modal content in a portal to the document body
  return createPortal(modalContent, document.body);
}