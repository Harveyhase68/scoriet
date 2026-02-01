import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Editor as PrimeEditor } from 'primereact/editor';
import { Checkbox } from 'primereact/checkbox';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { api } from '@/lib/api';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism-tomorrow.css';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

interface Page {
  id: number;
  slug: string;
  locale: string;
  title: string;
  content: string;
  is_active: boolean;
  popup_on_landingpage: boolean;
  popup_on_app: boolean;
  popup_priority: number;
  popup_version: number;
  created_at: string;
  updated_at: string;
}

interface PageFormData {
  slug: string;
  locale: string;
  title: string;
  content: string;
  is_active: boolean;
  popup_on_landingpage: boolean;
  popup_on_app: boolean;
  popup_priority: number;
  popup_version: number;
}

interface CMSAdminPanelProps {
  editPageId?: number;
}

export default function CMSAdminPanel({ editPageId }: CMSAdminPanelProps) {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const { colors } = useTheme();

  const localeOptions = [
    { label: t.editprojectmodal484, value: 'en' },
    { label: t.editprojectmodal485, value: 'de' },
    { label: t.editprojectmodal486, value: 'fr' },
    { label: t.editprojectmodal487, value: 'es' },
    { label: t.editprojectmodal488, value: 'it' },
  ];
  const toast = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState<PageFormData>({
    slug: '',
    locale: 'en',
    title: '',
    content: '',
    is_active: true,
    popup_on_landingpage: false,
    popup_on_app: false,
    popup_priority: 99,
    popup_version: 1,
  });
  const [saving, setSaving] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [pendingEditPageId, setPendingEditPageId] = useState<number | null>(
    editPageId || null
  );

  // Use ref to store pages for event handler (avoids stale closure)
  const pagesRef = React.useRef<Page[]>([]);
  pagesRef.current = pages;

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.request('/admin/pages');
      setPages(response);
    } catch (error: any) {
      toast.showError('Failed to load pages: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Helper function to open edit dialog for a page
  const openEditDialogForPage = useCallback((pageId: number, pagesList: Page[]) => {
    const pageToEdit = pagesList.find(p => p.id === pageId);
    if (pageToEdit) {
      setEditingPage(pageToEdit);
      setFormData({
        slug: pageToEdit.slug,
        locale: pageToEdit.locale,
        title: pageToEdit.title,
        content: pageToEdit.content,
        is_active: pageToEdit.is_active,
        popup_on_landingpage: pageToEdit.popup_on_landingpage || false,
        popup_on_app: pageToEdit.popup_on_app || false,
        popup_priority: pageToEdit.popup_priority || 99,
        popup_version: pageToEdit.popup_version || 1,
      });
      setShowDialog(true);
      return true;
    }
    return false;
  }, []);

  // Process pending edit when pages are loaded
  useEffect(() => {
    if (pendingEditPageId && pages.length > 0) {
      if (openEditDialogForPage(pendingEditPageId, pages)) {
        setPendingEditPageId(null);
      }
    }
  }, [pendingEditPageId, pages, openEditDialogForPage]);

  // Listen for cms-edit-page event (stable handler using ref)
  useEffect(() => {
    const handleEditPageEvent = (event: CustomEvent<{ pageId: number }>) => {
      const pageId = event.detail.pageId;
      const currentPages = pagesRef.current;

      if (currentPages.length > 0) {
        const pageToEdit = currentPages.find(p => p.id === pageId);
        if (pageToEdit) {
          setEditingPage(pageToEdit);
          setFormData({
            slug: pageToEdit.slug,
            locale: pageToEdit.locale,
            title: pageToEdit.title,
            content: pageToEdit.content,
            is_active: pageToEdit.is_active,
            popup_on_landingpage: pageToEdit.popup_on_landingpage || false,
            popup_on_app: pageToEdit.popup_on_app || false,
            popup_priority: pageToEdit.popup_priority || 99,
            popup_version: pageToEdit.popup_version || 1,
          });
          setShowDialog(true);
        }
      } else {
        // Pages not loaded yet, set as pending
        setPendingEditPageId(pageId);
      }
    };

    window.addEventListener('cms-edit-page', handleEditPageEvent as EventListener);
    return () => {
      window.removeEventListener('cms-edit-page', handleEditPageEvent as EventListener);
    };
  }, []); // Empty deps - handler uses ref for current pages

  const handleCreateNew = () => {
    setEditingPage(null);
    setFormData({
      slug: '',
      locale: 'en',
      title: '',
      content: '',
      is_active: true,
      popup_on_landingpage: false,
      popup_on_app: false,
      popup_priority: 99,
      popup_version: 1,
    });
    setShowDialog(true);
  };

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      locale: page.locale,
      title: page.title,
      content: page.content,
      is_active: page.is_active,
      popup_on_landingpage: page.popup_on_landingpage || false,
      popup_on_app: page.popup_on_app || false,
      popup_priority: page.popup_priority || 99,
      popup_version: page.popup_version || 1,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.slug || !formData.locale || !formData.title || !formData.content) {
      toast.showError(t.cmsadminpanel106);
      return;
    }

    setSaving(true);
    try {
      if (editingPage) {
        // Update existing page
        await api.request(`/admin/pages/${editingPage.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
            is_active: formData.is_active,
            popup_on_landingpage: formData.popup_on_landingpage,
            popup_on_app: formData.popup_on_app,
            popup_priority: formData.popup_priority,
            popup_version: formData.popup_version,
          }),
        });
        toast.showSuccess(t.cmsadminpanel122);
      } else {
        // Create new page
        await api.request('/admin/pages', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        toast.showSuccess(t.cmsadminpanel129);
      }

      setShowDialog(false);
      fetchPages();
    } catch (error: any) {
      toast.showError('Failed to save page: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (page: Page) => {
    confirmDialog({
      message: `Are you sure you want to delete "${page.title}"?`,
      header: t.cmsadminpanel144,
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await api.request(`/admin/pages/${page.id}`, {
            method: 'DELETE',
          });
          toast.showSuccess(t.cmsadminpanel152);
          fetchPages();
        } catch (error: any) {
          toast.showError('Failed to delete page: ' + (error.response?.data?.message || error.message));
        }
      },
    });
  };

  const actionBodyTemplate = (rowData: Page) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="info"
          onClick={() => handleEdit(rowData)}
          tooltip={t.cmsadminpanel170}
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          onClick={() => handleDelete(rowData)}
          tooltip={t.cmsadminpanel178}
        />
        <Button
          icon="pi pi-external-link"
          rounded
          text
          severity="secondary"
          onClick={() => window.open(`/${rowData.locale}/${rowData.slug}`, '_blank')}
          tooltip={t.cmsadminpanel186}
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData: Page) => {
    // Use darker green (#059669) for better contrast with white text in dark mode
    const activeColor = '#059669';
    return (
      <span
        className="px-2 py-1 rounded text-xs"
        style={{
          backgroundColor: rowData.is_active ? activeColor : colors.textMuted,
          color: '#ffffff'
        }}
      >
        {rowData.is_active ? t.templatesStatusActive : t.manageteammodal328}
      </span>
    );
  };

  const popupBodyTemplate = (rowData: Page) => {
    const hasPopup = rowData.popup_on_landingpage || rowData.popup_on_app;
    if (!hasPopup) return null;

    return (
      <div className="flex gap-1 flex-wrap">
        {rowData.popup_on_landingpage && (
          <span
            className="px-2 py-1 rounded text-xs"
            style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
          >
            Lobby
          </span>
        )}
        {rowData.popup_on_app && (
          <span
            className="px-2 py-1 rounded text-xs"
            style={{ backgroundColor: '#8b5cf6', color: '#ffffff' }}
          >
            App
          </span>
        )}
        {hasPopup && (
          <span
            className="px-2 py-1 rounded text-xs"
            style={{ backgroundColor: colors.textMuted, color: '#ffffff' }}
          >
            P{rowData.popup_priority}
          </span>
        )}
      </div>
    );
  };

  if (loading && pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: colors.bgPrimary }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-auto" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <ConfirmDialog />

      {/* Header */}
      <div className="flex-shrink-0 p-6" style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
              📝 CMS Page Management
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Manage static content pages (Help, Impressum, etc.)
            </p>
          </div>
          <Button
            label={t.cmsadminpanel224}
            icon="pi pi-plus"
            onClick={handleCreateNew}
            severity="success"
          />
        </div>
      </div>

      {/* DataTable */}
      <div className="flex-1 p-6">
        <DataTable
          value={pages}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="p-datatable-sm"
          stripedRows
          emptyMessage={t.cmsadminpanel241}
          loading={loading}
        >
          <Column field="slug" header={t.cmsadminpanel244} sortable />
          <Column field="locale" header={t.cmsadminpanel245} sortable style={{ width: '100px' }} />
          <Column field="title" header={t.cmsadminpanel246} sortable />
          <Column field="is_active" header={t.applicationsmodal335} body={statusBodyTemplate} sortable style={{ width: '100px' }} />
          <Column
            header="Popup"
            body={popupBodyTemplate}
            style={{ width: '180px' }}
          />
          <Column
            field="updated_at"
            header={t.cmsadminpanel250}
            sortable
            style={{ width: '150px' }}
            body={(rowData) => new Date(rowData.updated_at).toLocaleDateString()}
          />
          <Column
            header={t.applicationsmodal354}
            body={actionBodyTemplate}
            style={{ width: '150px' }}
          />
        </DataTable>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        header={editingPage ? 'Edit Page' : t.cmsadminpanel224}
        visible={showDialog}
        style={{ width: '90vw', maxWidth: '900px' }}
        breakpoints={{ '960px': '95vw', '640px': '100vw' }}
        maximizable
        blockScroll
        onHide={() => setShowDialog(false)}
        className="themed-dialog"
        contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => setShowDialog(false)}
              severity="secondary"
              outlined
            />
            <Button
              label={saving ? 'Saving...' : t.cmsadminpanel279}
              icon={saving ? 'pi pi-spinner pi-spin' : 'pi pi-check'}
              onClick={handleSave}
              severity="success"
              loading={saving}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Slug */}
          <div className="field">
            <label htmlFor="slug" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Slug *
            </label>
            <InputText
              id="slug"
              value={formData.slug}
              onChange={(e) => {
                // Transform: lowercase, replace spaces with underscores, remove invalid characters
                const transformed = e.target.value
                  .toLowerCase()
                  .replace(/\s+/g, '_')
                  .replace(/[^a-z0-9_]/g, '');
                setFormData({ ...formData, slug: transformed });
              }}
              placeholder={t.cmsadminpanel298}
              className="w-full"
              disabled={!!editingPage}
            />
            <small style={{ color: colors.textMuted }}>
              Only lowercase letters, numbers and underscores (e.g. welcome_popup)
            </small>
          </div>

          {/* Language */}
          <div className="field">
            <label htmlFor="locale" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Language *
            </label>
            <Dropdown
              id="locale"
              value={formData.locale}
              options={localeOptions}
              onChange={(e) => setFormData({ ...formData, locale: e.value })}
              placeholder={t.cmsadminpanel317}
              className="w-full"
              disabled={!!editingPage}
            />
            <small style={{ color: colors.textMuted }}>
              Cannot be changed after creation
            </small>
          </div>

          {/* Title */}
          <div className="field">
            <label htmlFor="title" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Title *
            </label>
            <InputText
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t.cmsadminpanel335}
              className="w-full"
            />
          </div>

          {/* Content Editor with Tabs */}
          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Content *
            </label>
            <TabView
              activeIndex={activeTabIndex}
              onTabChange={(e: any) => setActiveTabIndex(e.index)}
              className="w-full themed-tabview"
            >
              {/* Tab 1: WYSIWYG Editor */}
              <TabPanel header="WYSIWYG Editor" className="p-0">
                <PrimeEditor
                  value={formData.content}
                  onTextChange={(e: any) => setFormData({ ...formData, content: e.htmlValue || '' })}
                  style={{ height: '400px' }}
                />
              </TabPanel>

              {/* Tab 2: HTML Source Editor with Syntax Highlighting */}
              <TabPanel header={t.cmsadminpanel360} className="p-0">
                <div className="h-full rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                  <div className="flex justify-between items-center p-2" style={{ borderBottom: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
                    <span className="text-sm" style={{ color: colors.textSecondary }}>HTML Quellcode mit Syntax-Highlighting</span>
                    <Button
                      label={t.cmsadminpanel365}
                      icon="pi pi-refresh"
                      size="small"
                      onClick={() => {
                        // Format HTML using browser's built-in parser
                        try {
                          const formatted = formatHTML(formData.content);
                          setFormData({ ...formData, content: formatted });
                        } catch {
                          // If formatting fails, keep original content
                        }
                      }}
                      className="p-button-outlined p-button-sm p-button-secondary"
                    />
                  </div>
                  <div className="p-2" style={{ height: '360px', overflow: 'auto' }}>
                    <Editor
                      value={formData.content}
                      onValueChange={(value: string) => setFormData({ ...formData, content: value })}
                      highlight={(code: string) => {
                        try {
                          return Prism.highlight(code, Prism.languages.markup, 'markup');
                        } catch {
                          return code;
                        }
                      }}
                      padding={10}
                      style={{
                        fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
                        fontSize: 14,
                        backgroundColor: colors.bgPrimary,
                        color: colors.textPrimary,
                        minHeight: '350px',
                        height: 'auto',
                        overflow: 'visible',
                        border: `1px solid ${colors.borderPrimary}`,
                        borderRadius: '4px',
                      }}
                      className="html-editor"
                      placeholder={t.cmsadminpanel402}
                    />
                  </div>
                </div>
              </TabPanel>
            </TabView>
          </div>

          {/* Active Status */}
          <div className="field">
            <div
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
              style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}
              onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
            >
              <Checkbox
                inputId="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: !!e.checked })}
              />
              <div className="text-sm font-medium select-none" style={{ color: colors.textPrimary }}>
                {formData.is_active ? '✅' : '⬜'} Active (visible to visitors)
              </div>
            </div>
            <small className="mt-2 block" style={{ color: colors.textMuted }}>
              When checked, this page will be visible to all visitors
            </small>
          </div>

          {/* Popup Settings Section */}
          <div className="field mt-4">
            <label className="block text-sm font-medium mb-3" style={{ color: colors.textPrimary }}>
              Popup Settings
            </label>
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
              {/* Popup on Landingpage */}
              <div
                className="flex items-center gap-3 p-2 rounded cursor-pointer transition-colors hover:opacity-80 mb-3"
                onClick={() => setFormData({ ...formData, popup_on_landingpage: !formData.popup_on_landingpage })}
              >
                <Checkbox
                  inputId="popup_on_landingpage"
                  checked={formData.popup_on_landingpage}
                  onChange={(e) => setFormData({ ...formData, popup_on_landingpage: !!e.checked })}
                />
                <div className="text-sm font-medium select-none" style={{ color: colors.textPrimary }}>
                  {formData.popup_on_landingpage ? '🏠' : '⬜'} Show as Popup on Lobby (Landing Page)
                </div>
                {formData.popup_on_landingpage && (
                  <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}>
                    Lobby
                  </span>
                )}
              </div>

              {/* Popup on App */}
              <div
                className="flex items-center gap-3 p-2 rounded cursor-pointer transition-colors hover:opacity-80 mb-4"
                onClick={() => setFormData({ ...formData, popup_on_app: !formData.popup_on_app })}
              >
                <Checkbox
                  inputId="popup_on_app"
                  checked={formData.popup_on_app}
                  onChange={(e) => setFormData({ ...formData, popup_on_app: !!e.checked })}
                />
                <div className="text-sm font-medium select-none" style={{ color: colors.textPrimary }}>
                  {formData.popup_on_app ? '📱' : '⬜'} Show as Popup in App
                </div>
                {formData.popup_on_app && (
                  <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#8b5cf6', color: '#ffffff' }}>
                    App
                  </span>
                )}
              </div>

              {/* Priority and Version (only show if popup is enabled) */}
              {(formData.popup_on_landingpage || formData.popup_on_app) && (
                <div className="grid grid-cols-2 gap-4 pt-3" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                  {/* Priority */}
                  <div>
                    <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>
                      Priority (1 = highest)
                    </label>
                    <InputNumber
                      value={formData.popup_priority}
                      onValueChange={(e) => setFormData({ ...formData, popup_priority: e.value || 99 })}
                      min={1}
                      max={999}
                      className="w-full"
                    />
                    <small className="mt-1 block" style={{ color: colors.textMuted }}>
                      1 = Cookie/Privacy (always first), 2 = Welcome, etc.
                    </small>
                  </div>

                  {/* Version */}
                  <div>
                    <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>
                      Version (for "Update" badge)
                    </label>
                    <InputNumber
                      value={formData.popup_version}
                      onValueChange={(e) => setFormData({ ...formData, popup_version: e.value || 1 })}
                      min={1}
                      className="w-full"
                    />
                    <small className="mt-1 block" style={{ color: colors.textMuted }}>
                      Increase to show popup again with "Update" badge
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Dialog>
      
      {/* Custom CSS for HTML Editor */}
      <style>{`
        .html-editor textarea {
          min-height: 350px !important;
          height: auto !important;
          overflow-y: hidden !important;
          resize: none !important;
          background: transparent !important;
          color: transparent !important;
          caret-color: ${colors.textPrimary} !important;
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        .html-editor textarea:focus {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        .html-editor pre {
          min-height: 350px !important;
          height: auto !important;
          overflow-y: visible !important;
        }
        .html-editor {
          overflow: hidden !important;
          background: ${colors.bgPrimary} !important;
        }
        .html-editor > textarea,
        .html-editor > pre {
          background: transparent !important;
        }
      `}</style>
    </div>
  );
}

// Helper function to format HTML
function formatHTML(html: string): string {
  if (!html) return '';
  
  try {
    // Create a temporary div element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html.trim();
    
    // Format the HTML with proper indentation
    return formatNode(tempDiv, 0);
  } catch {
    // If formatting fails, return original HTML
    return html;
  }
}

// Recursive function to format DOM nodes with indentation
function formatNode(node: Node, indent: number): string {
  const indentStr = '  '.repeat(indent);
  let result = '';
  
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    if (text) {
      result += text;
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const tagName = element.tagName.toLowerCase();
    
    // Start opening tag
    result += `${indentStr}<${tagName}`;
    
    // Add attributes
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      result += ` ${attr.name}="${attr.value}"`;
    }
    
    // Check if element has children
    if (element.childNodes.length === 0) {
      // Self-closing tag
      result += ` />\n`;
    } else {
      result += `>\n`;
      
      // Add child nodes
      for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
        
        // Special handling for pre and code tags - preserve whitespace
        if (element.tagName.toLowerCase() === 'pre' ||
            element.tagName.toLowerCase() === 'code' ||
            element.tagName.toLowerCase() === 'script' ||
            element.tagName.toLowerCase() === 'style') {
          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent || '';
            result += `${indentStr}  ${text}`;
          } else {
            result += formatNode(child, indent + 1);
          }
        } else {
          result += formatNode(child, indent + 1);
        }
      }
      
      // Closing tag
      result += `${indentStr}</${tagName}>\n`;
    }
  }
  
  return result;
}
