import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { useTheme } from '@/contexts/ThemeContext';

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
            label: `v${v.version_number} - ${v.tables_count || 0} tables${v.imported_at ? ` (${new Date(v.imported_at).toLocaleDateString('de-DE')})` : ''}`,
            value: v.id
        }));

    const footer = (
        <div>
            <Button
                label="Abbrechen"
                icon="pi pi-times"
                onClick={handleHide}
                className="p-button-text"
            />
            <Button
                label="Version löschen"
                icon="pi pi-trash"
                onClick={handleConfirm}
                className="p-button-danger"
                disabled={!versionToDelete || !canDelete}
            />
        </div>
    );

    return (
        <Dialog
            header="Schema Version löschen"
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
                            <div className="font-semibold" style={{ color: colors.errorText }}>Warnung: Permanentes Löschen</div>
                            <div className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                                Diese Aktion kann nicht rückgängig gemacht werden. Alle Tabellen, Felder und Beziehungen dieser Version werden gelöscht.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Schema Info */}
                <div className="rounded p-3" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                    <div className="text-sm" style={{ color: colors.textMuted }}>Schema</div>
                    <div className="font-semibold" style={{ color: colors.textPrimary }}>{schemaName}</div>
                    <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                        {versions.length} {versions.length === 1 ? 'Version' : 'Versionen'} vorhanden
                    </div>
                </div>

                {!canDelete && (
                    <div className="rounded p-3" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningBorder}` }}>
                        <div className="flex items-start gap-2">
                            <i className="pi pi-info-circle mt-1" style={{ color: colors.warningText }}></i>
                            <div className="text-sm" style={{ color: colors.textSecondary }}>
                                Das Schema muss mindestens eine Version behalten. Lösche das gesamte Schema, wenn du alle Versionen entfernen möchtest.
                            </div>
                        </div>
                    </div>
                )}

                {canDelete && (
                    <>
                        {/* Default Mode - Delete Latest Version */}
                        {!advancedMode && latestVersion && (
                            <div className="rounded p-3" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}>
                                <div className="text-sm mb-2" style={{ color: colors.textMuted }}>Zu löschende Version (neueste):</div>
                                <div className="font-semibold" style={{ color: colors.textPrimary }}>
                                    Version {latestVersion.version_number}
                                </div>
                                <div className="text-sm mt-1" style={{ color: colors.textMuted }}>
                                    {latestVersion.tables_count || 0} Tabellen
                                    {latestVersion.imported_at && (
                                        <> · Importiert: {new Date(latestVersion.imported_at).toLocaleDateString('de-DE', {
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
                                            <strong>Achtung:</strong> Das Löschen einer älteren Version kann zu Lücken in der Versions-Historie führen (z.B. v1, v2, v4 statt v1, v2, v3, v4).
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                        Version auswählen:
                                    </label>
                                    <Dropdown
                                        value={selectedVersionId}
                                        options={versionOptions}
                                        onChange={(e) => setSelectedVersionId(e.value)}
                                        placeholder="Version zum Löschen auswählen"
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
                                    <strong>Bestimmte Version löschen</strong> (Ich weiß was ich mache)
                                </label>
                            </div>
                            {advancedMode && (
                                <div className="text-xs mt-2 ml-6" style={{ color: colors.textMuted }}>
                                    Im erweiterten Modus kannst du jede beliebige Version löschen. Sei vorsichtig bei der Auswahl!
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
