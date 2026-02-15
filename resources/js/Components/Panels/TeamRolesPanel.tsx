import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Badge } from 'primereact/badge';
import { Checkbox } from 'primereact/checkbox';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import '@/Components/Panels/styles.css';

interface Permission {
  id: number;
  name: string;
  display_name: string;
  description: string;
}

interface TeamRole {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_owner_role: boolean; // Owner role cannot be deleted
  sort_order: number;
  permissions: number[];
  member_count: number;
}

interface TeamMember {
  id: number;
  user_id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  role: string;
  team_role_id: number | null;
  team_role: {
    id: number;
    name: string;
    slug: string;
    description: string;
    permissions: string[];
  } | null;
  joined_at: string;
}

interface TeamRolesPanelProps {
  teamId: number;
  teamName: string;
  isOwner?: boolean;
  updateTabTitle?: (newTitle: string) => void;
}

export default function TeamRolesPanel({ teamId, teamName, updateTabTitle }: TeamRolesPanelProps) {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();

  // Category display names (must be inside component to access t)
  const categoryNames: Record<string, string> = {
    project: t.teamrolespanel64,
    schema: t.teamrolespanel65,
    template: t.teamrolespanel66,
    generation: t.teamrolespanel67,
    team: t.teamrolespanel68,
    forms: t.teamrolespanel69,
    kanban: t.teamrolespanel70,
    messaging: t.teamrolespanel71,
  };

  // State
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<TeamRole | null>(null);
  const [showAllMembers, setShowAllMembers] = useState(true); // "Alle Rollen" filter

  // Modal states
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<TeamRole | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [copyFromRoleId, setCopyFromRoleId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Member role assignment
  const [memberRoleModalVisible, setMemberRoleModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [assignedRoleId, setAssignedRoleId] = useState<number | null>(null);

  const toast = useRef<Toast>(null);

  // Update tab title
  useEffect(() => {
    if (updateTabTitle) {
      updateTabTitle(`Rollen: ${teamName}`);
    }
  }, [teamName, updateTabTitle]);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) throw new Error(t.teamrolespanel115);

      // Load all data in parallel
      const [rolesRes, permissionsRes, membersRes] = await Promise.all([
        fetch(`/api/teams/${teamId}/roles`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        }),
        fetch('/api/team-roles/permissions', {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        }),
        fetch(`/api/teams/${teamId}/members-with-roles`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        }),
      ]);

      if (!rolesRes.ok || !permissionsRes.ok || !membersRes.ok) {
        throw new Error(t.teamrolespanel131);
      }

      const [rolesData, permissionsData, membersData] = await Promise.all([
        rolesRes.json(),
        permissionsRes.json(),
        membersRes.json(),
      ]);

      setRoles(rolesData.roles || []);
      setPermissions(permissionsData.permissions || {});
      setMembers(membersData.members || []);

      // Select first role by default
      if (rolesData.roles?.length > 0 && !selectedRole) {
        setSelectedRole(rolesData.roles[0]);
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: t.messageError,
        detail: error instanceof Error ? error.message : t.teamrolespanel152,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create/Edit role modal
  const handleOpenRoleModal = (role?: TeamRole) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setRoleDescription(role.description || '');
      setSelectedPermissions(role.permissions);
      setCopyFromRoleId(null);
    } else {
      setEditingRole(null);
      setRoleName('');
      setRoleDescription('');
      setSelectedPermissions([]);
      setCopyFromRoleId(null);
    }
    setRoleModalVisible(true);
  };

  // Copy from role handler
  const handleCopyFromRole = (roleId: number) => {
    setCopyFromRoleId(roleId);
    const sourceRole = roles.find(r => r.id === roleId);
    if (sourceRole) {
      setSelectedPermissions(sourceRole.permissions);
    }
  };

  // Save role
  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      toast.current?.show({ severity: 'warn', summary: t.teamrolespanel194, detail: t.teamrolespanel194_2, life: 3000 });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const url = editingRole
        ? `/api/teams/${teamId}/roles/${editingRole.id}`
        : `/api/teams/${teamId}/roles`;
      const method = editingRole ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roleName,
          description: roleDescription || null,
          permissions: selectedPermissions,
          copy_from_role_id: !editingRole ? copyFromRoleId : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.teamrolespanel224);
      }

      toast.current?.show({
        severity: 'success',
        summary: 'Erfolg',
        detail: editingRole ? t.teamrolespanel230 : t.teamrolespanel230_2,
        life: 3000,
      });

      setRoleModalVisible(false);
      loadData();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: t.messageError,
        detail: error instanceof Error ? error.message : t.teamrolespanel240,
        life: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete role
  const handleDeleteRole = (role: TeamRole) => {
    if (role.is_owner_role) {
      toast.current?.show({
        severity: 'warn',
        summary: t.teamrolespanel253,
        detail: t.teamrolespanel254,
        life: 3000,
      });
      return;
    }

    confirmDialog({
      group: 'team-roles',
      message: `${t.teamrolespanel262}"${role.name}"${t.teamrolespanel262_3}`,
      header: t.teamrolespanel263,
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
          const response = await fetch(`/api/teams/${teamId}/roles/${role.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || t.teamrolespanel277);
          }

          toast.current?.show({ severity: 'success', summary: 'Erfolg', detail: 'Rolle gelöscht', life: 3000 });
          setSelectedRole(null);
          loadData();
        } catch (error) {
          toast.current?.show({
            severity: 'error',
            summary: t.messageError,
            detail: error instanceof Error ? error.message : t.teamrolespanel287,
            life: 3000,
          });
        }
      },
    });
  };

  // Copy system role to team
  const handleCopyRoleToTeam = async (role: TeamRole) => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/teams/${teamId}/roles/${role.id}/copy`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.teamrolespanel307);
      }

      toast.current?.show({ severity: 'success', summary: t.teamrolespanel310, detail: t.teamrolespanel310_2, life: 3000 });
      loadData();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: t.messageError,
        detail: error instanceof Error ? error.message : t.teamrolespanel316,
        life: 3000,
      });
    }
  };

  // Assign role to member
  const handleOpenMemberRoleModal = (member: TeamMember) => {
    setSelectedMember(member);
    setAssignedRoleId(member.team_role_id);
    setMemberRoleModalVisible(true);
  };

  const handleAssignRole = async () => {
    if (!selectedMember) return;

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/teams/${teamId}/members/${selectedMember.id}/team-role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team_role_id: assignedRoleId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.teamrolespanel347);
      }

      toast.current?.show({ severity: 'success', summary: t.teamrolespanel350, detail: t.teamrolespanel350_2, life: 3000 });
      setMemberRoleModalVisible(false);
      loadData();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: t.messageError,
        detail: error instanceof Error ? error.message : t.teamrolespanel357,
        life: 3000,
      });
    }
  };

  // Toggle permission
  const togglePermission = (permissionId: number) => {
    if (selectedPermissions.includes(permissionId)) {
      setSelectedPermissions(selectedPermissions.filter(id => id !== permissionId));
    } else {
      setSelectedPermissions([...selectedPermissions, permissionId]);
    }
  };

  // Get all permission IDs from a category
  const getCategoryPermissionIds = (category: string): number[] => {
    return (permissions[category] || []).map(p => p.id);
  };

  // Check if all permissions in category are selected
  const isCategoryFullySelected = (category: string): boolean => {
    const ids = getCategoryPermissionIds(category);
    return ids.every(id => selectedPermissions.includes(id));
  };

  // Toggle entire category
  const toggleCategory = (category: string) => {
    const ids = getCategoryPermissionIds(category);
    if (isCategoryFullySelected(category)) {
      setSelectedPermissions(selectedPermissions.filter(id => !ids.includes(id)));
    } else {
      setSelectedPermissions([...new Set([...selectedPermissions, ...ids])]);
    }
  };

  // Handle role selection (including "Alle Rollen")
  const handleSelectRole = (role: TeamRole | null) => {
    if (role === null) {
      // "Alle Rollen" selected
      setShowAllMembers(true);
      setSelectedRole(null);
    } else {
      setShowAllMembers(false);
      setSelectedRole(role);
    }
  };

  // Get filtered members based on selected role
  const filteredMembers = showAllMembers
    ? members
    : members.filter(m => m.team_role_id === selectedRole?.id);

  // Render roles list
  const renderRolesList = () => (
    <div className="space-y-2">
      {/* "Alle Rollen" option */}
      <div
        className={`p-3 rounded cursor-pointer transition-colors ${showAllMembers ? 'ring-2' : ''}`}
        style={{
          backgroundColor: showAllMembers ? colors.infoBg : colors.bgSecondary,
          border: `1px solid ${showAllMembers ? colors.accent : colors.borderPrimary}`,
        }}
        onClick={() => handleSelectRole(null)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="pi pi-users" style={{ color: colors.accent }} />
            <span className="font-medium" style={{ color: colors.textPrimary }}>{t.teamrolespanel425}</span>
          </div>
          <Badge value={members.length} severity="info" />
        </div>
        <p className="text-sm mt-1" style={{ color: colors.textMuted }}>{t.teamrolespanel429}</p>
      </div>

      {/* Divider */}
      <div className="border-b my-2" style={{ borderColor: colors.borderPrimary }} />

      {/* Roles list */}
      {roles.map(role => (
        <div
          key={role.id}
          className={`p-3 rounded cursor-pointer transition-colors ${!showAllMembers && selectedRole?.id === role.id ? 'ring-2' : ''}`}
          style={{
            backgroundColor: !showAllMembers && selectedRole?.id === role.id ? colors.infoBg : colors.bgSecondary,
            border: `1px solid ${!showAllMembers && selectedRole?.id === role.id ? colors.accent : colors.borderPrimary}`,
          }}
          onClick={() => handleSelectRole(role)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {role.is_owner_role && <i className="pi pi-crown text-yellow-500" title={t.teamrolespanel448} />}
              <span className="font-medium" style={{ color: colors.textPrimary }}>{role.name}</span>
            </div>
            <Badge value={role.member_count} severity={role.member_count > 0 ? 'info' : 'secondary'} />
          </div>
          {role.description && (
            <p className="text-sm mt-1" style={{ color: colors.textMuted }}>{role.description}</p>
          )}
        </div>
      ))}
    </div>
  );

  // Render role details
  const renderRoleDetails = () => {
    // Show "Alle Rollen" info when showAllMembers is true
    if (showAllMembers) {
      return (
        <div className="flex items-center justify-center h-full" style={{ color: colors.textMuted }}>
          <div className="text-center p-4">
            <i className="pi pi-users text-4xl mb-3" style={{ color: colors.accent }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>{t.teamrolespanel469}</h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              {t.teamrolespanel471}
            </p>
            <p className="text-sm mt-2" style={{ color: colors.textMuted }}>
              {t.teamrolespanel474}
            </p>
          </div>
        </div>
      );
    }

    if (!selectedRole) {
      return (
        <div className="flex items-center justify-center h-full" style={{ color: colors.textMuted }}>
          <div className="text-center">
            <i className="pi pi-shield text-4xl mb-2" style={{ color: colors.textMuted }} />
            <p>{t.teamrolespanel486}</p>
          </div>
        </div>
      );
    }

    const rolePermissions = Object.entries(permissions).map(([category, perms]) => ({
      category,
      categoryName: categoryNames[category] || category,
      permissions: perms,
      enabledCount: perms.filter(p => selectedRole.permissions.includes(p.id)).length,
    }));

    return (
      <div className="space-y-4">
        {/* Role header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: colors.textPrimary }}>
              {selectedRole.is_owner_role && <i className="pi pi-crown text-yellow-500" />}
              {selectedRole.name}
            </h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>{selectedRole.description || 'Keine Beschreibung'}</p>
          </div>
          <div className="flex gap-2">
            {/* Edit button - all roles can be edited */}
            <Button
              icon="pi pi-pencil"
              className="p-button-sm p-button-text"
              onClick={() => handleOpenRoleModal(selectedRole)}
              tooltip={t.teamrolespanel516}
            />
            {/* Copy button - all roles can be copied */}
            <Button
              icon="pi pi-copy"
              className="p-button-sm p-button-text"
              onClick={() => handleCopyRoleToTeam(selectedRole)}
              tooltip={t.teamrolespanel523}
            />
            {/* Delete button - only non-owner roles */}
            {!selectedRole.is_owner_role && (
              <Button
                icon="pi pi-trash"
                className="p-button-sm p-button-text p-button-danger"
                onClick={() => handleDeleteRole(selectedRole)}
                tooltip={t.teamrolespanel531}
              />
            )}
          </div>
        </div>

        {/* Permissions list (read-only view) */}
        <div className="rounded p-3" style={{ border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
          <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>Berechtigungen</h4>
          {selectedRole.slug === 'owner' ? (
            <div className="p-3 rounded" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successBorder}` }}>
              <p className="text-sm flex items-center gap-2" style={{ color: colors.successText }}>
                <i className="pi pi-check-circle" />
                <strong>{t.teamrolespanel544}</strong>{t.teamrolespanel544_2}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {rolePermissions.map(({ category, categoryName, permissions: perms, enabledCount }) => (
                <div key={category} className="rounded p-2" style={{ backgroundColor: colors.bgTertiary }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm" style={{ color: colors.textPrimary }}>{categoryName}</span>
                    <Badge value={`${enabledCount}/${perms.length}`} severity={enabledCount > 0 ? 'success' : 'secondary'} />
                  </div>
                  <div className="space-y-1">
                    {perms.map(perm => (
                      <div key={perm.id} className="flex items-center gap-2 text-sm">
                        <i
                          className={`pi ${selectedRole.permissions.includes(perm.id) ? 'pi-check text-green-500' : 'pi-times text-red-400'}`}
                        />
                        <span style={{ color: selectedRole.permissions.includes(perm.id) ? colors.textPrimary : colors.textMuted }}>
                          {perm.display_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render members table
  const memberRoleTemplate = (member: TeamMember) => {
    if (member.team_role) {
      return (
        <div className="flex items-center gap-2">
          <Badge value={member.team_role.name} severity="info" />
        </div>
      );
    }
    return (
      <Badge value={member.role || t.teamrolespanel586} severity="secondary" />
    );
  };

  const memberActionsTemplate = (member: TeamMember) => (
    <Button
      icon="pi pi-pencil"
      className="p-button-rounded p-button-text p-button-sm"
      tooltip={t.teamrolespanel594}
      onClick={() => handleOpenMemberRoleModal(member)}
    />
  );

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}>
      <Toast ref={toast} />
      <ConfirmDialog group="team-roles" />

      {/* Main scrollable container */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Header */}
          <Card
            title={`${t.teamrolespanel609}${teamName}`}
            className="mb-4"
            style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}
          >
            <p className="text-sm" style={{ color: colors.textMuted }}>
              {t.teamrolespanel614}
            </p>
          </Card>

          {/* Main content */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Left: Roles list */}
            <Card
              className="col-span-1"
              style={{
                backgroundColor: colors.bgTertiary,
                border: `1px solid ${colors.borderSecondary}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{t.teamrolespanel629}</h3>
                <Button
                  icon="pi pi-plus"
                  label={t.teamrolespanel632}
                  className="p-button-sm p-button-success"
                  onClick={() => handleOpenRoleModal()}
                />
              </div>
              {loading ? (
                <div className="flex justify-center py-4">
                  <i className="pi pi-spin pi-spinner text-2xl" style={{ color: colors.accent }} />
                </div>
              ) : (
                renderRolesList()
              )}
            </Card>

            {/* Right: Role details */}
            <Card
              className="col-span-2"
              style={{
                backgroundColor: colors.bgTertiary,
                border: `1px solid ${colors.borderSecondary}`,
              }}
            >
              {loading ? (
                <div className="flex justify-center py-4">
                  <i className="pi pi-spin pi-spinner text-2xl" style={{ color: colors.accent }} />
                </div>
              ) : (
                renderRoleDetails()
              )}
            </Card>
          </div>

          {/* Members section */}
          <Card
            style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
                {t.teamrolespanel670}
                {!showAllMembers && selectedRole && (
                  <span className="ml-2 text-sm font-normal" style={{ color: colors.textMuted }}>
                    {t.teamrolespanel673}{selectedRole.name})
                  </span>
                )}
              </h3>
              <Badge
                value={filteredMembers.length}
                severity={filteredMembers.length > 0 ? 'info' : 'secondary'}
              />
            </div>
            <DataTable
              value={filteredMembers}
              loading={loading}
              emptyMessage={showAllMembers ? t.teamrolespanel685_3 : `${t.teamrolespanel685}"${selectedRole?.name}"${t.teamrolespanel685_2}`}
              className="p-datatable-sm themed-datatable"
              paginator
              rows={5}
              style={{
                ['--dt-bg' as string]: colors.bgSecondary,
                ['--dt-header-bg' as string]: colors.bgTertiary,
                ['--dt-border' as string]: colors.borderPrimary,
                ['--dt-text' as string]: colors.textPrimary,
              }}
            >
              <Column field="username" header={t.teamrolespanel696} sortable />
              <Column field="email" header={t.teamrolespanel697} sortable />
              <Column header={t.teamrolespanel698} body={memberRoleTemplate} />
              <Column header={t.teamrolespanel699} body={memberActionsTemplate} style={{ width: '100px' }} />
            </DataTable>
          </Card>
        </div>
      </div>

      {/* Create/Edit Role Modal */}
      <Dialog
        header={editingRole ? `${t.teamrolespanel707_2}${editingRole.name}` : t.teamrolespanel707}
        visible={roleModalVisible}
        onHide={() => setRoleModalVisible(false)}
        style={{ width: '700px' }}
        contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
        modal
        footer={
          <div style={{ backgroundColor: colors.bgTertiary, padding: '0.75rem 1rem', margin: '-1rem', marginTop: '0' }}>
            <Button label="Abbrechen" onClick={() => setRoleModalVisible(false)} className="p-button-secondary" />
            <Button
              label={saving ? t.teamrolespanel718_2 : t.teamrolespanel718}
              onClick={handleSaveRole}
              disabled={saving || !roleName.trim()}
              icon={saving ? 'pi pi-spinner pi-spin' : 'pi pi-check'}
              className="ml-2"
            />
          </div>
        }
      >
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>Name *</label>
            <InputText
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="z.B. Senior Developer"
              className="w-full"
              style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>Beschreibung</label>
            <InputTextarea
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              placeholder={t.teamrolespanel746}
              rows={2}
              className="w-full"
              style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
            />
          </div>

          {/* Copy from existing role */}
          {!editingRole && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>Berechtigungen kopieren von</label>
              <Dropdown
                value={copyFromRoleId}
                options={roles.map(r => ({ label: r.name, value: r.id }))}
                onChange={(e) => handleCopyFromRole(e.value)}
                placeholder={t.teamrolespanel761}
                className="w-full"
                showClear
              />
            </div>
          )}

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Berechtigungen</label>
            <div
              className="rounded overflow-hidden"
              style={{
                border: `1px solid ${colors.borderPrimary}`,
                ['--accordion-bg' as string]: colors.bgTertiary,
                ['--accordion-header-bg' as string]: colors.bgTertiary,
                ['--accordion-content-bg' as string]: colors.bgSecondary,
                ['--accordion-text' as string]: colors.textPrimary,
                ['--accordion-border' as string]: colors.borderPrimary,
              }}
            >
              <Accordion multiple className="themed-accordion">
                {Object.entries(permissions).map(([category, perms]) => (
                  <AccordionTab
                    key={category}
                    header={
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isCategoryFullySelected(category)}
                            onChange={() => toggleCategory(category)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span style={{ color: colors.textPrimary }}>{categoryNames[category] || category}</span>
                        </div>
                        <Badge
                          value={`${perms.filter(p => selectedPermissions.includes(p.id)).length}/${perms.length}`}
                          severity={perms.some(p => selectedPermissions.includes(p.id)) ? 'success' : 'secondary'}
                        />
                      </div>
                    }
                    contentStyle={{ backgroundColor: colors.bgSecondary }}
                    headerStyle={{ backgroundColor: colors.bgTertiary }}
                  >
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {perms.map(perm => (
                        <div
                          key={perm.id}
                          className="flex items-center gap-2 p-2 rounded cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}
                          onClick={() => togglePermission(perm.id)}
                        >
                          <Checkbox
                            checked={selectedPermissions.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                          />
                          <div>
                            <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>{perm.display_name}</div>
                            <div className="text-xs" style={{ color: colors.textMuted }}>{perm.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionTab>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Assign Role to Member Modal */}
      <Dialog
        header={`${t.teamrolespanel834}${selectedMember?.username}`}
        visible={memberRoleModalVisible}
        onHide={() => setMemberRoleModalVisible(false)}
        style={{ width: '400px' }}
        contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
        modal
        footer={
          <div style={{ backgroundColor: colors.bgTertiary, padding: '0.75rem 1rem', margin: '-1rem', marginTop: '0' }}>
            <Button label={t.teamrolespanel843} onClick={() => setMemberRoleModalVisible(false)} className="p-button-secondary" />
            <Button label={t.teamrolespanel844} onClick={handleAssignRole} icon="pi pi-check" className="ml-2" />
          </div>
        }
      >
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>{t.teamrolespanel849}</label>
          <Dropdown
            value={assignedRoleId}
            options={[
              { label: t.teamrolespanel853, value: null },
              ...roles.map(r => ({ label: r.name, value: r.id })),
            ]}
            onChange={(e) => setAssignedRoleId(e.value)}
            placeholder={t.teamrolespanel857}
            className="w-full"
          />
          {assignedRoleId && (
            <div className="mt-3 p-3 rounded" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}>
              <p className="text-sm" style={{ color: colors.infoText }}>
                {roles.find(r => r.id === assignedRoleId)?.description || t.teamrolespanel863}
              </p>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
