import React, { useState } from 'react';
//import { useTranslation } from '@/i18n';
//import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

export interface ScriptStep {
  step: number;
  description: string;
  command: string;
}

interface DeploymentScriptsEditorProps {
  installScript: ScriptStep[];
  updateScript: ScriptStep[];
  onInstallScriptChange: (steps: ScriptStep[]) => void;
  onUpdateScriptChange: (steps: ScriptStep[]) => void;
  readOnly?: boolean;
}

export const DeploymentScriptsEditor: React.FC<DeploymentScriptsEditorProps> = ({
  installScript,
  updateScript,
  onInstallScriptChange,
  onUpdateScriptChange,
  readOnly = false
}) => {
  //const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  //const { t } = useTranslation(currentLanguage);
  const [editingInstall, setEditingInstall] = useState<number | null>(null);
  const [editingUpdate, setEditingUpdate] = useState<number | null>(null);

  const addStep = (isInstall: boolean) => {
    const currentSteps = isInstall ? installScript : updateScript;
    const newStep: ScriptStep = {
      step: currentSteps.length + 1,
      description: '',
      command: ''
    };

    if (isInstall) {
      onInstallScriptChange([...currentSteps, newStep]);
      setEditingInstall(currentSteps.length);
    } else {
      onUpdateScriptChange([...currentSteps, newStep]);
      setEditingUpdate(currentSteps.length);
    }
  };

  const removeStep = (index: number, isInstall: boolean) => {
    const currentSteps = isInstall ? installScript : updateScript;
    const newSteps = currentSteps
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, step: i + 1 })); // Renumber

    if (isInstall) {
      onInstallScriptChange(newSteps);
    } else {
      onUpdateScriptChange(newSteps);
    }
  };

  const moveStep = (index: number, direction: 'up' | 'down', isInstall: boolean) => {
    const currentSteps = isInstall ? installScript : updateScript;
    const newSteps = [...currentSteps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newSteps.length) return;

    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];

    // Renumber
    const renumbered = newSteps.map((step, i) => ({ ...step, step: i + 1 }));

    if (isInstall) {
      onInstallScriptChange(renumbered);
    } else {
      onUpdateScriptChange(renumbered);
    }
  };

  const updateStep = (index: number, field: keyof ScriptStep, value: string, isInstall: boolean) => {
    const currentSteps = isInstall ? installScript : updateScript;
    const newSteps = [...currentSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };

    if (isInstall) {
      onInstallScriptChange(newSteps);
    } else {
      onUpdateScriptChange(newSteps);
    }
  };

  const renderStepList = (steps: ScriptStep[], isInstall: boolean) => {
    const editing = isInstall ? editingInstall : editingUpdate;
    const setEditing = isInstall ? setEditingInstall : setEditingUpdate;

    return (
      <div className="space-y-3">
        {steps.length === 0 ? (
          <div className="text-gray-400 italic p-3 text-center border border-dashed border-gray-600 rounded">
            No steps defined
          </div>
        ) : (
          steps.map((step, index) => (
            <div
              key={index}
              className="p-4 bg-gray-700 border border-gray-600 rounded hover:border-gray-500 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-gray-200">Step {step.step}:</span>
                    {editing === index && !readOnly ? (
                      <input
                        type="text"
                        value={step.description}
                        onChange={(e) => updateStep(index, 'description', e.target.value, isInstall)}
                        placeholder="Description (e.g., Install dependencies)"
                        className="flex-1 px-2 py-1 border border-gray-600 rounded bg-gray-800 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span
                        className="flex-1 cursor-pointer text-gray-200 hover:text-blue-400"
                        onClick={() => !readOnly && setEditing(index)}
                      >
                        {step.description || <span className="italic text-gray-400">No description</span>}
                      </span>
                    )}
                  </div>

                  {editing === index && !readOnly ? (
                    <textarea
                      value={step.command}
                      onChange={(e) => updateStep(index, 'command', e.target.value, isInstall)}
                      placeholder="Command(s) - one per line (e.g., npm install)"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-800 text-gray-100 placeholder-gray-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <pre
                      className="bg-gray-800 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto cursor-pointer hover:bg-gray-700"
                      onClick={() => !readOnly && setEditing(index)}
                    >
                      {step.command || <span className="italic text-gray-500">No command</span>}
                    </pre>
                  )}
                </div>

                {!readOnly && (
                  <div className="flex flex-col gap-1 ml-2">
                    <button
                      type="button"
                      onClick={() => moveStep(index, 'up', isInstall)}
                      disabled={index === 0}
                      className="px-2 py-1 text-sm bg-gray-600 text-gray-100 rounded hover:bg-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(index, 'down', isInstall)}
                      disabled={index === steps.length - 1}
                      className="px-2 py-1 text-sm bg-gray-600 text-gray-100 rounded hover:bg-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(index, isInstall)}
                      className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {editing === index && !readOnly && (
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="mt-2 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Done Editing
                </button>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="deployment-scripts-editor">
      <div className="mb-6 p-3 bg-blue-900 border border-blue-700 rounded text-sm text-blue-100">
        <strong>Info:</strong> These scripts guide users through installation and updates.
        Commands can be shell scripts, npm commands, build tools, or manual instructions.
      </div>

      {/* Install Script */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Install Script</h3>
          {!readOnly && (
            <button
              type="button"
              onClick={() => addStep(true)}
              disabled={editingInstall !== null || editingUpdate !== null}
              className={`px-4 py-2 rounded transition ${
                editingInstall !== null || editingUpdate !== null
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              + Add Step
            </button>
          )}
        </div>
        {renderStepList(installScript, true)}
      </div>

      {/* Update Script */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Update Script</h3>
          {!readOnly && (
            <button
              type="button"
              onClick={() => addStep(false)}
              disabled={editingInstall !== null || editingUpdate !== null}
              className={`px-4 py-2 rounded transition ${
                editingInstall !== null || editingUpdate !== null
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              + Add Step
            </button>
          )}
        </div>
        {renderStepList(updateScript, false)}
      </div>
    </div>
  );
};
