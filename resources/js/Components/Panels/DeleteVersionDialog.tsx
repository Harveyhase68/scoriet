import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';

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
            className="bg-gray-800"
        >
            <div className="space-y-4">
                {/* Warning */}
                <div className="bg-red-900/20 border border-red-500 rounded p-3">
                    <div className="flex items-start gap-2">
                        <i className="pi pi-exclamation-triangle text-red-400 mt-1"></i>
                        <div>
                            <div className="font-semibold text-red-400">Warnung: Permanentes Löschen</div>
                            <div className="text-sm text-gray-300 mt-1">
                                Diese Aktion kann nicht rückgängig gemacht werden. Alle Tabellen, Felder und Beziehungen dieser Version werden gelöscht.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Schema Info */}
                <div className="bg-gray-700/50 rounded p-3">
                    <div className="text-sm text-gray-400">Schema</div>
                    <div className="font-semibold text-white">{schemaName}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {versions.length} {versions.length === 1 ? 'Version' : 'Versionen'} vorhanden
                    </div>
                </div>

                {!canDelete && (
                    <div className="bg-yellow-900/20 border border-yellow-500 rounded p-3">
                        <div className="flex items-start gap-2">
                            <i className="pi pi-info-circle text-yellow-400 mt-1"></i>
                            <div className="text-sm text-gray-300">
                                Das Schema muss mindestens eine Version behalten. Lösche das gesamte Schema, wenn du alle Versionen entfernen möchtest.
                            </div>
                        </div>
                    </div>
                )}

                {canDelete && (
                    <>
                        {/* Default Mode - Delete Latest Version */}
                        {!advancedMode && latestVersion && (
                            <div className="bg-blue-900/20 border border-blue-500 rounded p-3">
                                <div className="text-sm text-gray-400 mb-2">Zu löschende Version (neueste):</div>
                                <div className="font-semibold text-white">
                                    Version {latestVersion.version_number}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">
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
                                <div className="bg-orange-900/20 border border-orange-500 rounded p-3">
                                    <div className="flex items-start gap-2">
                                        <i className="pi pi-exclamation-circle text-orange-400 mt-1"></i>
                                        <div className="text-sm text-gray-300">
                                            <strong>Achtung:</strong> Das Löschen einer älteren Version kann zu Lücken in der Versions-Historie führen (z.B. v1, v2, v4 statt v1, v2, v3, v4).
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-300">
                                        Version auswählen:
                                    </label>
                                    <Dropdown
                                        value={selectedVersionId}
                                        options={versionOptions}
                                        onChange={(e) => setSelectedVersionId(e.value)}
                                        placeholder="Version zum Löschen auswählen"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Advanced Mode Toggle */}
                        <div className="border-t border-gray-600 pt-3">
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
                                    className="text-sm cursor-pointer text-gray-300"
                                >
                                    <strong>Bestimmte Version löschen</strong> (Ich weiß was ich mache)
                                </label>
                            </div>
                            {advancedMode && (
                                <div className="text-xs text-gray-500 mt-2 ml-6">
                                    Im erweiterten Modus kannst du jede beliebige Version löschen. Sei vorsichtig bei der Auswahl!
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Dialog>
    );
};

export default DeleteVersionDialog;
