import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'invitations'>('overview');
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/teams/${team.id}/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTeamInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
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
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/teams/${team.id}/invitations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteForm),
      });

      if (response.ok) {
        setInviteForm({ invited_user_id: '', invited_email: '', role: 'member', message: '' });
        setShowInviteForm(false);
        await fetchTeamInvitations();
        onTeamUpdated();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to send invitation');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!team || !confirm('Remove this member from the team?')) return;

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/teams/${team.id}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        onTeamUpdated();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to remove member');
      }
    } catch {
      alert('Failed to remove member');
    }
  };

  const handleChangeRole = async (userId: number, newRole: 'admin' | 'member') => {
    if (!team) return;

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/teams/${team.id}/members/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        onTeamUpdated();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to change role');
      }
    } catch {
      alert('Failed to change role');
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    if (!team || !confirm('Cancel this invitation?')) return;

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/teams/${team.id}/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        await fetchTeamInvitations();
        onTeamUpdated();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to cancel invitation');
      }
    } catch {
      alert('Failed to cancel invitation');
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
          <span className="text-white">Loading team...</span>
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
        className="bg-gray-800 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center">
              <i className="pi pi-cog mr-2 text-blue-400"></i>
              Manage Team: {team.name}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {team.members?.length || 0} members • Project: {team.project_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2"
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          {[
            { key: 'overview', label: 'Overview', icon: 'pi-info-circle' },
            { key: 'members', label: `Members (${team.members?.length || 0})`, icon: 'pi-users' },
            { key: 'invitations', label: `Invitations (${teamInvitations.filter(i => i.status === 'pending').length})`, icon: 'pi-envelope' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 text-sm font-medium flex items-center space-x-2 transition-colors ${
                activeTab === tab.key
                  ? 'bg-gray-700 text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <i className={`pi ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Team Information</h3>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Team Name</label>
                      <p className="text-white">{team.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Project</label>
                      <p className="text-white">{team.project_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Owner</label>
                      <p className="text-white">{team.owner?.username || team.owner?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Status</label>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        team.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {team.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  {team.description && (
                    <div className="mt-4">
                      <label className="block text-sm text-gray-400 mb-1">Description</label>
                      <p className="text-white">{team.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Team Members</h3>
                {isAdmin && (
                  <button
                    onClick={() => setShowInviteForm(!showInviteForm)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm flex items-center space-x-2 transition-colors"
                  >
                    <i className="pi pi-plus"></i>
                    <span>Invite Member</span>
                  </button>
                )}
              </div>

              {/* Invite Form */}
              {showInviteForm && isAdmin && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-4">Invite New Member</h4>
                  <form onSubmit={handleInviteUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Username (required) *</label>
                        <input
                          type="text"
                          required
                          value={inviteForm.invited_user_id}
                          onChange={(e) => setInviteForm({ ...inviteForm, invited_user_id: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Harveyhase68"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Email (optional)</label>
                        <input
                          type="email"
                          value={inviteForm.invited_email}
                          onChange={(e) => setInviteForm({ ...inviteForm, invited_email: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Optional notification email"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Role</label>
                      <select
                        value={inviteForm.role}
                        onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'admin' | 'member' })}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Message (optional)</label>
                      <textarea
                        value={inviteForm.message}
                        onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Welcome message for the invitation"
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
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !inviteForm.invited_user_id.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded text-white transition-colors flex items-center space-x-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <i className="pi pi-send"></i>
                            <span>Send Invitation</span>
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
                      {isAdmin && member.role !== 'owner' && member.user_id !== currentUserId && (
                        <div className="flex items-center space-x-2">
                          {member.role === 'member' ? (
                            <button
                              onClick={() => handleChangeRole(member.user_id, 'admin')}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                              title="Promote to Admin"
                            >
                              <i className="pi pi-arrow-up"></i>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleChangeRole(member.user_id, 'member')}
                              className="text-yellow-400 hover:text-yellow-300 text-sm"
                              title="Demote to Member"
                            >
                              <i className="pi pi-arrow-down"></i>
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                            title="Remove Member"
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
          )}

          {/* Invitations Tab */}
          {activeTab === 'invitations' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Pending Invitations</h3>
              {teamInvitations.filter(inv => inv.status === 'pending').length === 0 ? (
                <div className="text-center py-8">
                  <i className="pi pi-envelope text-4xl text-gray-600 mb-4"></i>
                  <p className="text-gray-400">No pending invitations</p>
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
                            Invited by {invitation.inviter.username || invitation.inviter.name} • 
                            Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                          </p>
                          {invitation.message && (
                            <p className="text-gray-300 text-sm italic mt-2">"{invitation.message}"</p>
                          )}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="text-red-400 hover:text-red-300 p-2"
                            title="Cancel Invitation"
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
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-700">
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