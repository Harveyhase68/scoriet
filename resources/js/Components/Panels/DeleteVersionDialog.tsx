import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface SchemaVersion {
    id: number;
    version_number: number;
    description?: string;
    tables_count?: number;
    imported_at?: string;
    created_at?: string;
}

interface DeleteVersionDialogProps {
    visible: boolean;
    onHide: () => void;
    onConfirm: (versionId: number) => void;
    schemaName: string;
    versions: SchemaVersion[];
    currentVersionId?: number;
}

const DeleteVersionDialog: React.FC<DeleteVersionDialogProps> = ({
    visible,
    onHide,
    onConfirm,
    schemaName,
    versions}) => {
    const { colors } = useTheme();
    const [advancedMode, setAdvancedMode] = useState(false);
    const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
    const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);

    // Get latest version
    const latestVersion = versions.length > 0
        ? versions.reduce((latest, current) =>
            current.version_number > latest.version_number ? current : latest
          )
        : null;

    // Reset state when dialog closes
    const handleHide = () => {
        setAdvancedMode(false);
        setSelectedVersionId(null);
        onHide();
    };

    // Handle delete confirmation
    const handleConfirm = () => {
        const versionToDelete = advancedMode && selectedVersionId
            ? selectedVersionId
            : latestVersion?.id;

        if (versionToDelete) {
            onConfirm(versionToDelete);
            handleHide();
        }
    };

    // Check if can delete
    const canDelete = versions.length > 1;
    const versionToDelete = advancedMode && selectedVersionId
        ? versions.find(v => v.id === selectedVersionId)
        : latestVersion;

    // Prepare version options for dropdown (show all versions)
    const versionOptions = versions
        .map(v => ({
            label: `v${v.version_number} - ${v.tables_count || 0}${t.deleteversiondialog74}${v.imported_at ? ` (${new Date(v.imported_at).toLocaleDateString(currentLanguage)})` : ''}`,
            value: v.id
        }));

    const footer = (
        <div>
            <Button
                label={t.deleteversiondialog81}
                icon="pi pi-times"
                onClick={handleHide}
                className="p-button-text"
            />
            <Button
                label={t.deleteversiondialog87}
                icon="pi pi-trash"
                onClick={handleConfirm}
                className="p-button-danger"
                disabled={!versionToDelete || !canDelete}
            />
        </div>
    );

    return (
        <Dialog
            header={t.deleteversiondialog98}
            visible={visible}
            style={{ width: '500px' }}
            footer={footer}
            onHide={handleHide}
            contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
            headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
            className="delete-version-dialog"
        >
            <div className="space-y-4">
                {/* Warning */}
                <div className="rounded p-3" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}` }}>
                    <div className="flex items-start gap-2">
                        <i className="pi pi-exclamation-triangle mt-1" style={{ color: colors.errorText }}></i>
                        <div>
                            <div className="font-semibold" style={{ color: colors.errorText }}>{t.deleteversiondialog110}</div>
                            <div className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                                {t.deleteversiondialog115}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Schema Info */}
                <div className="rounded p-3" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                    <div className="text-sm" style={{ color: colors.textMuted }}>{t.deleteversiondialog123}</div>
                    <div className="font-semibold" style={{ color: colors.textPrimary }}>{schemaName}</div>
                    <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                        {versions.length} {versions.length === 1 ? t.deleteversiondialog126 : t.deleteversiondialog126_2}{t.deleteversiondialog126}
                    </div>
                </div>

                {!canDelete && (
                    <div className="rounded p-3" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningBorder}` }}>
                        <div className="flex items-start gap-2">
                            <i className="pi pi-info-circle mt-1" style={{ color: colors.warningText }}></i>
                            <div className="text-sm" style={{ color: colors.textSecondary }}>
                                {t.deleteversiondialog135}
                            </div>
                        </div>
                    </div>
                )}

                {canDelete && (
                    <>
                        {/* Default Mode - Delete Latest Version */}
                        {!advancedMode && latestVersion && (
                            <div className="rounded p-3" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}>
                                <div className="text-sm mb-2" style={{ color: colors.textMuted }}>{t.deleteversiondialog146}</div>
                                <div className="font-semibold" style={{ color: colors.textPrimary }}>
                                    {t.deleteversiondialog148}{latestVersion.version_number}
                                </div>
                                <div className="text-sm mt-1" style={{ color: colors.textMuted }}>
                                    {latestVersion.tables_count || 0}{t.deleteversiondialog151}
                                    {latestVersion.imported_at && (
                                        <> · {t.deleteversiondialog153}{new Date(latestVersion.imported_at).toLocaleDateString(currentLanguage, {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Advanced Mode - Select Specific Version */}
                        {advancedMode && (
                            <div className="space-y-3">
                                <div className="rounded p-3" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningBorder}` }}>
                                    <div className="flex items-start gap-2">
                                        <i className="pi pi-exclamation-circle mt-1" style={{ color: colors.warningText }}></i>
                                        <div className="text-sm" style={{ color: colors.textSecondary }}>
                                            <strong>{t.deleteversiondialog172}</strong>{t.deleteversiondialog172_2}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                        {t.deleteversiondialog179}
                                    </label>
                                    <Dropdown
                                        value={selectedVersionId}
                                        options={versionOptions}
                                        onChange={(e) => setSelectedVersionId(e.value)}
                                        placeholder={t.deleteversiondialog185}
                                        className="w-full"
                                        panelClassName="delete-version-dropdown-panel"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Advanced Mode Toggle */}
                        <div className="pt-3" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    inputId="advanced_mode"
                                    checked={advancedMode}
                                    onChange={(e) => {
                                        setAdvancedMode(e.checked || false);
                                        setSelectedVersionId(null); // Reset selection
                                    }}
                                />
                                <label
                                    htmlFor="advanced_mode"
                                    className="text-sm cursor-pointer"
                                    style={{ color: colors.textSecondary }}
                                >
                                    <strong>{t.deleteversiondialog209}</strong>{t.deleteversiondialog209_2}
                                </label>
                            </div>
                            {advancedMode && (
                                <div className="text-xs mt-2 ml-6" style={{ color: colors.textMuted }}>
                                    {t.deleteversiondialog214}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Theme-aware styles for PrimeReact components */}
            <style>{`
                .delete-version-dialog .p-dropdown {
                    background-color: var(--theme-bg-secondary);
                    border-color: var(--theme-border-primary);
                    color: var(--theme-text-primary);
                }
                .delete-version-dialog .p-dropdown:hover {
                    border-color: var(--theme-accent);
                }
                .delete-version-dialog .p-dropdown .p-dropdown-label {
                    color: var(--theme-text-primary);
                }
                .delete-version-dialog .p-dropdown .p-dropdown-trigger {
                    color: var(--theme-text-muted);
                }
                .delete-version-dropdown-panel {
                    background-color: var(--theme-bg-secondary) !important;
                    border-color: var(--theme-border-primary) !important;
                }
                .delete-version-dropdown-panel .p-dropdown-items {
                    background-color: var(--theme-bg-secondary) !important;
                }
                .delete-version-dropdown-panel .p-dropdown-item {
                    color: var(--theme-text-primary) !important;
                    background-color: var(--theme-bg-secondary) !important;
                }
                .delete-version-dropdown-panel .p-dropdown-item:hover {
                    background-color: var(--theme-bg-tertiary) !important;
                }
                .delete-version-dropdown-panel .p-dropdown-item.p-highlight {
                    background-color: var(--theme-accent) !important;
                    color: white !important;
                }
                .delete-version-dialog .p-checkbox .p-checkbox-box {
                    background-color: var(--theme-bg-secondary);
                    border-color: var(--theme-border-primary);
                }
                .delete-version-dialog .p-checkbox .p-checkbox-box:hover {
                    border-color: var(--theme-accent);
                }
                .delete-version-dialog .p-checkbox .p-checkbox-box.p-highlight {
                    background-color: var(--theme-accent);
                    border-color: var(--theme-accent);
                }
                .delete-version-dialog .p-button-text {
                    color: var(--theme-text-primary);
                }
                .delete-version-dialog .p-button-text:hover {
                    background-color: var(--theme-bg-tertiary);
                }
            `}</style>
        </Dialog>
    );
};

export default DeleteVersionDialog;
