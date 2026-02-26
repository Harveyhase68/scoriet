import React, { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { FileUpload } from 'primereact/fileupload';
import { Tree } from 'primereact/tree';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
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
  control_type?: string;
}

export default function SchemaTranslationPanel() {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();
  const { colors } = useTheme();
  const { selectedProject } = useProject();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [schemaStructure, setSchemaStructure] = useState<SchemaTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedItemTranslations, setSelectedItemTranslations] = useState<Record<string, string>>({});
  const [selectedItemContentTranslations, setSelectedItemContentTranslations] = useState<Record<string, string>>({});
  const [contentSaveTimeoutId, setContentSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);

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
        const enabledLangs = selectedProject.enabled_languages;
        projectLanguages = allLanguages.filter((lang: Language) =>
          enabledLangs.includes(lang.code)
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
      toast.showError(t.schematranslationpanel109 + (error.response?.data?.message || error.message));
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
      toast.showError(t.schematranslationpanel138 + (error.response?.data?.message || error.message));
      setSchemaStructure([]);
      setExpandedKeys({});
    } finally {
      setLoading(false);
    }
  }, [selectedProject, toast]);

  // Helper to parse translation response into code->text map
  const parseTranslationsResponse = (response: any): Record<string, string> => {
    const map: Record<string, string> = {};
    const data = response.translations || {};
    if (Array.isArray(data)) {
      data.forEach((t: any) => {
        if (t.code && t.translated_text) map[t.code] = t.translated_text;
      });
    } else if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([, t]: [string, any]) => {
        if (t && t.code && t.translated_text) map[t.code] = t.translated_text;
      });
    }
    return map;
  };

  const fetchTranslationsForItem = React.useCallback(async (itemName: string) => {
    try {
      const response = await api.request(`/schema-translations/item/${encodeURIComponent(itemName)}`);
      setSelectedItemTranslations(parseTranslationsResponse(response));
    } catch {
      setSelectedItemTranslations({});
    }

    // If this is a field (contains dot), also fetch content translations
    if (itemName.includes('.')) {
      try {
        const contentResponse = await api.request(`/schema-translations/item/${encodeURIComponent(itemName + '[content]')}`);
        setSelectedItemContentTranslations(parseTranslationsResponse(contentResponse));
      } catch {
        setSelectedItemContentTranslations({});
      }
    } else {
      setSelectedItemContentTranslations({});
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

  const buildTreeData = () => {
    return schemaStructure.map(table => ({
      label: (
        <div className="flex items-center gap-2">
          <span style={{ color: colors.infoText }}>📁</span>
          <span className="font-mono" style={{ color: colors.textPrimary }}>{table.table_name}</span>
          {table.schema_name && (
            <Tag value={table.schema_name} style={{ backgroundColor: colors.accent, color: 'white' }} />
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
            <span style={{ color: colors.successText }}>📄</span>
            <span className="font-mono text-sm" style={{ color: colors.textPrimary }}>{field.field_name}</span>
            <Tag value={field.field_type} severity="success" />
            {field.control_type && field.control_type.toUpperCase() === 'COMBOBOX' && (
              <Tag value="CB" severity="warning" />
            )}
            {field.comment && (
              <Tag value={field.comment} severity="info" />
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

  // Helper: get control_type of the currently selected field
  const getSelectedFieldControlType = (): string | null => {
    if (!selectedItem || !selectedItem.includes('.')) return null;
    const [tableName, fieldName] = selectedItem.split('.');
    const table = schemaStructure.find(t => t.table_name === tableName);
    if (!table) return null;
    const field = table.fields.find(f => f.field_name === fieldName);
    return field?.control_type?.toUpperCase() || null;
  };

  // Auto-save handler for content translations (debounced, saves to itemName[content])
  const handleContentTranslationChange = (languageCode: string, value: string) => {
    setSelectedItemContentTranslations(prev => ({ ...prev, [languageCode]: value }));

    if (contentSaveTimeoutId) clearTimeout(contentSaveTimeoutId);

    const newTimeoutId = setTimeout(async () => {
      if (!selectedItem) return;
      setAutoSaving(true);
      try {
        const translationsToSave = Object.entries({
          ...selectedItemContentTranslations,
          [languageCode]: value
        })
          .filter(([, text]) => (text as string).trim() !== '')
          .map(([code, text]) => ({ code, translated_text: (text as string).trim() }));

        if (translationsToSave.length > 0) {
          await api.request('/schema-translations/bulk-update', {
            method: 'POST',
            body: JSON.stringify({
              item_name: selectedItem + '[content]',
              translations: translationsToSave
            })
          });
        }
      } catch {
        // Silent fail
      } finally {
        setAutoSaving(false);
      }
    }, 1000);

    setContentSaveTimeoutId(newTimeoutId);
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
      toast.showError(t.schematranslationpanel324 + (error.message || t.schematranslationpanel319));
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
      toast.showSuccess(`${t.schematranslationpanel375}${result.imported_count}${t.schematranslationpanel375_2}(${result.updated_count}${t.schematranslationpanel375_3}${result.created_count}${t.schematranslationpanel375_4})`);

      // Refresh current item translations if an item is selected
      if (selectedItem) {
        fetchTranslationsForItem(selectedItem);
      }
    } catch (error: any) {
      toast.showError(t.schematranslationpanel382 + (error.message || t.schematranslationpanel319));
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
      toast.showInfo(`${t.schematranslationpanel444}${itemCount}${t.schematranslationpanel444_2}${sourceLanguageForTranslate.toUpperCase()}${t.schematranslationpanel444_3}(${totalChars}${t.schematranslationpanel444_4})`);
    } else {
      toast.showWarn(`${t.schematranslationpanel447}${sourceLanguageForTranslate.toUpperCase()}${t.schematranslationpanel447_2}`);
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
          toast.showError(`${t.schematranslationpanel478}${sourceLanguageForTranslate.toUpperCase()}${t.schematranslationpanel478_2}`);
          setTranslating(false);
          return;
        }

        await translateSingleItem(token, selectedItem, sourceText);
      }

    } catch (error: any) {
      toast.showError(t.schematranslationpanel487 + (error.message || t.schematranslationpanel319));
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
    toast.showSuccess(`${t.schematranslationpanel523}${sourceLanguageForTranslate.toUpperCase()} to ${targetLanguagesForTranslate.length}${t.schematranslationpanel523_2}`);
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
      toast.showWarn(`${t.schematranslationpanel554}${sourceLanguageForTranslate.toUpperCase()}${t.schematranslationpanel554_2}`);
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

    toast.showSuccess(`${t.schematranslationpanel609}${successCount}${t.schematranslationpanel609_2}${sourceLanguageForTranslate.toUpperCase()}${t.schematranslationpanel609_3}${targetLanguagesForTranslate.length}${t.schematranslationpanel609_4}${errorCount > 0 ? `(${errorCount}${t.schematranslationpanel609_5})` : ''}`);

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
        <div className="flex items-center justify-center h-full" style={{ color: colors.textMuted }}>
          <div className="text-center">
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="text-lg font-semibold mb-2">{t.schematranslationpanel668}</h3>
            <p>{t.schematranslationpanel669}</p>
          </div>
        </div>
      );
    }

    const itemInfo = getItemTypeInfo(selectedItem);

    return (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 p-4" style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{itemInfo.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{itemInfo.displayName}</h3>
                  <Tag value={itemInfo.type} severity={itemInfo.color === 'blue' ? 'info' : 'success'} />
                </div>
                <p className="text-sm" style={{ color: colors.textMuted }}>{t.schematranslationpanel688}</p>
              </div>
            </div>
            {autoSaving && (
              <div className="flex items-center gap-2" style={{ color: colors.successText }}>
                <i className="pi pi-spin pi-spinner"></i>
                <span className="text-sm">{t.schematranslationpanel694}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-4 overflow-auto">
          {/* Show info message if no translations exist yet */}
          {Object.keys(selectedItemTranslations).length === 0 && (
            <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoText}` }}>
              <div className="flex items-center gap-2" style={{ color: colors.infoText }}>
                <i className="pi pi-info-circle"></i>
                <div>
                  <p className="font-semibold">{t.schematranslationpanel701} "{selectedItem}"</p>
                  <p className="text-sm mt-1" style={{ color: colors.infoText, opacity: 0.8 }}>
                    {t.schematranslationpanel709}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {languages.map(language => (
              <div key={language.code} className="rounded-lg p-4" style={{ backgroundColor: colors.bgSecondary }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{language.flag || '🏴'}</span>
                  <div>
                    <h4 className="font-semibold" style={{ color: colors.textPrimary }}>{language.name}</h4>
                    <p className="text-sm" style={{ color: colors.textMuted }}>{language.native_name}</p>
                  </div>
                  <Tag value={language.code.toUpperCase()} severity="info" />
                  {selectedItemTranslations[language.code] && (
                    <Tag value="✓" severity="success" />
                  )}
                </div>
                <InputText
                  placeholder={`Enter ${language.name}${t.schematranslationpanel731}`}
                  value={selectedItemTranslations[language.code] || ''}
                  onChange={(e) => handleTranslationChange(language.code, e.target.value)}
                  className="w-full schema-translation-input"
                  style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                />
                {/* Combobox content textarea — only shown for COMBOBOX control type */}
                {getSelectedFieldControlType() === 'COMBOBOX' && (
                  <div className="mt-2">
                    <label className="text-xs font-medium mb-1 block" style={{ color: colors.textMuted }}>
                      {t.schematranslationpanel_content_label}
                    </label>
                    <InputTextarea
                      placeholder={t.schematranslationpanel_content_placeholder}
                      value={selectedItemContentTranslations[language.code] || ''}
                      onChange={(e) => handleContentTranslationChange(language.code, e.target.value)}
                      rows={5}
                      autoResize
                      className="w-full"
                      style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
                    />
                    <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                      {t.schematranslationpanel_content_hint}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="schema-translation-panel h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <div className="flex-shrink-0 p-4" style={{ borderBottom: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
              {t.schematranslationpanel751}
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {t.schematranslationpanel754}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowExportDialog(true)}
              disabled={!selectedProject || exporting}
              className="schema-translation-btn px-3 py-1.5 rounded text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 hover:shadow-md active:scale-95"
              style={{ backgroundColor: colors.accent, color: 'white' }}
            >
              <i className="pi pi-download mr-2"></i>{t.schematranslationpanel753}
            </button>
            <button
              onClick={() => setShowImportDialog(true)}
              disabled={!selectedProject || importing}
              className="schema-translation-btn px-3 py-1.5 rounded text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 hover:shadow-md active:scale-95"
              style={{ backgroundColor: colors.accent, color: 'white' }}
            >
              <i className="pi pi-upload mr-2"></i>{t.schematranslationpanel762}
            </button>
            <button
              onClick={handleAutoTranslate}
              disabled={!selectedProject || translating}
              className="schema-translation-btn px-3 py-1.5 rounded text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 hover:shadow-md active:scale-95"
              style={{ backgroundColor: colors.warningBg, color: colors.warningText }}
            >
              {translating && <i className="pi pi-spinner pi-spin mr-2"></i>}
              {!translating && <i className="pi pi-google mr-2"></i>}
              {t.schematranslationpanel771}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - Schema Tree */}
        <div
          className="flex-shrink-0 flex flex-col relative h-full"
          style={{ width: `${sidebarWidth}px`, borderRight: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}
        >
          <div className="p-4 flex-shrink-0" style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold" style={{ color: colors.textPrimary }}>{t.schematranslationpanel796}</h4>
              {/* Expand/Collapse Buttons */}
              {schemaStructure.length > 0 && (
                <div className="flex gap-1">
                  <button
                    onClick={expandAll}
                    title={t.panelt1791}
                    className="p-1 rounded hover:opacity-80 transition-opacity"
                    style={{ color: colors.textSecondary }}
                  >
                    <i className="pi pi-plus text-sm"></i>
                  </button>
                  <button
                    onClick={collapseAll}
                    title={t.panelt1798}
                    className="p-1 rounded hover:opacity-80 transition-opacity"
                    style={{ color: colors.textSecondary }}
                  >
                    <i className="pi pi-minus text-sm"></i>
                  </button>
                </div>
              )}
            </div>
            <p className="text-sm" style={{ color: colors.textMuted }}>{t.schematranslationpanel819}</p>
            {selectedProject && (
              <p className="text-xs mt-1" style={{ color: colors.accent }}>{t.schematranslationpanel821}{selectedProject.name}</p>
            )}
          </div>
          <div className="flex-1 p-4 overflow-y-auto overflow-x-auto min-h-0">
            {!selectedProject ? (
              <div className="text-center mt-8" style={{ color: colors.textMuted }}>
                <div className="text-2xl mb-2">📋</div>
                <p>{t.schematranslationpanel828}</p>
              </div>
            ) : loading ? (
              <div className="text-center" style={{ color: colors.textMuted }}>{t.schematranslationpanel831}</div>
            ) : schemaStructure.length === 0 ? (
              <div className="text-center mt-8" style={{ color: colors.textMuted }}>
                <div className="text-2xl mb-2">📭</div>
                <p>{t.schematranslationpanel835}</p>
                <p className="text-xs mt-1">{t.schematranslationpanel836}</p>
              </div>
            ) : (
              <Tree
                value={buildTreeData() as any}
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
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize transition-colors"
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
              backgroundColor: isResizing ? colors.accent : 'transparent',
              width: '4px',
              marginRight: '-2px'
            }}
          />
        </div>

        {/* Right Panel - Translation Detail */}
        <div className="flex-1 h-full min-w-0" style={{ backgroundColor: colors.bgPrimary }}>
          {renderTranslationDetail()}
        </div>
      </div>

      {/* Export Dialog */}
      <Dialog
        header={t.databasemanagementpanel1229}
        visible={showExportDialog}
        onHide={() => setShowExportDialog(false)}
        style={{ width: '500px', backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}
        contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, borderBottom: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
        modal
        closable
        draggable={true}
        resizable={true}
      >
        <div className="space-y-4">
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoText}` }}>
            <div className="flex items-center gap-2" style={{ color: colors.infoText }}>
              <i className="pi pi-info-circle"></i>
              <div>
                <p className="font-semibold">{t.schematranslationpanel924}{selectedProject?.name}</p>
                <p className="text-sm mt-1" style={{ opacity: 0.8 }}>
                  {t.schematranslationpanel926}
                </p>
              </div>
            </div>
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              {t.schematranslationpanel934}
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
            <small style={{ color: colors.textMuted }}>
              {t.schematranslationpanel946}
            </small>
          </div>

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <button
              onClick={() => setShowExportDialog(false)}
              disabled={exporting}
              className="px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
            >
              <i className="pi pi-times mr-2"></i>{t.applicationsmodal432}
            </button>
            <button
              onClick={handleExportTranslations}
              disabled={exporting || selectedLanguagesForExport.length === 0}
              className="px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: colors.accent, color: 'white' }}
            >
              <i className={exporting ? "pi pi-spinner pi-spin mr-2" : "pi pi-download mr-2"}></i>
              {exporting ? "Exporting..." : t.databasemanagementpanel1280}
            </button>
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
        style={{ width: '500px', backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}
        contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, borderBottom: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
        modal
        closable
        draggable={true}
        resizable={true}
      >
        <div className="space-y-4">
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successText}` }}>
            <div className="flex items-center gap-2" style={{ color: colors.successText }}>
              <i className="pi pi-info-circle"></i>
              <div>
                <p className="font-semibold">Import for {selectedProject?.name}</p>
                <p className="text-sm mt-1" style={{ opacity: 0.8 }}>
                  {t.schematranslationpanel995}
                </p>
              </div>
            </div>
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              {t.schematranslationpanel1003}
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
            <small style={{ color: colors.textMuted }}>
              {t.schematranslationpanel1017}
            </small>
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              {t.schematranslationpanel1023}
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
            <small style={{ color: colors.textMuted }}>
              {t.schematranslationpanel1035}
            </small>
          </div>

          <div className="flex justify-end space-x-2 pt-4 gap-2">
            <button
              onClick={() => {
                setShowImportDialog(false);
                setImportFile(null);
              }}
              disabled={importing}
              className="px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
            >
              <i className="pi pi-times mr-2"></i>{t.applicationsmodal432}
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={importing || !importFile || selectedLanguagesForImport.length === 0}
              className="px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: colors.infoBg, color: colors.infoText }}
            >
              <i className={importing ? "pi pi-spinner pi-spin mr-2" : "pi pi-upload mr-2"}></i>
              {importing ? "Importing..." : t.databasemanagementpanel893}
            </button>
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
        style={{ width: '550px', backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}
        contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, borderBottom: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
        modal
        closable={!translating}
        draggable={true}
        resizable={true}
      >
        <div className="space-y-4">
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningText}` }}>
            <div className="flex items-center gap-2" style={{ color: colors.warningText }}>
              <i className="pi pi-info-circle"></i>
              <div>
                <p className="font-semibold">
                  {translateAllItems ? t.schematranslationpanel1086 : (selectedItem ? `${t.schematranslationpanel1086_3}"${selectedItem}"` : t.schematranslationpanel771)}
                </p>
                <p className="text-sm mt-1" style={{ opacity: 0.8 }}>
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
              <label htmlFor={t.schematranslationpanel1090} className="text-sm font-medium cursor-pointer" style={{ color: colors.textSecondary }}>
                {t.schematranslationpanel1116}
              </label>
            </div>
            <small className="ml-6" style={{ color: colors.textMuted }}>
              {t.schematranslationpanel1120}
            </small>
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              {t.schematranslationpanel1126}
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
            <small style={{ color: colors.textMuted }}>
              {t.schematranslationpanel1146}
            </small>
          </div>

          <div className="field">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              {t.schematranslationpanel1152}
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
            <small style={{ color: colors.textMuted }}>
              {t.schematranslationpanel1165}
            </small>
          </div>

          {translating && translationProgress.total > 0 && (
            <div className="p-3 rounded" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successText}` }}>
              <p className="text-sm font-medium" style={{ color: colors.successText }}>
                {t.schematranslationpanel1172}{translationProgress.current}{t.schematranslationpanel1172_2}{translationProgress.total}{t.schematranslationpanel1172_3}
              </p>
              <div className="w-full rounded-full h-2 mt-2" style={{ backgroundColor: colors.bgTertiary }}>
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(translationProgress.current / translationProgress.total) * 100}%`, backgroundColor: colors.accent }}
                />
              </div>
            </div>
          )}

          {!translating && (
            <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoText}` }}>
              <div className="flex items-center gap-2" style={{ color: colors.infoText }}>
                <i className="pi pi-info-circle"></i>
                <div>
                  <p className="font-semibold">
                    {t.schematranslationpanel1189}~${translateAllItems
                      ? ((estimatedCharCount * targetLanguagesForTranslate.length) / 1000000 * 20).toFixed(3)
                      : `0.00${Math.max(1, targetLanguagesForTranslate.length * 2)}`
                    }
                  </p>
                  <p className="text-sm mt-1" style={{ opacity: 0.8 }}>
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
            <button
              onClick={() => {
                setShowAutoTranslateDialog(false);
                setTranslateAllItems(false);
              }}
              disabled={translating}
              className="px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }}
            >
              <i className="pi pi-times mr-2"></i>{t.applicationsmodal432}
            </button>
            <button
              onClick={handleConfirmAutoTranslate}
              disabled={
                translating ||
                targetLanguagesForTranslate.length === 0 ||
                (!translateAllItems && (!selectedItem || !selectedItemTranslations[sourceLanguageForTranslate]))
              }
              className="px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: colors.warningBg, color: colors.warningText }}
            >
              <i className={translating ? "pi pi-spinner pi-spin mr-2" : "pi pi-google mr-2"}></i>
              {translating ? "Translating..." : t.schematranslationpanel1205}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Custom CSS for compact tree and theme-aware styles */}
      <style>{`
        .schema-tree-compact {
          width: 100% !important;
          height: auto !important;
          background: var(--theme-bg-secondary) !important;
        }
        .schema-tree-compact .p-tree-container {
          width: 100% !important;
          overflow: visible !important;
          background: var(--theme-bg-secondary) !important;
        }
        .schema-tree-compact .p-treenode {
          padding: 0.125rem 0 !important;
        }
        .schema-tree-compact .p-treenode-content {
          padding: 0.125rem 0.5rem !important;
          min-height: 1.5rem !important;
          background: transparent !important;
        }
        .schema-tree-compact .p-treenode-content:hover {
          background: var(--theme-bg-tertiary) !important;
        }
        .schema-tree-compact .p-tree-toggler {
          width: 1.25rem !important;
          height: 1.25rem !important;
          color: var(--theme-text-secondary) !important;
        }
        .schema-tree-compact .p-treenode-label {
          font-size: 0.875rem !important;
          color: var(--theme-text-primary) !important;
        }
        .schema-tree-compact .p-tag {
          font-size: 0.75rem !important;
          padding: 0.125rem 0.375rem !important;
          height: 1.25rem !important;
        }
        .schema-tree-compact .p-highlight > .p-treenode-content {
          background: var(--theme-bg-tertiary) !important;
        }

        /* Input placeholder styling */
        .schema-translation-panel .schema-translation-input::placeholder {
          color: var(--theme-text-muted);
          opacity: 0.7;
        }

        /* Button hover effects */
        .schema-translation-btn {
          cursor: pointer;
        }

        /* PrimeReact components styling - in panel and dialogs */
        .schema-translation-panel .p-dropdown,
        .schema-translation-panel .p-multiselect,
        .p-dialog .p-dropdown,
        .p-dialog .p-multiselect {
          background: var(--theme-bg-tertiary) !important;
          border: 1px solid var(--theme-border-primary) !important;
          color: var(--theme-text-primary) !important;
        }
        .schema-translation-panel .p-dropdown-label,
        .schema-translation-panel .p-multiselect-label,
        .p-dialog .p-dropdown-label,
        .p-dialog .p-multiselect-label {
          color: var(--theme-text-primary) !important;
        }
        .schema-translation-panel .p-dropdown-trigger,
        .schema-translation-panel .p-multiselect-trigger,
        .p-dialog .p-dropdown-trigger,
        .p-dialog .p-multiselect-trigger {
          color: var(--theme-text-secondary) !important;
        }

        /* Dropdown/MultiSelect panel overlay styling */
        .p-dropdown-panel,
        .p-multiselect-panel {
          background: var(--theme-bg-secondary) !important;
          border: 1px solid var(--theme-border-primary) !important;
        }
        .p-dropdown-panel .p-dropdown-items,
        .p-multiselect-panel .p-multiselect-items {
          background: var(--theme-bg-secondary) !important;
        }
        .p-dropdown-panel .p-dropdown-item,
        .p-multiselect-panel .p-multiselect-item {
          color: var(--theme-text-primary) !important;
          background: transparent !important;
        }
        .p-dropdown-panel .p-dropdown-item:hover,
        .p-multiselect-panel .p-multiselect-item:hover {
          background: var(--theme-bg-tertiary) !important;
        }
        .p-dropdown-panel .p-dropdown-item.p-highlight,
        .p-multiselect-panel .p-multiselect-item.p-highlight {
          background: var(--theme-bg-tertiary) !important;
          color: var(--theme-text-primary) !important;
        }
        .p-multiselect-panel .p-multiselect-header {
          background: var(--theme-bg-secondary) !important;
          border-bottom: 1px solid var(--theme-border-primary) !important;
          color: var(--theme-text-primary) !important;
        }
        .p-multiselect-panel .p-checkbox .p-checkbox-box {
          background: var(--theme-bg-tertiary) !important;
          border-color: var(--theme-border-primary) !important;
        }
        .p-multiselect-panel .p-checkbox .p-checkbox-box.p-highlight {
          background: var(--theme-accent) !important;
          border-color: var(--theme-accent) !important;
        }
        .p-multiselect-panel .p-multiselect-close {
          color: var(--theme-text-secondary) !important;
        }

        /* MultiSelect chips */
        .p-multiselect-token {
          background: var(--theme-bg-tertiary) !important;
          color: var(--theme-text-primary) !important;
        }
        .p-multiselect-token-icon {
          color: var(--theme-text-secondary) !important;
        }
      `}</style>
    </div>
  );
}