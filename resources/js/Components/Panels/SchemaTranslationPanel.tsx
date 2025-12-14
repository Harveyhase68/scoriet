import React, { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { FileUpload } from 'primereact/fileupload';
import { Tree, TreeNode } from 'primereact/tree';
import { InputText } from 'primereact/inputtext';
import { api } from '@/lib/api';
import { useProject } from '@/contexts/ProjectContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

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
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();
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

  // Tree expansion state
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  // Sidebar resize state
  const [sidebarWidth, setSidebarWidth] = useState(400); // Default 400px instead of 320px
  const [isResizing, setIsResizing] = useState(false);


  const fetchLanguages = React.useCallback(async () => {
    try {
      // First, get all active languages
      const allLanguages = await api.request('/active-languages');

      // Filter to only show languages enabled for the selected project
      let projectLanguages = allLanguages;
      if (selectedProject?.enabled_languages && Array.isArray(selectedProject.enabled_languages)) {
        // Only show languages that are enabled for this project
        projectLanguages = allLanguages.filter((lang: Language) =>
          selectedProject.enabled_languages.includes(lang.code)
        );
      }

      setLanguages(projectLanguages);

      // Pre-select all project languages for export and import
      const allCodes = projectLanguages.map((lang: Language) => lang.code);
      setSelectedLanguagesForExport(allCodes);
      setSelectedLanguagesForImport(allCodes);

      // Pre-select all except source language for auto-translate
      setTargetLanguagesForTranslate(allCodes.filter((code: string) => code !== 'de'));
    } catch (error: any) {
      toast.showError('Failed to load languages: ' + (error.response?.data?.message || error.message));
    }
  }, [selectedProject, toast]);

  const fetchSchemaStructure = React.useCallback(async () => {
    if (!selectedProject) {
      setSchemaStructure([]);
      setExpandedKeys({});
      return;
    }

    try {
      setLoading(true);
      const response = await api.request(`/schema-available-items?project_id=${selectedProject.id}`);

      if (response.tables && Array.isArray(response.tables)) {
        setSchemaStructure(response.tables);

        // Auto-expand all tables when schema loads
        const allExpanded: Record<string, boolean> = {};
        response.tables.forEach((table: SchemaTable) => {
          allExpanded[table.table_name] = true;
        });
        setExpandedKeys(allExpanded);
      } else {
        setSchemaStructure([]);
        setExpandedKeys({});
      }
    } catch (error: any) {
      toast.showError('Failed to load schema structure: ' + (error.response?.data?.message || error.message));
      setSchemaStructure([]);
      setExpandedKeys({});
    } finally {
      setLoading(false);
    }
  }, [selectedProject, toast]);

  const fetchTranslationsForItem = React.useCallback(async (itemName: string) => {
    try {
      const response = await api.request(`/schema-translations/item/${encodeURIComponent(itemName)}`);
      const translationsMap: Record<string, string> = {};

      // The API returns { item_name: "...", translations: {...} }
      const translationsData = response.translations || {};

      if (Array.isArray(translationsData)) {
        // Array format: [{ code: 'de', translated_text: '...' }, ...]
        translationsData.forEach((translation: any) => {
          if (translation.code && translation.translated_text) {
            translationsMap[translation.code] = translation.translated_text;
          }
        });
      } else if (typeof translationsData === 'object' && translationsData !== null) {
        // Object format: { de: { code: 'de', translated_text: '...' }, en: { ... } }
        Object.entries(translationsData).forEach(([, translation]: [string, any]) => {
          if (translation && translation.code && translation.translated_text) {
            translationsMap[translation.code] = translation.translated_text;
          }
        });
      }

      setSelectedItemTranslations(translationsMap);
    } catch {
      // Item has no translations yet, that's okay
      setSelectedItemTranslations({});
    }
  }, []);

  useEffect(() => {
    fetchLanguages();
    fetchSchemaStructure();
  }, [selectedProject, fetchSchemaStructure, fetchLanguages]);

  useEffect(() => {
    if (selectedItem) {
      fetchTranslationsForItem(selectedItem);
    }
  }, [selectedItem, fetchTranslationsForItem]);

  // Expand/Collapse all functions
  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    schemaStructure.forEach((table) => {
      allExpanded[table.table_name] = true;
    });
    setExpandedKeys(allExpanded);
  };

  const collapseAll = () => {
    setExpandedKeys({});
  };

  const buildTreeData = (): TreeNode[] => {
    return schemaStructure.map(table => ({
      label: (
        <div className="flex items-center gap-2">
          <span className="text-blue-300">📁</span>
          <span className="font-mono">{table.table_name}</span>
          {table.schema_name && (
            <Tag value={table.schema_name} style={{ backgroundColor: '#9333ea', color: 'white' }} />
          )}
          {table.comment && (
            <Tag value={table.comment} severity="info" />
          )}
        </div>
      ),
      key: table.table_name,
      children: table.fields.map(field => ({
        label: (
          <div className="flex items-center gap-2">
            <span className="text-green-300">📄</span>
            <span className="font-mono text-sm">{field.field_name}</span>
            <Tag value={field.field_type} severity="success" />
            {field.comment && (
              <Tag value={field.comment} severity="warning" />
            )}
          </div>
        ),
        key: `${table.table_name}.${field.field_name}`,
        leaf: true
      }))
    }));
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
      toast.showError(t.databasemanagementpanel221);
      return;
    }

    setExporting(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
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
        throw new Error(t.databasemanagementpanel245);
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
      toast.showSuccess(t.databasemanagementpanel259);
    } catch (error: any) {
      toast.showError('Failed to export: ' + (error.message || t.schematranslationpanel319));
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
      toast.showError(t.schematranslationpanel334);
      return;
    }

    setImporting(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
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
        throw new Error(errorData.message || t.databasemanagementpanel294);
      }

      const result = await response.json();
      setShowImportDialog(false);
      setImportFile(null);
      toast.showSuccess(`Successfully imported ${result.imported_count} translations (${result.updated_count} updated, ${result.created_count} created)`);

      // Refresh current item translations if an item is selected
      if (selectedItem) {
        fetchTranslationsForItem(selectedItem);
      }
    } catch (error: any) {
      toast.showError('Failed to import: ' + (error.message || t.schematranslationpanel319));
    } finally {
      setImporting(false);
    }
  };

  const handleAutoTranslate = async () => {
    if (!selectedProject) {
      toast.showError(t.databaseexportmodal344);
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
      toast.showInfo(`Found ${itemCount} items with ${sourceLanguageForTranslate.toUpperCase()} translation (${totalChars} chars total)`, 2);
    } else {
      toast.showWarn(`No items found with ${sourceLanguageForTranslate.toUpperCase()} translation. Please add translations first.`, 3);
    }
  };

  const handleConfirmAutoTranslate = async () => {
    if (!selectedProject) return;

    if (targetLanguagesForTranslate.length === 0) {
      toast.showError(t.schematranslationpanel449);
      return;
    }

    setShowAutoTranslateDialog(false);
    setTranslating(true);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.applicationsmodal66);
      }

      if (translateAllItems) {
        // Translate ALL items that have source language
        await translateAllSchemaItems(token);
      } else {
        // Translate single selected item
        if (!selectedItem) return;

        const sourceText = selectedItemTranslations[sourceLanguageForTranslate];

        if (!sourceText || sourceText.trim() === '') {
          toast.showError(`Please enter a translation for ${sourceLanguageForTranslate.toUpperCase()} first, or select a different source language.`);
          setTranslating(false);
          return;
        }

        await translateSingleItem(token, selectedItem, sourceText);
      }

    } catch (error: any) {
      toast.showError('Auto-translate failed: ' + (error.message || t.schematranslationpanel319));
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
      throw new Error(errorData.message || t.autotranslatecontroller83);
    }

    const result = await response.json();

    // Fill in the translations (keep existing source language)
    const newTranslations: Record<string, string> = { ...selectedItemTranslations };
    result.translations.forEach((translation: any) => {
      newTranslations[translation.language] = translation.text;
    });

    setSelectedItemTranslations(newTranslations);
    toast.showSuccess(`Translated from ${sourceLanguageForTranslate.toUpperCase()} to ${targetLanguagesForTranslate.length} languages. Review and save when ready.`);
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
      toast.showWarn(`No items found with ${sourceLanguageForTranslate.toUpperCase()} translation`);
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

    toast.showSuccess(`Translated ${successCount} items from ${sourceLanguageForTranslate.toUpperCase()} to ${targetLanguagesForTranslate.length} languages! ${errorCount > 0 ? `(${errorCount} failed)` : ''}`);

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
        type: t.translationexportcontroller78,
        icon: '📁',
        color: 'blue',
        displayName: itemName
      };
    } else {
      const [tableName, fieldName] = itemName.split('.');
      return {
        type: t.translationexportcontroller51,
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
                  <Tag value={itemInfo.type} severity={itemInfo.color === 'blue' ? 'info' : 'success'} />
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
          {/* Show info message if no translations exist yet */}
          {Object.keys(selectedItemTranslations).length === 0 && (
            <div className="mb-4 p-4 bg-blue-900 border border-blue-500 rounded-lg">
              <div className="flex items-center gap-2 text-blue-200">
                <i className="pi pi-info-circle"></i>
                <div>
                  <p className="font-semibold">{t.schematranslationpanel701} "{selectedItem}"</p>
                  <p className="text-sm text-blue-300 mt-1">
                    Enter translations below to create new entries. They will be auto-saved after 1 second of inactivity.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {languages.map(language => (
              <div key={language.code} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{language.flag || '🏴'}</span>
                  <div>
                    <h4 className="font-semibold text-white">{language.name}</h4>
                    <p className="text-sm text-gray-400">{language.native_name}</p>
                  </div>
                  <Tag value={language.code.toUpperCase()} severity="info" />
                  {selectedItemTranslations[language.code] && (
                    <Tag value="✓" severity="success" />
                  )}
                </div>
                <InputText
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
              label={t.schematranslationpanel753}
              size="small"
              severity="success"
              outlined
              onClick={() => setShowExportDialog(true)}
              disabled={!selectedProject || exporting}
            />
            <Button
              icon="pi pi-upload"
              label={t.schematranslationpanel762}
              size="small"
              severity="info"
              outlined
              onClick={() => setShowImportDialog(true)}
              disabled={!selectedProject || importing}
            />
            <Button
              icon="pi pi-google"
              label={t.schematranslationpanel771}
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

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - Schema Tree */}
        <div
          className="flex-shrink-0 border-r border-gray-600 bg-gray-700 flex flex-col relative h-full"
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className="p-4 border-b border-gray-600 flex-shrink-0">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-white">Database Schema</h4>
              {/* Expand/Collapse Buttons */}
              {schemaStructure.length > 0 && (
                <div className="flex gap-1">
                  <Button
                    icon="pi pi-plus"
                    size="small"
                    text
                    rounded
                    severity="secondary"
                    onClick={expandAll}
                    tooltip={t.panelt1791}
                    tooltipOptions={{ position: 'bottom' }}
                  />
                  <Button
                    icon="pi pi-minus"
                    size="small"
                    text
                    rounded
                    severity="secondary"
                    onClick={collapseAll}
                    tooltip={t.panelt1798}
                    tooltipOptions={{ position: 'bottom' }}
                  />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-400">Select tables and fields to translate</p>
            {selectedProject && (
              <p className="text-xs text-blue-300 mt-1">Project: {selectedProject.name}</p>
            )}
          </div>
          <div className="flex-1 p-4 overflow-y-auto overflow-x-auto min-h-0">
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
                value={buildTreeData()}
                selectionMode="single"
                selectionKeys={selectedItem ? { [selectedItem]: true } : {}}
                onSelectionChange={(e) => {
                  // PrimeReact Tree returns e.value as a string directly (the selected key)
                  // NOT as an object with keys!
                  if (typeof e.value === 'string' && e.value) {
                    setSelectedItem(e.value);
                  } else if (typeof e.value === 'object' && e.value !== null) {
                    // Fallback: if it's an object, get first key
                    const keys = Object.keys(e.value);
                    if (keys.length > 0) {
                      setSelectedItem(keys[0]);
                    } else {
                      setSelectedItem(null);
                    }
                  } else {
                    setSelectedItem(null);
                  }
                }}
                expandedKeys={expandedKeys}
                onToggle={(e) => setExpandedKeys(e.value)}
                className="bg-transparent schema-tree-compact"
              />
            )}
          </div>

          {/* Resize Handle */}
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);

              const startX = e.clientX;
              const startWidth = sidebarWidth;

              const handleMouseMove = (e: MouseEvent) => {
                const delta = e.clientX - startX;
                const newWidth = Math.max(280, Math.min(800, startWidth + delta)); // Min 280px, Max 800px
                setSidebarWidth(newWidth);
              };

              const handleMouseUp = () => {
                setIsResizing(false);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
            style={{
              backgroundColor: isResizing ? '#3b82f6' : 'transparent',
              width: '4px',
              marginRight: '-2px'
            }}
          />
        </div>

        {/* Right Panel - Translation Detail */}
        <div className="flex-1 bg-gray-800 h-full min-w-0">
          {renderTranslationDetail()}
        </div>
      </div>

      {/* Export Dialog */}
      <Dialog
        header={t.databasemanagementpanel1229}
        visible={showExportDialog}
        onHide={() => setShowExportDialog(false)}
        style={{ width: '500px' }}
        modal
        closable
        draggable={true}
        resizable={true}
      >
        <div className="space-y-4">
          <div className="mb-4 p-4 bg-blue-900 border border-blue-500 rounded-lg">
            <div className="flex items-center gap-2 text-blue-200">
              <i className="pi pi-info-circle"></i>
              <div>
                <p className="font-semibold">Export for {selectedProject?.name}</p>
                <p className="text-sm text-blue-300 mt-1">
                  Select languages to include in the Excel export. The export will contain all tables and fields from linked databases.
                </p>
              </div>
            </div>
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Languages *
            </label>
            <MultiSelect
              value={selectedLanguagesForExport}
              onChange={(e) => setSelectedLanguagesForExport(e.value)}
              options={languages.map(lang => ({ label: `${lang.name} (${lang.code.toUpperCase()})`, value: lang.code }))}
              placeholder={t.databasemanagementpanel1257}
              className="w-full"
              disabled={exporting}
              display="chip"
            />
            <small className="text-gray-400">
              Select one or more languages for the translation export
            </small>
          </div>

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => setShowExportDialog(false)}
              className="p-button-text"
              disabled={exporting}
            />
            <Button
              label={exporting ? "Exporting..." : t.databasemanagementpanel1280}
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
        header={t.databasemanagementpanel1292}
        visible={showImportDialog}
        onHide={() => {
          setShowImportDialog(false);
          setImportFile(null);
        }}
        style={{ width: '500px' }}
        modal
        closable
        draggable={true}
        resizable={true}
      >
        <div className="space-y-4">
          <div className="mb-4 p-4 bg-green-900 border border-green-500 rounded-lg">
            <div className="flex items-center gap-2 text-green-200">
              <i className="pi pi-info-circle"></i>
              <div>
                <p className="font-semibold">Import for {selectedProject?.name}</p>
                <p className="text-sm text-green-300 mt-1">
                  Upload an Excel file with translations. Select which languages to import.
                </p>
              </div>
            </div>
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-300 mb-2">
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
              chooseLabel={importFile ? importFile.name : t.databasemanagementpanel1324}
              disabled={importing}
            />
            <small className="text-gray-400">
              Excel files only (.xlsx, .xls), max 10MB
            </small>
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Languages to Import *
            </label>
            <MultiSelect
              value={selectedLanguagesForImport}
              onChange={(e) => setSelectedLanguagesForImport(e.value)}
              options={languages.map(lang => ({ label: `${lang.name} (${lang.code.toUpperCase()})`, value: lang.code }))}
              placeholder={t.schematranslationpanel1022}
              className="w-full"
              disabled={importing}
              display="chip"
            />
            <small className="text-gray-400">
              Only selected languages will be imported from the Excel file
            </small>
          </div>

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => {
                setShowImportDialog(false);
                setImportFile(null);
              }}
              className="p-button-text"
              disabled={importing}
            />
            <Button
              label={importing ? "Importing..." : t.databasemanagementpanel893}
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
        header={t.schematranslationpanel1056}
        visible={showAutoTranslateDialog}
        onHide={() => {
          setShowAutoTranslateDialog(false);
          setTranslateAllItems(false);
        }}
        style={{ width: '550px' }}
        modal
        closable={!translating}
        draggable={true}
        resizable={true}
      >
        <div className="space-y-4">
          <div className="mb-4 p-4 bg-yellow-900 border border-yellow-500 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-200">
              <i className="pi pi-info-circle"></i>
              <div>
                <p className="font-semibold">
                  {translateAllItems ? 'Translate All Items' : (selectedItem ? `Translate "${selectedItem}"` : t.schematranslationpanel771)}
                </p>
                <p className="text-sm text-yellow-300 mt-1">
                  {translateAllItems
                    ? t.schematranslationpanel1078
                    : t.schematranslationpanel1079
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="field">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={t.schematranslationpanel1090}
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
              <label htmlFor={t.schematranslationpanel1090} className="text-sm font-medium text-gray-300 cursor-pointer">
                🚀 Translate all tables and fields
              </label>
            </div>
            <small className="text-gray-400 ml-6">
              Automatically translates all items that have the source language
            </small>
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-300 mb-2">
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
            <small className="text-gray-400">
              The language to translate FROM (must already have a translation)
            </small>
          </div>

          <div className="field">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Languages *
            </label>
            <MultiSelect
              value={targetLanguagesForTranslate}
              onChange={(e) => setTargetLanguagesForTranslate(e.value)}
              options={languages
                .filter(lang => lang.code !== sourceLanguageForTranslate)
                .map(lang => ({ label: `${lang.name} (${lang.code.toUpperCase()})`, value: lang.code }))}
              placeholder={t.schematranslationpanel1148}
              className="w-full"
              display="chip"
            />
            <small className="text-gray-400">
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
            <div className="mb-4 p-4 bg-blue-900 border border-blue-500 rounded-lg">
              <div className="flex items-center gap-2 text-blue-200">
                <i className="pi pi-info-circle"></i>
                <div>
                  <p className="font-semibold">
                    📊 Estimated cost: ~${translateAllItems
                      ? ((estimatedCharCount * targetLanguagesForTranslate.length) / 1000000 * 20).toFixed(3)
                      : `0.00${Math.max(1, targetLanguagesForTranslate.length * 2)}`
                    }
                  </p>
                  <p className="text-sm text-blue-300 mt-1">
                    {translateAllItems
                      ? `(${estimatedCharCount} chars × ${targetLanguagesForTranslate.length} languages = ${estimatedCharCount * targetLanguagesForTranslate.length} total chars)`
                      : `(${(selectedItemTranslations[sourceLanguageForTranslate]?.length || 0) * targetLanguagesForTranslate.length} characters)`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <Button
              label={t.applicationsmodal432}
              icon="pi pi-times"
              onClick={() => {
                setShowAutoTranslateDialog(false);
                setTranslateAllItems(false);
              }}
              className="p-button-text"
              disabled={translating}
            />
            <Button
              label={translating ? "Translating..." : t.schematranslationpanel1205}
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

      {/* Custom CSS for compact tree */}
      <style>{`
        .schema-tree-compact {
          width: 100% !important;
          height: auto !important;
          background: #1f2937 !important;
        }
        .schema-tree-compact .p-tree-container {
          width: 100% !important;
          overflow: visible !important;
          background: #1f2937 !important;
        }
        .schema-tree-compact .p-treenode {
          padding: 0.125rem 0 !important;
        }
        .schema-tree-compact .p-treenode-content {
          padding: 0.125rem 0.5rem !important;
          min-height: 1.5rem !important;
          background: transparent !important;
        }
        .schema-tree-compact .p-tree-toggler {
          width: 1.25rem !important;
          height: 1.25rem !important;
        }
        .schema-tree-compact .p-treenode-label {
          font-size: 0.875rem !important;
        }
        .schema-tree-compact .p-tag {
          font-size: 0.75rem !important;
          padding: 0.125rem 0.375rem !important;
          height: 1.25rem !important;
        }
      `}</style>
    </div>
  );
}