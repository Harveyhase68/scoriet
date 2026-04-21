// resources/js/Components/Panels/ProjectPrintModal.tsx
// Modal for printing/exporting project overview documentation as PDF
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useTheme } from '@/contexts/ThemeContext';

// ========== INTERFACES ==========

interface ProjectPrintModalProps {
  visible: boolean;
  onHide: () => void;
  projectId: number | null;
}

interface PrintOptions {
  showBasicInfo: boolean;
  showDatabaseSettings: boolean;
  showLanguages: boolean;
  showTeamMembers: boolean;
  showLinkedSchemas: boolean;
  showLinkedTemplates: boolean;
  showTemplateVariables: boolean;
  showDeploymentSettings: boolean;
  showGitSettings: boolean;
  showFtpSettings: boolean;
}

interface ProjectData {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  is_active: boolean;
  is_public?: boolean;
  join_code?: string;
  created_at: string;
  default_language?: string;
  enabled_languages?: string[];
  database_type?: string;
  database_server?: string;
  database_port?: string;
  database_name?: string;
  database_username?: string;
  project_directory?: string;
  project_url?: string;
  decimal_separator?: string;
  thousands_separator?: string;
  date_format?: string;
  time_format?: string;
  currency_symbol?: string;
  timezone?: string;
  owner?: { id: number; name: string; email: string; username?: string };
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role?: string;
  pivot?: { role?: string };
}

interface SchemaInfo {
  id: number;
  name: string;
  last_version?: number;
  tables_count?: number;
  association_type?: string;
}

interface TemplateInfo {
  id: number;
  name: string;
  description?: string;
  files_count?: number;
}

interface GitSettings {
  provider?: string;
  repository?: string;
  branch?: string;
  auto_push?: boolean;
  workflow_enabled?: boolean;
}

interface FtpSettings {
  deployment_type?: string;
  host?: string;
  port?: number;
  directory?: string;
  username?: string;
  passive_mode?: boolean;
  use_ssl?: boolean;
}

interface DeploymentSettings {
  protected_files?: string[];
  install_script?: Array<{ description: string; command: string }>;
  update_script?: Array<{ description: string; command: string }>;
}

interface TemplateVariable {
  template_name: string;
  variables: Array<{ name: string; description?: string; default_value?: string; is_required?: boolean }>;
}

// ========== HELPERS ==========

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
  return { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` };
}

const esc = (s: string | undefined | null) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ========== HTML GENERATION ==========

function generateProjectPrintHtml(
  project: ProjectData,
  members: TeamMember[],
  schemas: SchemaInfo[],
  templates: TemplateInfo[],
  templateVars: TemplateVariable[],
  gitSettings: GitSettings | null,
  ftpSettings: FtpSettings | null,
  deploySettings: DeploymentSettings | null,
  options: PrintOptions,
): string {
  const today = new Date().toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const now = new Date().toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
  const ownerName = project.owner?.name || 'Unknown';
  const createdDate = new Date(project.created_at).toLocaleDateString('de-AT');

  const sections: string[] = [];

  // Basic Info
  if (options.showBasicInfo) {
    sections.push(`
      <div class="section">
        <h2>Project Information</h2>
        <table class="info-table">
          <tr><td class="label">Name</td><td>${esc(project.name)}</td></tr>
          ${project.description ? `<tr><td class="label">Description</td><td>${esc(project.description)}</td></tr>` : ''}
          <tr><td class="label">Owner</td><td>${esc(ownerName)}${project.owner?.email ? ` (${esc(project.owner.email)})` : ''}</td></tr>
          <tr><td class="label">Created</td><td>${createdDate}</td></tr>
          <tr><td class="label">Status</td><td>${project.is_active ? 'Active' : 'Inactive'} · ${project.is_public ? 'Public' : 'Private'}</td></tr>
          ${project.join_code ? `<tr><td class="label">Join Code</td><td><code>${esc(project.join_code)}</code></td></tr>` : ''}
          ${project.project_directory ? `<tr><td class="label">Directory</td><td>${esc(project.project_directory)}</td></tr>` : ''}
          ${project.project_url ? `<tr><td class="label">URL</td><td>${esc(project.project_url)}</td></tr>` : ''}
        </table>
      </div>
    `);
  }

  // Database Connection
  if (options.showDatabaseSettings && project.database_type) {
    sections.push(`
      <div class="section">
        <h2>Database Connection</h2>
        <table class="info-table">
          <tr><td class="label">Type</td><td>${esc(project.database_type || 'Not set')}</td></tr>
          <tr><td class="label">Server</td><td>${esc(project.database_server || 'localhost')}</td></tr>
          <tr><td class="label">Port</td><td>${esc(project.database_port || '')}</td></tr>
          <tr><td class="label">Database</td><td>${esc(project.database_name || '')}</td></tr>
          <tr><td class="label">Username</td><td>${esc(project.database_username || '')}</td></tr>
          <tr><td class="label">Password</td><td>********</td></tr>
        </table>
      </div>
    `);
  }

  // Languages
  if (options.showLanguages && project.enabled_languages && project.enabled_languages.length > 0) {
    const langNames: Record<string, string> = { de: 'German', en: 'English', fr: 'French', es: 'Spanish', it: 'Italian', pt: 'Portuguese', nl: 'Dutch' };
    sections.push(`
      <div class="section">
        <h2>Languages & Localization</h2>
        <table class="data-table">
          <thead><tr><th>Code</th><th>Language</th><th>Default</th></tr></thead>
          <tbody>
            ${project.enabled_languages.map(l => `<tr><td><strong>${l.toUpperCase()}</strong></td><td>${langNames[l] || l}</td><td>${l === project.default_language ? '✓' : ''}</td></tr>`).join('')}
          </tbody>
        </table>
        ${project.decimal_separator || project.date_format ? `
          <div class="sub-section">
            <h3>Format Settings</h3>
            <table class="info-table">
              ${project.decimal_separator ? `<tr><td class="label">Decimal</td><td>${esc(project.decimal_separator)}</td></tr>` : ''}
              ${project.thousands_separator ? `<tr><td class="label">Thousands</td><td>${esc(project.thousands_separator)}</td></tr>` : ''}
              ${project.date_format ? `<tr><td class="label">Date Format</td><td>${esc(project.date_format)}</td></tr>` : ''}
              ${project.time_format ? `<tr><td class="label">Time Format</td><td>${esc(project.time_format)}</td></tr>` : ''}
              ${project.currency_symbol ? `<tr><td class="label">Currency</td><td>${esc(project.currency_symbol)}</td></tr>` : ''}
              ${project.timezone ? `<tr><td class="label">Timezone</td><td>${esc(project.timezone)}</td></tr>` : ''}
            </table>
          </div>
        ` : ''}
      </div>
    `);
  }

  // Team Members
  if (options.showTeamMembers && members.length > 0) {
    sections.push(`
      <div class="section">
        <h2>Team Members (${members.length})</h2>
        <table class="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            ${members.map(m => `<tr><td>${esc(m.name)}</td><td>${esc(m.email)}</td><td>${esc(m.role || 'member')}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `);
  }

  // Linked Schemas
  if (options.showLinkedSchemas && schemas.length > 0) {
    sections.push(`
      <div class="section">
        <h2>Linked Schemas (${schemas.length})</h2>
        <table class="data-table">
          <thead><tr><th>Schema Name</th><th>Version</th><th>Tables</th><th>Link Type</th></tr></thead>
          <tbody>
            ${schemas.map(s => `<tr><td>${esc(s.name)}</td><td>v${s.last_version || '?'}</td><td>${s.tables_count || '?'}</td><td>${esc(s.association_type || 'linked')}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `);
  }

  // Linked Templates
  if (options.showLinkedTemplates && templates.length > 0) {
    sections.push(`
      <div class="section">
        <h2>Linked Templates (${templates.length})</h2>
        <table class="data-table">
          <thead><tr><th>Template Name</th><th>Description</th><th>Files</th></tr></thead>
          <tbody>
            ${templates.map(t => `<tr><td>${esc(t.name)}</td><td>${esc(t.description || '')}</td><td>${t.files_count || '?'}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `);
  }

  // Template Variables
  if (options.showTemplateVariables && templateVars.length > 0) {
    sections.push(`
      <div class="section">
        <h2>Template Variables</h2>
        ${templateVars.map(tv => `
          <h3>${esc(tv.template_name)}</h3>
          <table class="data-table">
            <thead><tr><th>Variable</th><th>Description</th><th>Default</th><th>Required</th></tr></thead>
            <tbody>
              ${tv.variables.map(v => `<tr><td><code>${esc(v.name)}</code></td><td>${esc(v.description || '')}</td><td>${esc(v.default_value || '')}</td><td>${v.is_required ? '✓' : ''}</td></tr>`).join('')}
            </tbody>
          </table>
        `).join('')}
      </div>
    `);
  }

  // Deployment Settings
  if (options.showDeploymentSettings && deploySettings) {
    const hasData = (deploySettings.protected_files && deploySettings.protected_files.length > 0) ||
      (deploySettings.install_script && deploySettings.install_script.length > 0) ||
      (deploySettings.update_script && deploySettings.update_script.length > 0);
    if (hasData) {
      sections.push(`
        <div class="section">
          <h2>Deployment Settings</h2>
          ${deploySettings.protected_files && deploySettings.protected_files.length > 0 ? `
            <h3>Protected Files (${deploySettings.protected_files.length})</h3>
            <ul>${deploySettings.protected_files.map(f => `<li><code>${esc(f)}</code></li>`).join('')}</ul>
          ` : ''}
          ${deploySettings.install_script && deploySettings.install_script.length > 0 ? `
            <h3>Install Script</h3>
            <table class="data-table"><thead><tr><th>Step</th><th>Command</th></tr></thead><tbody>
              ${deploySettings.install_script.map(s => `<tr><td>${esc(s.description)}</td><td><code>${esc(s.command)}</code></td></tr>`).join('')}
            </tbody></table>
          ` : ''}
          ${deploySettings.update_script && deploySettings.update_script.length > 0 ? `
            <h3>Update Script</h3>
            <table class="data-table"><thead><tr><th>Step</th><th>Command</th></tr></thead><tbody>
              ${deploySettings.update_script.map(s => `<tr><td>${esc(s.description)}</td><td><code>${esc(s.command)}</code></td></tr>`).join('')}
            </tbody></table>
          ` : ''}
        </div>
      `);
    }
  }

  // Git Settings
  if (options.showGitSettings && gitSettings && gitSettings.provider) {
    sections.push(`
      <div class="section">
        <h2>Git Integration</h2>
        <table class="info-table">
          <tr><td class="label">Provider</td><td>${esc(gitSettings.provider || '')}</td></tr>
          <tr><td class="label">Repository</td><td>${esc(gitSettings.repository || '')}</td></tr>
          <tr><td class="label">Branch</td><td>${esc(gitSettings.branch || 'main')}</td></tr>
          <tr><td class="label">Auto Push</td><td>${gitSettings.auto_push ? 'Yes' : 'No'}</td></tr>
          <tr><td class="label">Workflow</td><td>${gitSettings.workflow_enabled ? 'Enabled' : 'Disabled'}</td></tr>
        </table>
      </div>
    `);
  }

  // FTP/SSH Settings
  if (options.showFtpSettings && ftpSettings && ftpSettings.host) {
    sections.push(`
      <div class="section">
        <h2>FTP/SSH Deployment</h2>
        <table class="info-table">
          <tr><td class="label">Type</td><td>${esc(ftpSettings.deployment_type || 'FTP')}</td></tr>
          <tr><td class="label">Host</td><td>${esc(ftpSettings.host)}</td></tr>
          <tr><td class="label">Port</td><td>${ftpSettings.port || ''}</td></tr>
          <tr><td class="label">Directory</td><td>${esc(ftpSettings.directory || '/')}</td></tr>
          <tr><td class="label">Username</td><td>${esc(ftpSettings.username || '')}</td></tr>
          <tr><td class="label">Password</td><td>********</td></tr>
          <tr><td class="label">Passive Mode</td><td>${ftpSettings.passive_mode ? 'Yes' : 'No'}</td></tr>
          <tr><td class="label">SSL/TLS</td><td>${ftpSettings.use_ssl ? 'Yes' : 'No'}</td></tr>
        </table>
      </div>
    `);
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Project Overview - ${esc(project.name)}</title>
  <style>
    @page { size: portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.4; }

    .doc-header { border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 16px; }
    .doc-header h1 { font-size: 20px; color: #1e293b; margin-bottom: 2px; }
    .doc-header .subtitle { font-size: 12px; color: #64748b; }
    .doc-header .meta { font-size: 10px; color: #94a3b8; margin-top: 4px; }

    .summary { margin-bottom: 16px; display: flex; gap: 16px; flex-wrap: wrap; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px 14px; text-align: center; }
    .summary-num { font-size: 20px; font-weight: 700; color: #3b82f6; }
    .summary-label { font-size: 9px; color: #64748b; text-transform: uppercase; }

    .section { margin-bottom: 18px; break-inside: avoid; }
    .section h2 { font-size: 13px; color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; margin-bottom: 8px; }
    .section h3 { font-size: 11px; color: #475569; margin: 8px 0 4px; }
    .sub-section { margin-top: 10px; }

    .info-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 4px; }
    .info-table td { padding: 3px 8px; border-bottom: 1px solid #f1f5f9; }
    .info-table .label { font-weight: 600; color: #475569; width: 140px; }

    .data-table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; font-size: 10px; margin-bottom: 4px; }
    .data-table th { background: #f8fafc; text-align: left; padding: 4px 6px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 9px; text-transform: uppercase; }
    .data-table td { padding: 3px 6px; border: 1px solid #e2e8f0; }
    .data-table tr:nth-child(even) { background: #fafbfc; }

    code { background: #f1f5f9; padding: 1px 4px; border-radius: 2px; font-size: 10px; font-family: 'Consolas', monospace; }
    ul { padding-left: 20px; margin: 4px 0; }
    li { padding: 1px 0; }

    .doc-footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <h1>${esc(project.name)}</h1>
    <div class="subtitle">Project Overview Documentation</div>
    <div class="meta">Owner: ${esc(ownerName)} · Generated: ${today} ${now}</div>
  </div>

  <div class="summary">
    <div class="summary-card"><div class="summary-num">${members.length}</div><div class="summary-label">Members</div></div>
    <div class="summary-card"><div class="summary-num">${schemas.length}</div><div class="summary-label">Schemas</div></div>
    <div class="summary-card"><div class="summary-num">${templates.length}</div><div class="summary-label">Templates</div></div>
    <div class="summary-card"><div class="summary-num">${(project.enabled_languages || []).length}</div><div class="summary-label">Languages</div></div>
  </div>

  ${sections.join('\n')}

  <div class="doc-footer">
    Generated by Scoriet · ${esc(project.name)} · ${today}
  </div>
</body>
</html>`;
}

// ========== MAIN COMPONENT ==========

const ProjectPrintModal: React.FC<ProjectPrintModalProps> = ({ visible, onHide, projectId }) => {
  const { colors } = useTheme();
  const previewRef = useRef<HTMLIFrameElement>(null);

  const [project, setProject] = useState<ProjectData | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [schemas, setSchemas] = useState<SchemaInfo[]>([]);
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [templateVars, setTemplateVars] = useState<TemplateVariable[]>([]);
  const [gitSettings, setGitSettings] = useState<GitSettings | null>(null);
  const [ftpSettings, setFtpSettings] = useState<FtpSettings | null>(null);
  const [deploySettings, setDeploySettings] = useState<DeploymentSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const [options, setOptions] = useState<PrintOptions>({
    showBasicInfo: true,
    showDatabaseSettings: true,
    showLanguages: true,
    showTeamMembers: true,
    showLinkedSchemas: true,
    showLinkedTemplates: true,
    showTemplateVariables: false,
    showDeploymentSettings: true,
    showGitSettings: true,
    showFtpSettings: true,
  });

  // Load all project data when modal opens
  useEffect(() => {
    if (!visible || !projectId) {
      // Reset all state when modal closes
      if (!visible) {
        setProject(null);
        setMembers([]);
        setSchemas([]);
        setTemplates([]);
        setGitSettings(null);
        setFtpSettings(null);
        setDeploySettings(null);
      }
      return;
    }
    const headers = getAuthHeaders();
    setLoading(true);

    const fetchAll = async () => {
      try {
        // Parallel fetch all data
        const [projRes, membersRes, schemasRes, templatesRes, settingsRes, gitRes, ftpRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`, { headers }),
          fetch(`/api/projects/${projectId}/members`, { headers }),
          fetch(`/api/projects/${projectId}/schemas`, { headers }),
          fetch(`/api/projects/${projectId}/template-usages`, { headers }),
          fetch(`/api/projects/${projectId}/settings`, { headers }),
          fetch(`/api/projects/${projectId}/git-settings`, { headers }).catch(() => null),
          fetch(`/api/projects/${projectId}/ftp-settings`, { headers }).catch(() => null),
        ]);

        if (projRes.ok) {
          const d = await projRes.json();
          setProject(d.project || d.data || d);
        }
        if (membersRes.ok) {
          const d = await membersRes.json();
          const raw = d.members || d.data || (Array.isArray(d) ? d : []);
          // API returns {user_id, role, user: {name, email}} - flatten to {name, email, role}
          setMembers(raw.map((m: Record<string, unknown>) => ({
            id: m.user_id || m.id,
            name: (m.user as Record<string, unknown>)?.name || m.name || '',
            email: (m.user as Record<string, unknown>)?.email || m.email || '',
            role: m.role || 'member',
          })));
        }
        if (schemasRes.ok) {
          const d = await schemasRes.json();
          const raw = d.schemas || d.data || (Array.isArray(d) ? d : []);
          setSchemas(raw.map((s: Record<string, unknown>) => ({
            id: s.id as number,
            name: (s.name || '') as string,
            last_version: (s.last_version || s.versions_count || 0) as number,
            tables_count: (s.schema_tables_count || s.tables_count || 0) as number,
            association_type: ((s.pivot as Record<string, unknown>)?.association_type || s.association_type || 'linked') as string,
          })));
        }
        if (templatesRes.ok) {
          const d = await templatesRes.json();
          setTemplates(d.templates || d.data || (Array.isArray(d) ? d : []));
        }
        if (settingsRes.ok) {
          const d = await settingsRes.json();
          setDeploySettings({
            protected_files: d.protected_files || [],
            install_script: d.install_script || [],
            update_script: d.update_script || [],
          });
        }
        if (gitRes && gitRes.ok) {
          const d = await gitRes.json();
          setGitSettings(d.settings || d.data || d);
        }
        if (ftpRes && ftpRes.ok) {
          const d = await ftpRes.json();
          setFtpSettings(d.settings || d.data || d);
        }

        // Template variables (needs template list first)
        // Skip for now - loaded separately if toggled
        setTemplateVars([]);
      } catch { /* ignore */ }
      setLoading(false);
    };

    fetchAll();
  }, [visible, projectId]);

  // Generate preview HTML
  const previewHtml = useMemo(() => {
    if (!project) return '';
    return generateProjectPrintHtml(
      project, members, schemas, templates, templateVars,
      gitSettings, ftpSettings, deploySettings, options,
    );
  }, [project, members, schemas, templates, templateVars, gitSettings, ftpSettings, deploySettings, options]);

  // Update iframe preview — with retry for timing issues
  useEffect(() => {
    const updateIframe = () => {
      if (previewRef.current && previewHtml) {
        const doc = previewRef.current.contentDocument;
        if (doc) { doc.open(); doc.write(previewHtml); doc.close(); return true; }
      }
      return false;
    };
    if (!updateIframe()) {
      // Iframe might not be mounted yet — retry once after a short delay
      const timer = setTimeout(updateIframe, 100);
      return () => clearTimeout(timer);
    }
  }, [previewHtml]);

  // Print
  const handlePrint = useCallback(() => {
    if (!previewHtml) return;
    const w = window.open('', '_blank');
    if (w) { w.document.write(previewHtml); w.document.close(); w.onload = () => { w.print(); }; }
  }, [previewHtml]);

  const toggleOption = (key: keyof PrintOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Project Overview"
      modal
      maximizable
      style={{ width: '90vw', maxWidth: 1200, height: '85vh' }}
      contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
    >
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: `1px solid ${colors.borderPrimary}`, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{project?.name || 'Loading...'}</span>
        <div style={{ flex: 1 }} />
        <Button icon="pi pi-print" label="Print / PDF" className="p-button-sm" onClick={handlePrint} disabled={!previewHtml || loading} style={{ backgroundColor: '#3b82f6', border: 'none' }} />
      </div>

      {/* Main: Options + Preview */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Options */}
        <div style={{ width: 220, flexShrink: 0, padding: '12px 14px', borderRight: `1px solid ${colors.borderPrimary}`, overflowY: 'auto', fontSize: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 10 }}>Sections</div>
          {([
            ['showBasicInfo', 'Project Info'],
            ['showDatabaseSettings', 'Database Connection'],
            ['showLanguages', 'Languages & Formats'],
            ['showTeamMembers', 'Team Members'],
            ['showLinkedSchemas', 'Linked Schemas'],
            ['showLinkedTemplates', 'Linked Templates'],
            ['showTemplateVariables', 'Template Variables'],
            ['showDeploymentSettings', 'Deployment Settings'],
            ['showGitSettings', 'Git Integration'],
            ['showFtpSettings', 'FTP/SSH Deployment'],
          ] as [keyof PrintOptions, string][]).map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }} onClick={() => toggleOption(key)}>
              <Checkbox checked={options[key]} onChange={() => toggleOption(key)} />
              <span style={{ color: colors.textPrimary }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Right: Preview */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10 }}>
              <ProgressSpinner style={{ width: 24, height: 24 }} strokeWidth="4" />
              <span style={{ color: colors.textMuted }}>Loading project data...</span>
            </div>
          ) : !project ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: colors.textMuted }}>
              No project data available.
            </div>
          ) : (
            <iframe ref={previewRef} title="Project Preview" style={{ flex: 1, border: 'none', backgroundColor: '#fff' }} />
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default ProjectPrintModal;
