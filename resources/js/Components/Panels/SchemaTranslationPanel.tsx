import React, { useState, useEffect } from 'react';
import { Tree, Input, message, Tag } from 'antd';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { FileUpload } from 'primereact/fileupload';
import { api } from '@/lib/api';
import { useProject } from '@/contexts/ProjectContext';
import type { DataNode } from 'antd/es/tree';

interface SchemaTranslation {
  id: number;
  item_name: string;
  code: string;
  translated_text: string;
  description?: string;
  is_active: boolean;
}

interface Language {
  id: number;
  code: string;
  name: string;
  native_name: string;
  flag?: string;
  is_active: boolean;
}

interface SchemaTable {
  table_name: string;
  comment?: string;
  schema_name?: string;
  fields: SchemaField[];
}

interface SchemaField {
  field_name: string;
  field_type: string;
  comment?: string;
}

export default function SchemaTranslationPanel() {
  const { selectedProject } = useProject();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [schemaStructure, setSchemaStructure] = useState<SchemaTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedItemTranslations, setSelectedItemTranslations] = useState<Record<string, string>>({});

  // Export/Import
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedLanguagesForExport, setSelectedLanguagesForExport] = useState<string[]>([]);
  const [selectedLanguagesForImport, setSelectedLanguagesForImport] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showAutoTranslateDialog, setShowAutoTranslateDialog] = useState(false);
  const [sourceLanguageForTranslate, setSourceLanguageForTranslate] = useState('de');
  const [targetLanguagesForTranslate, setTargetLanguagesForTranslate] = useState<string[]>([]);
  const [translateAllItems, setTranslateAllItems] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });
  const [estimatedCharCount, setEstimatedCharCount] = useState(0);
  const [autoSaving, setAutoSaving] = useState(false);
  const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Custom dark mode CSS for Ant Design components
  const darkModeStyles = `
    /* Tree styling */
    .ant-tree {
      background: #374151 !important;
      color: #f9fafb !important;
    }
    .ant-tree .ant-tree-node-content-wrapper {
      color: #f9fafb !important;
    }
    .ant-tree .ant-tree-node-content-wrapper:hover {
      background: #1f2937 !important;
    }
    .ant-tree .ant-tree-node-selected .ant-tree-node-content-wrapper,
    .ant-tree .ant-tree-node-selected .ant-tree-node-content-wrapper:hover,
    .ant-tree-focused .ant-tree-node-selected .ant-tree-node-content-wrapper,
    .ant-tree .ant-tree-treenode-selected .ant-tree-node-content-wrapper {
      background: #1e3a8a !important;
      color: #f9fafb !important;
    }
    .ant-tree .ant-tree-treenode {
      color: #f9fafb !important;
    }

    /* Tabs styling */
    .ant-tabs .ant-tabs-tab {
      color: #f9fafb !important;
    }
    .ant-tabs .ant-tabs-tab-active {
      color: #2563eb !important;
    }
    .ant-tabs .ant-tabs-ink-bar {
      background: #2563eb !important;
    }
    .ant-tabs .ant-tabs-content {
      color: #f9fafb !important;
    }

    /* Input styling */
    .ant-input {
      background: #1f2937 !important;
      border-color: #4b5563 !important;
      color: #f9fafb !important;
    }
    .ant-input:focus {
      border-color: #2563eb !important;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
    }
  `;

  useEffect(() => {
    // Inject dark mode styles
    const styleElement = document.createElement('style');
    styleElement.textContent = darkModeStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, [darkModeStyles]);

  const fetchLanguages = async () => {
    try {
      const response = await api.request('/active-languages');
      setLanguages(response);
      // Pre-select all languages for export and import
      const allCodes = response.map((lang: Language) => lang.code);
      setSelectedLanguagesForExport(allCodes);
      setSelectedLanguagesForImport(allCodes);
      // Pre-select all except source language for auto-translate
      setTargetLanguagesForTranslate(allCodes.filter((code: string) => code !== 'de'));
    } catch (error: any) {
      message.error('Failed to load languages: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchSchemaStructure = React.useCallback(async () => {
    if (!selectedProject) {
      setSchemaStructure([]);
      return;
    }

    try {
      setLoading(true);
      const response = await api.request(`/schema-available-items?project_id=${selectedProject.id}`);

      if (response.tables && Array.isArray(response.tables)) {
        setSchemaStructure(response.tables);
      } else {
        setSchemaStructure([]);
      }
    } catch (error: any) {
      message.error('Failed to load schema structure: ' + (error.response?.data?.message || error.message));
      setSchemaStructure([]);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  const fetchTranslationsForItem = async (itemName: string) => {
    try {
      const response = await api.request(`/schema-translations/item/${encodeURIComponent(itemName)}`);
      const translationsMap: Record<string, string> = {};

      if (response.translations) {
        Object.values(response.translations).forEach((translation: any) => {
          translationsMap[translation.code] = translation.translated_text;
        });
      }

      setSelectedItemTranslations(translationsMap);
    } catch {
      // Item has no translations yet, that's okay
      setSelectedItemTranslations({});
    }
  };

  useEffect(() => {
    fetchLanguages();
    fetchSchemaStructure();
  }, [selectedProject, fetchSchemaStructure]);

  useEffect(() => {
    if (selectedItem) {
      fetchTranslationsForItem(selectedItem);
    }
  }, [selectedItem]);

  const buildTreeData = (): DataNode[] => {
    return schemaStructure.map(table => ({
      title: (
        <div className="flex items-center gap-2">
          <span className="text-blue-300">📁</span>
          <span className="font-mono">{table.table_name}</span>
          {table.schema_name && (
            <Tag color="purple">{table.schema_name}</Tag>
          )}
          {table.comment && (
            <Tag color="blue">{table.comment}</Tag>
          )}
        </div>
      ),
      key: table.table_name,
      children: table.fields.map(field => ({
        title: (
          <div className="flex items-center gap-2">
            <span className="text-green-300">📄</span>
            <span className="font-mono text-sm">{field.field_name}</span>
            <Tag color="green">{field.field_type}</Tag>
            {field.comment && (
              <Tag color="orange">{field.comment}</Tag>
            )}
          </div>
        ),
        key: `${table.table_name}.${field.field_name}`,
        isLeaf: true
      }))
    }));
  };

  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    const key = selectedKeys[0] as string;
    setSelectedItem(key || null);
  };

  // Auto-save with debouncing
  const handleTranslationChange = (languageCode: string, value: string) => {
    // Update state immediately
    setSelectedItemTranslations(prev => ({
      ...prev,
      [languageCode]: value
    }));

    // Clear existing timeout
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }

    // Set new timeout to save after 1 second of inactivity
    const newTimeoutId = setTimeout(async () => {
      if (!selectedItem) return;

      setAutoSaving(true);
      try {
        // Use the updated state
        const translationsToSave = Object.entries({
          ...selectedItemTranslations,
          [languageCode]: value
        })
          .filter(([, text]) => text.trim() !== '')
          .map(([code, text]) => ({
            code,
            translated_text: text.trim()
          }));

        if (translationsToSave.length > 0) {
          await api.request('/schema-translations/bulk-update', {
            method: 'POST',
            body: JSON.stringify({
              item_name: selectedItem,
              translations: translationsToSave
            })
          });
        }
      } catch {
        // Silent fail - user is typing
      } finally {
        setAutoSaving(false);
      }
    }, 1000); // 1 second debounce

    setSaveTimeoutId(newTimeoutId);
  };

  const handleExportTranslations = async () => {
    if (!selectedProject || selectedLanguagesForExport.length === 0) {
      message.error('Please select at least one language');
      return;
    }

    setExporting(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const languagesParam = selectedLanguagesForExport.map(lang => `languages[]=${lang}`).join('&');
      const url = `/api/translations/export?project_id=${selectedProject.id}&${languagesParam}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export translations');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `translations_${selectedProject.name}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setShowExportDialog(false);
      message.success('Translations exported successfully');
    } catch (error: any) {
      message.error('Failed to export: ' + (error.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (event: any) => {
    const file = event.files[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleConfirmImport = async () => {
    if (!importFile || !selectedProject || selectedLanguagesForImport.length === 0) {
      message.error('Please select a file and at least one language');
      return;
    }

    setImporting(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('project_id', selectedProject.id.toString());

      // Add selected languages
      selectedLanguagesForImport.forEach(lang => {
        formData.append('languages[]', lang);
      });

      const response = await fetch('/api/translations/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import translations');
      }

      const result = await response.json();
      setShowImportDialog(false);
      setImportFile(null);
      message.success(`Successfully imported ${result.imported_count} translations (${result.updated_count} updated, ${result.created_count} created)`);

      // Refresh current item translations if an item is selected
      if (selectedItem) {
        fetchTranslationsForItem(selectedItem);
      }
    } catch (error: any) {
      message.error('Failed to import: ' + (error.message || 'Unknown error'));
    } finally {
      setImporting(false);
    }
  };

  const handleAutoTranslate = async () => {
    if (!selectedProject) {
      message.error('No project selected');
      return;
    }

    // Calculate estimated character count for all items if needed
    if (translateAllItems) {
      await calculateEstimatedCharCount();
    }

    // Open the auto-translate dialog
    setShowAutoTranslateDialog(true);
  };

  const calculateEstimatedCharCount = async () => {
    let totalChars = 0;
    let itemCount = 0;

    // Go through all tables and fields
    for (const table of schemaStructure) {
      // Check saved translations from DB
      const tableTranslations = await fetchTranslationsForItemDirect(table.table_name);

      // Also check if this is the currently selected item with unsaved translations
      const isCurrentItem = selectedItem === table.table_name;
      const currentTranslation = isCurrentItem ? selectedItemTranslations[sourceLanguageForTranslate] : null;

      const sourceText = currentTranslation || tableTranslations[sourceLanguageForTranslate];

      if (sourceText?.trim()) {
        totalChars += sourceText.length;
        itemCount++;
      }

      for (const field of table.fields) {
        const fieldName = `${table.table_name}.${field.field_name}`;
        const fieldTranslations = await fetchTranslationsForItemDirect(fieldName);

        // Also check if this is the currently selected item with unsaved translations
        const isCurrentFieldItem = selectedItem === fieldName;
        const currentFieldTranslation = isCurrentFieldItem ? selectedItemTranslations[sourceLanguageForTranslate] : null;

        const fieldSourceText = currentFieldTranslation || fieldTranslations[sourceLanguageForTranslate];

        if (fieldSourceText?.trim()) {
          totalChars += fieldSourceText.length;
          itemCount++;
        }
      }
    }

    setEstimatedCharCount(totalChars);

    // Show info message if items found
    if (itemCount > 0) {
      message.info(`Found ${itemCount} items with ${sourceLanguageForTranslate.toUpperCase()} translation (${totalChars} chars total)`, 2);
    } else {
      message.warning(`No items found with ${sourceLanguageForTranslate.toUpperCase()} translation. Please add translations first.`, 3);
    }
  };

  const handleConfirmAutoTranslate = async () => {
    if (!selectedProject) return;

    if (targetLanguagesForTranslate.length === 0) {
      message.error('Please select at least one target language');
      return;
    }

    setShowAutoTranslateDialog(false);
    setTranslating(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      if (translateAllItems) {
        // Translate ALL items that have source language
        await translateAllSchemaItems(token);
      } else {
        // Translate single selected item
        if (!selectedItem) return;

        const sourceText = selectedItemTranslations[sourceLanguageForTranslate];

        if (!sourceText || sourceText.trim() === '') {
          message.error(`Please enter a translation for ${sourceLanguageForTranslate.toUpperCase()} first, or select a different source language.`);
          setTranslating(false);
          return;
        }

        await translateSingleItem(token, selectedItem, sourceText);
      }

    } catch (error: any) {
      message.error('Auto-translate failed: ' + (error.message || 'Unknown error'));
    } finally {
      setTranslating(false);
      setTranslationProgress({ current: 0, total: 0 });
    }
  };

  const translateSingleItem = async (token: string, itemName: string, sourceText: string) => {
    const response = await fetch('/api/translations/auto-translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        project_id: selectedProject!.id,
        text: sourceText,
        source_language: sourceLanguageForTranslate,
        target_languages: targetLanguagesForTranslate
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Translation failed');
    }

    const result = await response.json();

    // Fill in the translations (keep existing source language)
    const newTranslations: Record<string, string> = { ...selectedItemTranslations };
    result.translations.forEach((translation: any) => {
      newTranslations[translation.language] = translation.text;
    });

    setSelectedItemTranslations(newTranslations);
    message.success(`Translated from ${sourceLanguageForTranslate.toUpperCase()} to ${targetLanguagesForTranslate.length} languages. Review and save when ready.`);
  };

  const translateAllSchemaItems = async (token: string) => {
    // Get all items (tables + fields) that have source language translation
    const itemsToTranslate: Array<{ itemName: string; sourceText: string }> = [];

    // Collect all tables
    for (const table of schemaStructure) {
      const tableTranslations = await fetchTranslationsForItemDirect(table.table_name);
      if (tableTranslations[sourceLanguageForTranslate]?.trim()) {
        itemsToTranslate.push({
          itemName: table.table_name,
          sourceText: tableTranslations[sourceLanguageForTranslate]
        });
      }

      // Collect all fields for this table
      for (const field of table.fields) {
        const fieldName = `${table.table_name}.${field.field_name}`;
        const fieldTranslations = await fetchTranslationsForItemDirect(fieldName);
        if (fieldTranslations[sourceLanguageForTranslate]?.trim()) {
          itemsToTranslate.push({
            itemName: fieldName,
            sourceText: fieldTranslations[sourceLanguageForTranslate]
          });
        }
      }
    }

    if (itemsToTranslate.length === 0) {
      message.warning(`No items found with ${sourceLanguageForTranslate.toUpperCase()} translation`);
      return;
    }

    setTranslationProgress({ current: 0, total: itemsToTranslate.length });

    let successCount = 0;
    let errorCount = 0;

    // Translate each item
    for (let i = 0; i < itemsToTranslate.length; i++) {
      const item = itemsToTranslate[i];
      setTranslationProgress({ current: i + 1, total: itemsToTranslate.length });

      try {
        const response = await fetch('/api/translations/auto-translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            project_id: selectedProject!.id,
            text: item.sourceText,
            source_language: sourceLanguageForTranslate,
            target_languages: targetLanguagesForTranslate
          }),
        });

        if (response.ok) {
          const result = await response.json();

          // Save translations immediately
          const translationsToSave = result.translations.map((t: any) => ({
            code: t.language,
            translated_text: t.text
          }));

          await api.request('/schema-translations/bulk-update', {
            method: 'POST',
            body: JSON.stringify({
              item_name: item.itemName,
              translations: translationsToSave
            })
          });

          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    message.success(`Translated ${successCount} items from ${sourceLanguageForTranslate.toUpperCase()} to ${targetLanguagesForTranslate.length} languages! ${errorCount > 0 ? `(${errorCount} failed)` : ''}`);

    // Refresh current item if selected
    if (selectedItem) {
      fetchTranslationsForItem(selectedItem);
    }
  };

  const fetchTranslationsForItemDirect = async (itemName: string): Promise<Record<string, string>> => {
    try {
      const response = await api.request(`/schema-translations/item/${encodeURIComponent(itemName)}`);
      const translations: Record<string, string> = {};

      // Handle both array and object with translations property
      const translationsArray = Array.isArray(response) ? response : (response.translations || []);

      if (Array.isArray(translationsArray)) {
        translationsArray.forEach((translation: SchemaTranslation) => {
          translations[translation.code] = translation.translated_text;
        });
      } else if (typeof translationsArray === 'object') {
        // Handle object format
        Object.values(translationsArray).forEach((translation: any) => {
          translations[translation.code] = translation.translated_text;
        });
      }

      return translations;
    } catch {
      return {};
    }
  };

  const getItemTypeInfo = (itemName: string) => {
    const isTable = !itemName.includes('.');
    if (isTable) {
      return {
        type: 'Table',
        icon: '📁',
        color: 'blue',
        displayName: itemName
      };
    } else {
      const [tableName, fieldName] = itemName.split('.');
      return {
        type: 'Field',
        icon: '📄',
        color: 'green',
        displayName: `${tableName}.${fieldName}`
      };
    }
  };

  const renderTranslationDetail = () => {
    if (!selectedItem) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="text-lg font-semibold mb-2">Select an item to translate</h3>
            <p>Choose a table or field from the schema tree to manage its translations</p>
          </div>
        </div>
      );
    }

    const itemInfo = getItemTypeInfo(selectedItem);

    return (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 p-4 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{itemInfo.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">{itemInfo.displayName}</h3>
                  <Tag color={itemInfo.color}>{itemInfo.type}</Tag>
                </div>
                <p className="text-sm text-gray-400">Manage translations for this {itemInfo.type.toLowerCase()}</p>
              </div>
            </div>
            {autoSaving && (
              <div className="flex items-center gap-2 text-green-400">
                <i className="pi pi-spin pi-spinner"></i>
                <span className="text-sm">Auto-saving...</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-4 overflow-auto">
          <div className="grid gap-4">
            {languages.map(language => (
              <div key={language.code} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{language.flag || '🏴'}</span>
                  <div>
                    <h4 className="font-semibold text-white">{language.name}</h4>
                    <p className="text-sm text-gray-400">{language.native_name}</p>
                  </div>
                  <Tag color="blue">{language.code.toUpperCase()}</Tag>
                </div>
                <Input
                  placeholder={`Enter ${language.name} translation...`}
                  value={selectedItemTranslations[language.code] || ''}
                  onChange={(e) => handleTranslationChange(language.code, e.target.value)}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 text-gray-100">
      <div className="flex-shrink-0 p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Schema Translation Manager
            </h3>
            <p className="text-sm text-gray-300">
              Translate database table and field names for internationalization
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              icon="pi pi-download"
              label="Export"
              size="small"
              severity="success"
              outlined
              onClick={() => setShowExportDialog(true)}
              disabled={!selectedProject || exporting}
            />
            <Button
              icon="pi pi-upload"
              label="Import"
              size="small"
              severity="info"
              outlined
              onClick={() => setShowImportDialog(true)}
              disabled={!selectedProject || importing}
            />
            <Button
              icon="pi pi-google"
              label="Auto-Translate"
              size="small"
              severity="warning"
              outlined
              onClick={handleAutoTranslate}
              disabled={!selectedProject || translating}
              loading={translating}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Schema Tree */}
        <div className="w-80 flex-shrink-0 border-r border-gray-600 bg-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-600 flex-shrink-0">
            <h4 className="font-semibold text-white mb-2">Database Schema</h4>
            <p className="text-sm text-gray-400">Select tables and fields to translate</p>
            {selectedProject && (
              <p className="text-xs text-blue-300 mt-1">Project: {selectedProject.name}</p>
            )}
          </div>
          <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
            {!selectedProject ? (
              <div className="text-center text-gray-400 mt-8">
                <div className="text-2xl mb-2">📋</div>
                <p>Please select a project first</p>
              </div>
            ) : loading ? (
              <div className="text-center text-gray-400">Loading schema...</div>
            ) : schemaStructure.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <div className="text-2xl mb-2">📭</div>
                <p>No schema tables found</p>
                <p className="text-xs mt-1">This project has no schema data to translate</p>
              </div>
            ) : (
              <Tree
                treeData={buildTreeData()}
                onSelect={handleTreeSelect}
                selectedKeys={selectedItem ? [selectedItem] : []}
                defaultExpandAll
                className="bg-transparent"
              />
            )}
          </div>
        </div>

        {/* Right Panel - Translation Detail */}
        <div className="flex-1 bg-gray-800">
          {renderTranslationDetail()}
        </div>
      </div>

      {/* Export Dialog */}
      <Dialog
        header="Export Translations to Excel"
        visible={showExportDialog}
        onHide={() => setShowExportDialog(false)}
        style={{ width: '500px' }}
        modal
        closable
        draggable={false}
        resizable={false}
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-1">
              Export for {selectedProject?.name}
            </h4>
            <p className="text-sm text-blue-600">
              Select languages to include in the Excel export. The export will contain all tables and fields from linked databases.
            </p>
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Languages *
            </label>
            <MultiSelect
              value={selectedLanguagesForExport}
              onChange={(e) => setSelectedLanguagesForExport(e.value)}
              options={languages.map(lang => ({ label: `${lang.name} (${lang.code.toUpperCase()})`, value: lang.code }))}
              placeholder="Select languages to export"
              className="w-full"
              disabled={exporting}
              display="chip"
            />
            <small className="text-gray-600">
              Select one or more languages for the translation export
            </small>
          </div>

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowExportDialog(false)}
              className="p-button-text"
              disabled={exporting}
            />
            <Button
              label={exporting ? "Exporting..." : "Export to Excel"}
              icon={exporting ? "pi pi-spinner pi-spin" : "pi pi-download"}
              onClick={handleExportTranslations}
              disabled={exporting || selectedLanguagesForExport.length === 0}
              severity="success"
            />
          </div>
        </div>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        header="Import Translations from Excel"
        visible={showImportDialog}
        onHide={() => {
          setShowImportDialog(false);
          setImportFile(null);
        }}
        style={{ width: '500px' }}
        modal
        closable
        draggable={false}
        resizable={false}
      >
        <div className="space-y-4">
          <div className="p-3 bg-green-50 rounded border border-green-200">
            <h4 className="font-medium text-green-800 mb-1">
              Import for {selectedProject?.name}
            </h4>
            <p className="text-sm text-green-600">
              Upload an Excel file with translations. Select which languages to import.
            </p>
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Excel File *
            </label>
            <FileUpload
              mode="basic"
              name="file"
              accept=".xlsx,.xls"
              maxFileSize={10000000}
              customUpload
              uploadHandler={handleFileSelect}
              auto={false}
              chooseLabel={importFile ? importFile.name : "Choose Excel File"}
              disabled={importing}
            />
            <small className="text-gray-600">
              Excel files only (.xlsx, .xls), max 10MB
            </small>
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Languages to Import *
            </label>
            <MultiSelect
              value={selectedLanguagesForImport}
              onChange={(e) => setSelectedLanguagesForImport(e.value)}
              options={languages.map(lang => ({ label: `${lang.name} (${lang.code.toUpperCase()})`, value: lang.code }))}
              placeholder="Select languages to import"
              className="w-full"
              disabled={importing}
              display="chip"
            />
            <small className="text-gray-600">
              Only selected languages will be imported from the Excel file
            </small>
          </div>

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => {
                setShowImportDialog(false);
                setImportFile(null);
              }}
              className="p-button-text"
              disabled={importing}
            />
            <Button
              label={importing ? "Importing..." : "Import Translations"}
              icon={importing ? "pi pi-spinner pi-spin" : "pi pi-upload"}
              onClick={handleConfirmImport}
              disabled={importing || !importFile || selectedLanguagesForImport.length === 0}
              severity="info"
            />
          </div>
        </div>
      </Dialog>

      {/* Auto-Translate Dialog */}
      <Dialog
        header="Auto-Translate with Google Translate"
        visible={showAutoTranslateDialog}
        onHide={() => {
          setShowAutoTranslateDialog(false);
          setTranslateAllItems(false);
        }}
        style={{ width: '550px' }}
        modal
        closable={!translating}
        draggable={false}
        resizable={false}
      >
        <div className="space-y-4">
          <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-1">
              {translateAllItems ? 'Translate All Items' : (selectedItem ? `Translate "${selectedItem}"` : 'Auto-Translate')}
            </h4>
            <p className="text-sm text-yellow-600">
              {translateAllItems
                ? 'All tables and fields with the source language will be translated automatically.'
                : 'Select the source language (must already be filled in) and target languages for translation.'
              }
            </p>
          </div>

          <div className="field">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="translateAll"
                checked={translateAllItems}
                onChange={async (e) => {
                  setTranslateAllItems(e.target.checked);
                  if (e.target.checked) {
                    await calculateEstimatedCharCount();
                  } else {
                    setEstimatedCharCount(0);
                  }
                }}
                className="w-4 h-4"
                disabled={translating}
              />
              <label htmlFor="translateAll" className="text-sm font-medium text-gray-700 cursor-pointer">
                🚀 Translate all tables and fields
              </label>
            </div>
            <small className="text-gray-600 ml-6">
              Automatically translates all items that have the source language
            </small>
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Language *
            </label>
            <Dropdown
              value={sourceLanguageForTranslate}
              onChange={(e) => {
                setSourceLanguageForTranslate(e.value);
                // Remove source from targets
                setTargetLanguagesForTranslate(
                  languages
                    .map(l => l.code)
                    .filter(code => code !== e.value)
                );
              }}
              options={languages.map(lang => ({
                label: `${lang.name} (${lang.code.toUpperCase()})${selectedItemTranslations[lang.code] ? ' ✓' : ''}`,
                value: lang.code
              }))}
              className="w-full"
            />
            <small className="text-gray-600">
              The language to translate FROM (must already have a translation)
            </small>
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Languages *
            </label>
            <MultiSelect
              value={targetLanguagesForTranslate}
              onChange={(e) => setTargetLanguagesForTranslate(e.value)}
              options={languages
                .filter(lang => lang.code !== sourceLanguageForTranslate)
                .map(lang => ({ label: `${lang.name} (${lang.code.toUpperCase()})`, value: lang.code }))}
              placeholder="Select target languages"
              className="w-full"
              display="chip"
            />
            <small className="text-gray-600">
              Languages to translate TO
            </small>
          </div>

          {translating && translationProgress.total > 0 && (
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <p className="text-sm text-green-700 font-medium">
                ⏳ Translating {translationProgress.current} of {translationProgress.total} items...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(translationProgress.current / translationProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {!translating && (
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-blue-700">
                {translateAllItems ? (
                  <>
                    📊 Estimated cost: ~${((estimatedCharCount * targetLanguagesForTranslate.length) / 1000000 * 20).toFixed(3)}
                    <br />
                    <span className="text-xs">
                      ({estimatedCharCount} chars × {targetLanguagesForTranslate.length} languages = {estimatedCharCount * targetLanguagesForTranslate.length} total chars)
                    </span>
                  </>
                ) : (
                  <>
                    📊 Estimated cost: ~$0.00{Math.max(1, targetLanguagesForTranslate.length * 2)}
                    ({(selectedItemTranslations[sourceLanguageForTranslate]?.length || 0) * targetLanguagesForTranslate.length} characters)
                  </>
                )}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => {
                setShowAutoTranslateDialog(false);
                setTranslateAllItems(false);
              }}
              className="p-button-text"
              disabled={translating}
            />
            <Button
              label={translating ? "Translating..." : "Translate Now"}
              icon={translating ? "pi pi-spinner pi-spin" : "pi pi-google"}
              onClick={handleConfirmAutoTranslate}
              disabled={
                translating ||
                targetLanguagesForTranslate.length === 0 ||
                (!translateAllItems && (!selectedItem || !selectedItemTranslations[sourceLanguageForTranslate]))
              }
              severity="warning"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}