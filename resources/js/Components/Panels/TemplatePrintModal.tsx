// resources/js/Components/Panels/TemplatePrintModal.tsx
// Modal for printing template overview with syntax-highlighted code
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useTheme } from '@/contexts/ThemeContext';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-dart';

// ========== INTERFACES ==========

interface TemplatePrintModalProps {
  visible: boolean;
  onHide: () => void;
  templateId: number | null;
}

interface TemplateData {
  id: number;
  name: string;
  description?: string;
  category?: string;
  language?: string;
  tags?: string[];
  file_count?: number;
  created_at?: string;
  visibility?: string;
  creator?: { name: string; email?: string };
  files?: TemplateFileData[];
}

interface TemplateFileData {
  id: number;
  file_name: string;
  file_path?: string;
  output_path?: string;
  file_type?: string;
  content_type?: string;
  file_content?: string;
  file_order?: number;
  form_window_type?: number;
  is_include_only?: boolean;
  inject_target?: string;
  inject_tag?: string;
  language_override?: string;
}

interface PrintOptions {
  showFileMetadata: boolean;
  showCode: boolean;
  syntaxHighlight: boolean;
  maxLines: number; // 0 = unlimited
  pageBreakPerFile: boolean;
}

// ========== HELPERS ==========

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
  return { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` };
}

const esc = (s: string | undefined | null) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const FORM_WINDOW_NAMES: Record<number, string> = {
  0: 'None', 1: 'Main Menu', 2: 'Create/Edit', 3: 'Data Table', 4: 'Report Single', 5: 'Report List',
};

// Map file extensions to Prism language keys
function getPrismLanguage(fileName: string, _templateLang?: string): string | null {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    php: 'php', blade: 'php',
    py: 'python', rb: 'ruby',
    java: 'java', kt: 'kotlin', kts: 'kotlin',
    cs: 'csharp',
    go: 'go', rs: 'rust', swift: 'swift', dart: 'dart',
    html: 'markup', htm: 'markup', xml: 'markup', svg: 'markup', vue: 'markup',
    css: 'css', scss: 'css', less: 'css',
    sql: 'sql',
    json: 'json', yaml: 'yaml', yml: 'yaml',
    sh: 'bash', bash: 'bash', zsh: 'bash',
    md: 'markup', txt: 'markup',
  };
  // Check compound extensions like .blade.php
  if (fileName.includes('.blade.')) return 'php';
  return map[ext] || null;
}

function highlightCode(code: string, language: string | null): string {
  if (!language) return esc(code);
  try {
    const grammar = Prism.languages[language];
    if (grammar) return Prism.highlight(code, grammar, language);
  } catch { /* fallback */ }
  return esc(code);
}

// ========== HTML GENERATION ==========

function generateTemplatePrintHtml(
  template: TemplateData,
  options: PrintOptions,
): string {
  const today = new Date().toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const now = new Date().toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
  const files = template.files || [];
  const textFiles = files.filter(f => f.content_type !== 'zip');

  // Template header info
  const headerHtml = `
    <div class="section">
      <h2>Template Information</h2>
      <table class="info-table">
        <tr><td class="label">Name</td><td><strong>${esc(template.name)}</strong></td></tr>
        ${template.description ? `<tr><td class="label">Description</td><td>${esc(template.description)}</td></tr>` : ''}
        ${template.category ? `<tr><td class="label">Category</td><td>${esc(template.category)}</td></tr>` : ''}
        ${template.language ? `<tr><td class="label">Language</td><td>${esc(template.language)}</td></tr>` : ''}
        ${template.tags && template.tags.length > 0 ? `<tr><td class="label">Tags</td><td>${template.tags.map(t => `<span class="tag">${esc(t)}</span>`).join(' ')}</td></tr>` : ''}
        <tr><td class="label">Files</td><td>${textFiles.length} text files${files.length > textFiles.length ? ` + ${files.length - textFiles.length} ZIP files` : ''}</td></tr>
        ${template.creator ? `<tr><td class="label">Creator</td><td>${esc(template.creator.name)}</td></tr>` : ''}
        <tr><td class="label">Visibility</td><td>${esc(template.visibility || 'private')}</td></tr>
      </table>
    </div>
  `;

  // File sections
  const filesHtml = textFiles.map((file, idx) => {
    const content = file.file_content || '';
    const lines = content.split('\n');
    const displayLines = options.maxLines > 0 ? lines.slice(0, options.maxLines) : lines;
    const truncated = options.maxLines > 0 && lines.length > options.maxLines;

    // Metadata - always show as table rows for completeness
    let metaHtml = '';
    if (options.showFileMetadata) {
      const fileExt = file.file_type || file.file_name.split('.').pop() || '';
      const formName = FORM_WINDOW_NAMES[file.form_window_type || 0] || 'None';
      const metaRows: string[] = [];
      metaRows.push(`<tr><td class="meta-label">Path</td><td><code>${esc(file.output_path || '/')}</code></td><td class="meta-label">Type</td><td>${esc(fileExt)}</td></tr>`);
      metaRows.push(`<tr><td class="meta-label">Form Window</td><td>${formName}</td><td class="meta-label">Order</td><td>${file.file_order || 0}</td></tr>`);
      metaRows.push(`<tr><td class="meta-label">Include Only</td><td>${file.is_include_only ? 'Yes' : 'No'}</td><td class="meta-label">Lang Override</td><td>${esc(file.language_override) || '-'}</td></tr>`);
      if (file.inject_target || file.inject_tag) {
        metaRows.push(`<tr><td class="meta-label">Inject Target</td><td>${esc(file.inject_target) || '-'}</td><td class="meta-label">Inject Tag</td><td><code>${esc(file.inject_tag) || '-'}</code></td></tr>`);
      }
      metaHtml = `<table class="meta-table">${metaRows.join('')}</table>`;
    }

    // Code content
    let codeHtml = '';
    if (options.showCode && content.length > 0) {
      const lang = getPrismLanguage(file.file_name, template.language || undefined);
      const codeText = displayLines.join('\n');
      const highlighted = options.syntaxHighlight ? highlightCode(codeText, lang) : esc(codeText);

      // Table-based line numbers: each line is a row, wrap happens within the cell
      const codeRows = highlighted.split('\n').map((line, i) =>
        `<tr><td class="ln-cell">${i + 1}</td><td class="code-cell">${line || ' '}</td></tr>`
      ).join('');

      codeHtml = `
        <div class="code-block">
          <table class="code-table">${codeRows}</table>
          ${truncated ? `<div class="truncated">... ${lines.length - options.maxLines} more lines (${lines.length} total)</div>` : ''}
        </div>
      `;
    }

    return `
      ${options.pageBreakPerFile && idx > 0 ? '<div class="page-break-before">' : '<div class="file-section">'}
        <div class="file-header">
          <span class="file-name">${esc(file.file_name)}</span>
          <span class="file-lines">${lines.length} lines</span>
        </div>
        ${metaHtml}
        ${codeHtml}
      </div>
    `;
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Template - ${esc(template.name)}</title>
  <style>
    @page { size: portrait; margin: 10mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; color: #1e293b; line-height: 1.3; }

    .doc-header { border-bottom: 3px solid #3b82f6; padding-bottom: 8px; margin-bottom: 12px; }
    .doc-header h1 { font-size: 18px; color: #1e293b; margin-bottom: 2px; }
    .doc-header .subtitle { font-size: 11px; color: #64748b; }
    .doc-header .meta { font-size: 9px; color: #94a3b8; margin-top: 3px; }

    .section { margin-bottom: 14px; }
    .section h2 { font-size: 12px; color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 3px; margin-bottom: 6px; }

    .info-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .info-table td { padding: 2px 8px; border-bottom: 1px solid #f1f5f9; }
    .info-table .label { font-weight: 600; color: #475569; width: 100px; }

    .tag { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 1px 6px; border-radius: 3px; font-size: 9px; margin-right: 3px; }

    .file-section, .page-break-before { margin-bottom: 14px; break-inside: avoid; }
    .page-break-before { break-before: page; page-break-before: always; }

    .file-header { background: #1e40af; padding: 4px 8px; border-radius: 3px 3px 0 0; display: flex; justify-content: space-between; align-items: center; }
    .file-name { color: #fff; font-weight: 700; font-size: 11px; font-family: 'Consolas', monospace; }
    .file-lines { color: rgba(255,255,255,0.6); font-size: 9px; }

    .meta-table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-top: none; font-size: 9px; background: #f8fafc; }
    .meta-table td { padding: 2px 6px; border: 1px solid #f1f5f9; color: #1e293b; }
    .meta-table .meta-label { font-weight: 600; color: #64748b; width: 100px; background: #f1f5f9; }
    .meta-table code { background: #e2e8f0; padding: 0 3px; border-radius: 2px; font-size: 9px; }
    .badge-include { background: #fef3c7; color: #92400e; padding: 1px 4px; border-radius: 2px; font-size: 8px; font-weight: 600; }

    .code-block { border: 1px solid #e2e8f0; border-top: none; overflow: hidden; }
    .code-table { width: 100%; border-collapse: collapse; background: #fafbfc; font-family: 'Consolas', 'Courier New', monospace; font-size: 8.5px; line-height: 1.35; }
    .code-table td { padding: 0; vertical-align: top; }
    .code-table .ln-cell { width: 36px; min-width: 36px; text-align: right; padding-right: 6px; color: #94a3b8; user-select: none; border-right: 1px solid #e2e8f0; white-space: nowrap; }
    .code-table .code-cell { padding-left: 8px; padding-right: 6px; white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word; }
    .truncated { padding: 3px 8px; background: #fffbeb; color: #92400e; font-size: 9px; border-top: 1px dashed #e2e8f0; }

    /* Prism syntax highlighting (dark-on-light for print) */
    .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #6a9955; }
    .token.punctuation { color: #4b5563; }
    .token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol, .token.deleted { color: #b5cea8; }
    .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: #ce9178; }
    .token.operator, .token.entity, .token.url { color: #d4d4d4; }
    .token.atrule, .token.attr-value, .token.keyword { color: #569cd6; }
    .token.function, .token.class-name { color: #dcdcaa; }
    .token.regex, .token.important, .token.variable { color: #d16969; }

    /* Print-friendly syntax colors */
    .token.comment { color: #6b7280; font-style: italic; }
    .token.keyword { color: #7c3aed; font-weight: 600; }
    .token.string { color: #059669; }
    .token.number, .token.boolean { color: #d97706; }
    .token.function { color: #2563eb; }
    .token.class-name { color: #dc2626; }
    .token.operator { color: #64748b; }
    .token.punctuation { color: #374151; }
    .token.property { color: #0891b2; }
    .token.tag { color: #dc2626; }
    .token.attr-name { color: #d97706; }
    .token.attr-value { color: #059669; }

    .doc-footer { margin-top: 16px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 8px; color: #94a3b8; text-align: center; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .file-section { break-inside: avoid; }
      .page-break-before { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <h1>${esc(template.name)}</h1>
    <div class="subtitle">Template Documentation · ${textFiles.length} files</div>
    <div class="meta">Generated: ${today} ${now}</div>
  </div>

  ${headerHtml}
  ${filesHtml.join('\n')}

  <div class="doc-footer">
    Generated by Scoriet · ${esc(template.name)} · ${today}
  </div>
</body>
</html>`;
}

// ========== MAIN COMPONENT ==========

const TemplatePrintModal: React.FC<TemplatePrintModalProps> = ({ visible, onHide, templateId }) => {
  const { colors } = useTheme();
  const previewRef = useRef<HTMLIFrameElement>(null);

  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(false);

  const [options, setOptions] = useState<PrintOptions>({
    showFileMetadata: true,
    showCode: true,
    syntaxHighlight: true,
    maxLines: 0,
    pageBreakPerFile: true,
  });

  // Load template data
  useEffect(() => {
    if (!visible || !templateId) {
      if (!visible) setTemplate(null);
      return;
    }
    setLoading(true);
    const loadTemplate = async () => {
      try {
        const res = await fetch(`/api/templates/${templateId}`, { headers: getAuthHeaders() });
        if (res.ok) {
          const d = await res.json();
          setTemplate(d.template || d.data || d);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    loadTemplate();
  }, [visible, templateId]);

  // Generate preview
  const previewHtml = useMemo(() => {
    if (!template) return '';
    return generateTemplatePrintHtml(template, options);
  }, [template, options]);

  // Update iframe
  useEffect(() => {
    const updateIframe = () => {
      if (previewRef.current && previewHtml) {
        const doc = previewRef.current.contentDocument;
        if (doc) { doc.open(); doc.write(previewHtml); doc.close(); return true; }
      }
      return false;
    };
    if (!updateIframe()) {
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
    setOptions(prev => ({ ...prev, [key]: !prev[key] as never }));
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Template Documentation"
      modal
      maximizable
      style={{ width: '90vw', maxWidth: 1200, height: '85vh' }}
      contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
    >
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: `1px solid ${colors.borderPrimary}`, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{template?.name || 'Loading...'}</span>
        {template && <span style={{ fontSize: 11, color: colors.textMuted }}>{(template.files || []).filter(f => f.content_type !== 'zip').length} files</span>}
        <div style={{ flex: 1 }} />
        <Button icon="pi pi-print" label="Print / PDF" className="p-button-sm" onClick={handlePrint} disabled={!previewHtml || loading} style={{ backgroundColor: '#3b82f6', border: 'none' }} />
      </div>

      {/* Main: Options + Preview */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Options */}
        <div style={{ width: 220, flexShrink: 0, padding: '12px 14px', borderRight: `1px solid ${colors.borderPrimary}`, overflowY: 'auto', fontSize: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>Display Options</div>

          {([
            ['showFileMetadata', 'File Metadata'],
            ['showCode', 'Source Code'],
            ['syntaxHighlight', 'Syntax Highlighting'],
            ['pageBreakPerFile', 'Page Break per File'],
          ] as [keyof PrintOptions, string][]).map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', cursor: 'pointer' }} onClick={() => toggleOption(key)}>
              <Checkbox checked={!!options[key]} onChange={() => toggleOption(key)} />
              <span style={{ color: colors.textPrimary }}>{label}</span>
            </div>
          ))}

          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>Max Lines per File</div>
            <InputNumber
              value={options.maxLines}
              onValueChange={e => setOptions(p => ({ ...p, maxLines: e.value || 0 }))}
              min={0} max={9999}
              placeholder="0 = unlimited"
              style={{ width: '100%' }}
              inputStyle={{ fontSize: 12, width: '100%' }}
            />
            <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>0 = all lines</div>
          </div>
        </div>

        {/* Right: Preview */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10 }}>
              <ProgressSpinner style={{ width: 24, height: 24 }} strokeWidth="4" />
              <span style={{ color: colors.textMuted }}>Loading template...</span>
            </div>
          ) : !template ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: colors.textMuted }}>
              No template data available.
            </div>
          ) : (
            <iframe ref={previewRef} title="Template Preview" style={{ flex: 1, border: 'none', backgroundColor: '#fff' }} />
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default TemplatePrintModal;
