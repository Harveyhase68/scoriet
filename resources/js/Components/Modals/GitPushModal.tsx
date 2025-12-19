import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { ProgressBar } from 'primereact/progressbar';
import { Message } from 'primereact/message';
import { Checkbox } from 'primereact/checkbox';

interface GitSettings {
    provider_id: number | null;
    provider: string | null;
    provider_username: string | null;
    repository: string | null;
    default_branch: string | null;
    main_branch: string | null;
    target_directory: string | null;
    workflow: 'push_only' | 'push_and_pr' | 'push_pr_merge';
    pr_title_template: string | null;
    pr_description_template: string | null;
    auto_delete_branch: boolean;
    is_configured: boolean;
}

interface GitPushModalProps {
    visible: boolean;
    onHide: () => void;
    projectId: number;
    projectName: string;
    archiveBlob: Blob | null;
    gitSettings: GitSettings | null;
    onSuccess?: () => void;
}

type PushStep = 'confirm' | 'pushing' | 'success' | 'error';

export default function GitPushModal({
    visible,
    onHide,
    projectId,
    projectName,
    archiveBlob,
    gitSettings,
    onSuccess
}: GitPushModalProps) {
    const [step, setStep] = useState<PushStep>('confirm');
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState('');

    // Editable fields
    const [branchName, setBranchName] = useState('');
    const [commitMessage, setCommitMessage] = useState('');
    const [prTitle, setPrTitle] = useState('');
    const [prDescription, setPrDescription] = useState('');
    const [createPr, setCreatePr] = useState(false);
    const [autoMerge, setAutoMerge] = useState(false);

    // Result
    const [pushResult, setPushResult] = useState<{
        commit_sha?: string;
        branch?: string;
        pr_url?: string;
        pr_number?: number;
        merged?: boolean;
    } | null>(null);

    // Initialize form values from gitSettings
    useEffect(() => {
        if (gitSettings && visible) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const defaultBranch = gitSettings.default_branch || `scoriet/${timestamp}`;

            setBranchName(defaultBranch);
            setCommitMessage(`[Scoriet] Code generation - ${new Date().toLocaleString('de-DE')}`);

            // PR settings based on workflow
            setCreatePr(gitSettings.workflow !== 'push_only');
            setAutoMerge(gitSettings.workflow === 'push_pr_merge');

            // PR title and description
            const title = (gitSettings.pr_title_template || '[Scoriet] Code-Generierung {timestamp}')
                .replace('{timestamp}', new Date().toLocaleString('de-DE'))
                .replace('{project_name}', projectName);
            setPrTitle(title);

            const description = (gitSettings.pr_description_template ||
                'Automatisch generierter Code von Scoriet.\n\nGeneriert am: {timestamp}\nProjekt: {project_name}')
                .replace('{timestamp}', new Date().toLocaleString('de-DE'))
                .replace('{project_name}', projectName);
            setPrDescription(description);

            // Reset state
            setStep('confirm');
            setProgress(0);
            setError('');
            setPushResult(null);
        }
    }, [gitSettings, visible, projectName]);

    const handlePush = async () => {
        if (!archiveBlob || !gitSettings?.provider_id) {
            setError('Kein Archiv oder Git-Provider verfügbar');
            return;
        }

        setStep('pushing');
        setProgress(0);
        setError('');

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) {
                throw new Error('Nicht authentifiziert');
            }

            // Prepare form data
            const formData = new FormData();
            formData.append('project_id', projectId.toString());
            formData.append('archive', archiveBlob, `${projectName}.zip`);
            formData.append('branch', branchName);
            formData.append('commit_message', commitMessage);
            formData.append('target_directory', gitSettings.target_directory || '');
            formData.append('create_pr', createPr ? '1' : '0');

            if (createPr) {
                formData.append('pr_title', prTitle);
                formData.append('pr_description', prDescription);
                formData.append('base_branch', gitSettings.main_branch || 'main');
                formData.append('auto_merge', autoMerge ? '1' : '0');
                formData.append('delete_branch_after_merge', gitSettings.auto_delete_branch ? '1' : '0');
            }

            setProgress(10);
            setStatusMessage('Verbindung zum Git-Server wird hergestellt...');

            // Call push API
            const response = await fetch(`/api/git/${gitSettings.provider}/push`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: formData,
            });

            setProgress(50);
            setStatusMessage('Dateien werden gepusht...');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Push fehlgeschlagen');
            }

            const result = await response.json();
            setProgress(100);
            setStatusMessage('Push erfolgreich!');
            setPushResult(result);
            setStep('success');

            if (onSuccess) {
                onSuccess();
            }

        } catch (err: any) {
            setError(err.message || 'Ein unbekannter Fehler ist aufgetreten');
            setStep('error');
        }
    };

    const handleClose = () => {
        setStep('confirm');
        setProgress(0);
        setError('');
        setPushResult(null);
        onHide();
    };

    const getWorkflowDescription = () => {
        if (autoMerge) {
            return 'Push + Pull Request + Auto-Merge';
        } else if (createPr) {
            return 'Push + Pull Request erstellen';
        }
        return 'Nur Push (kein PR)';
    };

    if (!gitSettings?.is_configured) {
        return (
            <Dialog
                header="Git Push"
                visible={visible}
                onHide={handleClose}
                style={{ width: '500px' }}
                modal
                closable
            >
                <Message
                    severity="warn"
                    text="Git-Integration ist für dieses Projekt nicht konfiguriert. Bitte konfigurieren Sie zuerst die Git-Einstellungen in den Projekt-Einstellungen."
                    className="w-full"
                />
                <div className="flex justify-end mt-4">
                    <Button label="Schließen" icon="pi pi-times" onClick={handleClose} />
                </div>
            </Dialog>
        );
    }

    return (
        <Dialog
            header={
                step === 'confirm' ? 'Code zu Git pushen' :
                step === 'pushing' ? 'Push wird ausgeführt...' :
                step === 'success' ? 'Push erfolgreich!' :
                'Push fehlgeschlagen'
            }
            visible={visible}
            onHide={handleClose}
            style={{ width: '600px' }}
            modal
            closable={step !== 'pushing'}
            draggable
            resizable
        >
            <div className="space-y-4">
                {/* Confirm Step */}
                {step === 'confirm' && (
                    <>
                        {/* Git Info Summary */}
                        <div className="p-3 bg-gray-800 border border-gray-700 rounded">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-gray-400">Provider:</div>
                                <div className="text-white font-medium">
                                    <i className={`pi pi-${gitSettings.provider === 'github' ? 'github' : 'gitlab'} mr-2`}></i>
                                    {gitSettings.provider_username}
                                </div>
                                <div className="text-gray-400">Repository:</div>
                                <div className="text-white font-medium">{gitSettings.repository}</div>
                            </div>
                        </div>

                        {/* Branch */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                <i className="pi pi-code-branch mr-2"></i>Branch
                            </label>
                            <InputText
                                value={branchName}
                                onChange={(e) => setBranchName(e.target.value)}
                                placeholder="feature/scoriet-generated"
                                className="w-full"
                            />
                        </div>

                        {/* Commit Message */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                <i className="pi pi-comment mr-2"></i>Commit-Nachricht
                            </label>
                            <InputTextarea
                                value={commitMessage}
                                onChange={(e) => setCommitMessage(e.target.value)}
                                rows={2}
                                className="w-full"
                            />
                        </div>

                        {/* Workflow Options */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    inputId="createPr"
                                    checked={createPr}
                                    onChange={(e) => {
                                        setCreatePr(e.checked ?? false);
                                        if (!e.checked) setAutoMerge(false);
                                    }}
                                />
                                <label htmlFor="createPr" className="text-sm text-gray-300 cursor-pointer">
                                    Pull Request erstellen
                                </label>
                            </div>

                            {createPr && (
                                <>
                                    <div className="ml-6 flex items-center gap-3">
                                        <Checkbox
                                            inputId="autoMerge"
                                            checked={autoMerge}
                                            onChange={(e) => setAutoMerge(e.checked ?? false)}
                                        />
                                        <label htmlFor="autoMerge" className="text-sm text-gray-300 cursor-pointer">
                                            Automatisch mergen (Vorsicht!)
                                        </label>
                                    </div>

                                    {autoMerge && (
                                        <div className="ml-6 p-2 bg-red-900 border border-red-700 rounded text-red-100 text-sm">
                                            <i className="pi pi-exclamation-triangle mr-2"></i>
                                            Der PR wird automatisch in <strong>{gitSettings.main_branch}</strong> gemerged!
                                        </div>
                                    )}

                                    {/* PR Title */}
                                    <div className="ml-6">
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            PR Titel
                                        </label>
                                        <InputText
                                            value={prTitle}
                                            onChange={(e) => setPrTitle(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>

                                    {/* PR Description */}
                                    <div className="ml-6">
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            PR Beschreibung
                                        </label>
                                        <InputTextarea
                                            value={prDescription}
                                            onChange={(e) => setPrDescription(e.target.value)}
                                            rows={3}
                                            className="w-full"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Workflow Summary */}
                        <div className="p-3 bg-blue-900 border border-blue-700 rounded text-blue-100 text-sm">
                            <i className="pi pi-info-circle mr-2"></i>
                            Workflow: <strong>{getWorkflowDescription()}</strong>
                        </div>
                    </>
                )}

                {/* Pushing Step */}
                {step === 'pushing' && (
                    <div className="py-4">
                        <ProgressBar value={progress} className="mb-4" />
                        <div className="text-center text-gray-300">
                            <i className="pi pi-spin pi-spinner mr-2"></i>
                            {statusMessage}
                        </div>
                    </div>
                )}

                {/* Success Step */}
                {step === 'success' && pushResult && (
                    <div className="py-4">
                        <div className="text-center mb-4">
                            <i className="pi pi-check-circle text-6xl text-green-500"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-green-400 text-center mb-4">
                            Code erfolgreich gepusht!
                        </h3>
                        <div className="space-y-2 text-sm">
                            {pushResult.commit_sha && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Commit:</span>
                                    <code className="text-white">{pushResult.commit_sha.substring(0, 8)}</code>
                                </div>
                            )}
                            {pushResult.branch && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Branch:</span>
                                    <span className="text-white">{pushResult.branch}</span>
                                </div>
                            )}
                            {pushResult.pr_url && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Pull Request:</span>
                                    <a
                                        href={pushResult.pr_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300"
                                    >
                                        #{pushResult.pr_number} <i className="pi pi-external-link ml-1"></i>
                                    </a>
                                </div>
                            )}
                            {pushResult.merged && (
                                <div className="p-2 bg-green-900 border border-green-700 rounded text-green-100 text-center">
                                    <i className="pi pi-check mr-2"></i>
                                    PR wurde automatisch gemerged
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Error Step */}
                {step === 'error' && (
                    <div className="py-4">
                        <div className="text-center mb-4">
                            <i className="pi pi-times-circle text-6xl text-red-500"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-red-400 text-center mb-2">
                            Push fehlgeschlagen
                        </h3>
                        <Message severity="error" text={error} className="w-full" />
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    {step === 'confirm' && (
                        <>
                            <Button
                                label="Abbrechen"
                                icon="pi pi-times"
                                onClick={handleClose}
                                className="p-button-text"
                            />
                            <Button
                                label="Push starten"
                                icon="pi pi-cloud-upload"
                                onClick={handlePush}
                                disabled={!branchName || !commitMessage}
                                severity="success"
                            />
                        </>
                    )}

                    {step === 'success' && (
                        <Button
                            label="Schließen"
                            icon="pi pi-check"
                            onClick={handleClose}
                        />
                    )}

                    {step === 'error' && (
                        <>
                            <Button
                                label="Erneut versuchen"
                                icon="pi pi-refresh"
                                onClick={() => setStep('confirm')}
                                className="p-button-text"
                            />
                            <Button
                                label="Schließen"
                                icon="pi pi-times"
                                onClick={handleClose}
                            />
                        </>
                    )}
                </div>
            </div>
        </Dialog>
    );
}
