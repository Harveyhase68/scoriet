import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
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

interface Page {
  id: number;
  slug: string;
  locale: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PageFormData {
  slug: string;
  locale: string;
  title: string;
  content: string;
  is_active: boolean;
}

export default function CMSAdminPanel() {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

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
  });
  const [saving, setSaving] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

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

  const handleCreateNew = () => {
    setEditingPage(null);
    setFormData({
      slug: '',
      locale: 'en',
      title: '',
      content: '',
      is_active: true,
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
    return (
      <span className={`px-2 py-1 rounded text-xs ${rowData.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
        {rowData.is_active ? t.templatesStatusActive : t.manageteammodal328}
      </span>
    );
  };

  if (loading && pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-800">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-800 text-gray-100 overflow-auto">
      <ConfirmDialog />

      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-semibold text-white mb-2">
              📝 CMS Page Management
            </h3>
            <p className="text-sm text-gray-300">
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
        onHide={() => setShowDialog(false)}
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
            <label htmlFor="slug" className="block text-sm font-medium mb-2">
              Slug *
            </label>
            <InputText
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder={t.cmsadminpanel298}
              className="w-full"
              disabled={!!editingPage}
            />
            <small className="text-gray-400">
              URL-friendly identifier (cannot be changed after creation)
            </small>
          </div>

          {/* Language */}
          <div className="field">
            <label htmlFor="locale" className="block text-sm font-medium mb-2">
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
            <small className="text-gray-400">
              Cannot be changed after creation
            </small>
          </div>

          {/* Title */}
          <div className="field">
            <label htmlFor="title" className="block text-sm font-medium mb-2">
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
            <label className="block text-sm font-medium mb-2">
              Content *
            </label>
            <TabView
              activeIndex={activeTabIndex}
              onTabChange={(e: any) => setActiveTabIndex(e.index)}
              className="w-full"
            >
              {/* Tab 1: WYSIWYG Editor */}
              <TabPanel header="WYSIWYG Editor" className="text-gray-100 p-0">
                <PrimeEditor
                  value={formData.content}
                  onTextChange={(e: any) => setFormData({ ...formData, content: e.htmlValue || '' })}
                  style={{ height: '400px' }}
                />
              </TabPanel>

              {/* Tab 2: HTML Source Editor with Syntax Highlighting */}
              <TabPanel header={t.cmsadminpanel360} className="text-gray-100 p-0">
                <div className="h-full bg-gray-900 border border-gray-600 rounded">
                  <div className="flex justify-between items-center p-2 border-b border-gray-600 bg-gray-800">
                    <span className="text-sm text-gray-400">HTML Quellcode mit Syntax-Highlighting</span>
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
                        fontFamily: 't.debugmanualgeneratorpanel51, "Consolas", "Monaco", t.debugmanualgeneratorpanel1739, monospace',
                        fontSize: 14,
                        backgroundColor: '#1a1a1a',
                        color: '#d4d4d4',
                        minHeight: '350px',
                        height: 'auto',
                        overflow: 'visible',
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
              className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
            >
              <Checkbox
                inputId="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: !!e.checked })}
                binary
                readOnly
              />
              <div className="text-sm font-medium text-gray-100 select-none">
                {formData.is_active ? '✅' : '⬜'} Active (visible to visitors)
              </div>
            </div>
            <small className="text-gray-400 mt-2 block">
              When checked, this page will be visible to all visitors
            </small>
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
        }
        .html-editor pre {
          min-height: 350px !important;
          height: auto !important;
          overflow-y: visible !important;
        }
        .html-editor {
          overflow: hidden !important;
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
