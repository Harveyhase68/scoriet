import React, { useState, useEffect } from 'react';
import CreateTeamModal from '@/Components/Modals/CreateTeamModal';
import ManageTeamModal from '@/Components/Modals/ManageTeamModal';

interface TabPanelProps {
  isActive: boolean;
}

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
  pending_invitations?: {
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
  }[];
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
  token?: string;
  inviter: {
    name: string;
    email: string;
    username?: string;
  };
}

interface TeamsData {
  owned_teams: Team[];
  member_teams: Team[];
}

interface ReceivedInvitationsData {
  invitations: (TeamInvitation & { team: Team })[];
}

export default function TeamsPanel({ isActive }: TabPanelProps) {
  const [teamsData, setTeamsData] = useState<TeamsData | null>(null);
  const [receivedInvitations, setReceivedInvitations] = useState<ReceivedInvitationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'owned' | 'member' | 'invitations'>('owned');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Fetch teams
      const teamsResponse = await fetch('/api/teams?project=default', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!teamsResponse.ok) {
        const errorText = await teamsResponse.text();
        console.error('Teams API Error:', teamsResponse.status, errorText);
        throw new Error(`Failed to fetch teams: ${teamsResponse.status} ${teamsResponse.statusText}`);
      }

      const teamsData = await teamsResponse.json();
      setTeamsData(teamsData);

      // Fetch received invitations
      const invitationsResponse = await fetch('/api/invitations/received', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!invitationsResponse.ok) {
        const errorText = await invitationsResponse.text();
        console.error('Invitations API Error:', invitationsResponse.status, errorText);
        throw new Error(`Failed to fetch invitations: ${invitationsResponse.status} ${invitationsResponse.statusText}`);
      }

      const invitationsData = await invitationsResponse.json();
      setReceivedInvitations(invitationsData);

      // Fetch current user info
      const userResponse = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      fetchData();
    }
  }, [isActive]);

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

  const handleAcceptInvitation = async (token: string) => {
    try {
      const authToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        await fetchData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      alert('Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (token: string) => {
    try {
      const authToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      
      const response = await fetch(`/api/invitations/${token}/decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        await fetchData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      console.error('Error declining invitation:', err);
      alert('Failed to decline invitation');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900 text-white">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          <span>Loading teams...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <i className="pi pi-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <p className="text-xl mb-2">Error Loading Teams</p>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <i className="pi pi-users mr-2 text-blue-400"></i>
            Teams Management
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center space-x-2 transition-colors"
          >
            <i className="pi pi-plus"></i>
            <span>Create Team</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-4">
          {[
            { key: 'owned', label: 'Owned Teams', count: teamsData?.owned_teams.length || 0 },
            { key: 'member', label: 'Member Of', count: teamsData?.member_teams.length || 0 },
            { key: 'invitations', label: 'Invitations', count: receivedInvitations?.invitations.length || 0 }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-t text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-gray-700 text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Owned Teams Tab */}
        {activeTab === 'owned' && (
          <div className="space-y-4">
            {teamsData?.owned_teams.length === 0 ? (
              <div className="text-center py-12">
                <i className="pi pi-users text-4xl text-gray-600 mb-4"></i>
                <h3 className="text-xl text-gray-400 mb-2">No Teams Yet</h3>
                <p className="text-gray-500 mb-4">Create your first team to start collaborating</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded transition-colors"
                >
                  Create Your First Team
                </button>
              </div>
            ) : (
              teamsData?.owned_teams.map(team => (
                <div key={team.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{team.name}</h3>
                      {team.description && (
                        <p className="text-gray-400 text-sm">{team.description}</p>
                      )}
                    </div>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium border border-purple-200">
                      Owner
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <i className="pi pi-users mr-1"></i>
                        {team.members.length} members
                      </span>
                      {team.pending_invitations && team.pending_invitations.length > 0 && (
                        <span className="flex items-center">
                          <i className="pi pi-clock mr-1"></i>
                          {team.pending_invitations.length} pending
                        </span>
                      )}
                      <span className="flex items-center">
                        <i className="pi pi-folder mr-1"></i>
                        {team.project_name}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowManageModal(true);
                      }}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      Manage →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Member Teams Tab */}
        {activeTab === 'member' && (
          <div className="space-y-4">
            {teamsData?.member_teams.length === 0 ? (
              <div className="text-center py-12">
                <i className="pi pi-user-plus text-4xl text-gray-600 mb-4"></i>
                <h3 className="text-xl text-gray-400 mb-2">Not a Member of Any Teams</h3>
                <p className="text-gray-500">You'll see teams you're invited to join here</p>
              </div>
            ) : (
              teamsData?.member_teams.map(team => (
                <div key={team.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{team.name}</h3>
                      {team.description && (
                        <p className="text-gray-400 text-sm">{team.description}</p>
                      )}
                    </div>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium border border-green-200">
                      Member
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <i className="pi pi-user mr-1"></i>
                        Owner: {team.owner.username || team.owner.name}
                      </span>
                      <span className="flex items-center">
                        <i className="pi pi-users mr-1"></i>
                        {team.members.length} members
                      </span>
                      <span className="flex items-center">
                        <i className="pi pi-folder mr-1"></i>
                        {team.project_name}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowManageModal(true);
                      }}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      View →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="space-y-4">
            {receivedInvitations?.invitations.length === 0 ? (
              <div className="text-center py-12">
                <i className="pi pi-envelope text-4xl text-gray-600 mb-4"></i>
                <h3 className="text-xl text-gray-400 mb-2">No Pending Invitations</h3>
                <p className="text-gray-500">Team invitations will appear here</p>
              </div>
            ) : (
              receivedInvitations?.invitations.map(invitation => (
                <div key={invitation.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{invitation.team.name}</h3>
                      <p className="text-gray-400 text-sm mb-2">
                        Invited by {invitation.inviter.username || invitation.inviter.name} to join as{' '}
                        <span className={`px-2 py-1 rounded text-xs font-medium border ml-1 ${getRoleColor(invitation.role)}`}>
                          {invitation.role}
                        </span>
                      </p>
                      {invitation.message && (
                        <p className="text-gray-300 text-sm italic bg-gray-700 p-3 rounded mt-2">
                          "{invitation.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      <span className="flex items-center">
                        <i className="pi pi-clock mr-1"></i>
                        Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => invitation.token && handleDeclineInvitation(invitation.token)}
                        className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => invitation.token && handleAcceptInvitation(invitation.token)}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm transition-colors"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTeamCreated={fetchData}
      />

      {/* Manage Team Modal */}
      <ManageTeamModal
        isOpen={showManageModal}
        onClose={() => {
          setShowManageModal(false);
          setSelectedTeam(null);
        }}
        team={selectedTeam}
        onTeamUpdated={fetchData}
        currentUserId={currentUser?.id || 0}
      />
    </div>
  );
}