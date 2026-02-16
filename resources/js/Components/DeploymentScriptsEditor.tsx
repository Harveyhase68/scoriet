import React, { useState } from 'react';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { colors } = useTheme();
  const [editingInstall, setEditingInstall] = useState<number | null>(null);
  const [editingUpdate, setEditingUpdate] = useState<number | null>(null);
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  
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
      // Reset editing state if the removed step was being edited
      if (editingInstall === index || editingInstall !== null) {
        setEditingInstall(null);
      }
    } else {
      onUpdateScriptChange(newSteps);
      // Reset editing state if the removed step was being edited
      if (editingUpdate === index || editingUpdate !== null) {
        setEditingUpdate(null);
      }
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
          <div className="italic p-3 text-center border border-dashed rounded theme-text-muted theme-border-primary">
            {t.deploymentscriptseditor113}
          </div>
        ) : (
          steps.map((step, index) => (
            <div
              key={index}
              className="p-4 rounded transition"
              style={{
                backgroundColor: colors.bgTertiary,
                border: `1px solid ${colors.borderPrimary}`,
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold theme-text-primary">Step {step.step}:</span>
                    {editing === index && !readOnly ? (
                      <input
                        type="text"
                        value={step.description}
                        onChange={(e) => updateStep(index, 'description', e.target.value, isInstall)}
                        placeholder="Description (e.g., Install dependencies)"
                        className="flex-1 px-2 py-1 border rounded focus:outline-none"
                        style={{
                          backgroundColor: colors.bgSecondary,
                          color: colors.textPrimary,
                          borderColor: colors.borderPrimary,
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = colors.accent;
                          e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.accent}40`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = colors.borderPrimary;
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    ) : (
                      <span
                        className="flex-1 cursor-pointer theme-text-primary"
                        style={{ color: colors.textPrimary }}
                        onClick={() => !readOnly && setEditing(index)}
                        onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
                        onMouseLeave={(e) => e.currentTarget.style.color = colors.textPrimary}
                      >
                        {step.description || <span className="italic theme-text-muted">No description</span>}
                      </span>
                    )}
                  </div>

                  {editing === index && !readOnly ? (
                    <textarea
                      value={step.command}
                      onChange={(e) => updateStep(index, 'command', e.target.value, isInstall)}
                      placeholder={t.deploymentscriptseditor167}
                      rows={4}
                      className="w-full px-3 py-2 border rounded font-mono text-sm focus:outline-none"
                      style={{
                        backgroundColor: colors.bgSecondary,
                        color: colors.textPrimary,
                        borderColor: colors.borderPrimary,
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = colors.accent;
                        e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.accent}40`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = colors.borderPrimary;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  ) : (
                    <pre
                      className="p-3 rounded font-mono text-xs overflow-x-auto cursor-pointer transition"
                      style={{
                        backgroundColor: colors.bgSecondary,
                        color: colors.successText,
                      }}
                      onClick={() => !readOnly && setEditing(index)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.bgSecondary}
                    >
                      {step.command || <span className="italic theme-text-muted">No command</span>}
                    </pre>
                  )}
                </div>

                {!readOnly && (
                  <div className="flex flex-col gap-1 ml-2">
                    <button
                      type="button"
                      onClick={() => moveStep(index, 'up', isInstall)}
                      disabled={index === 0}
                      className="px-2 py-1 text-sm rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                      style={{
                        backgroundColor: colors.buttonSecondary,
                        color: colors.textPrimary,
                      }}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(index, 'down', isInstall)}
                      disabled={index === steps.length - 1}
                      className="px-2 py-1 text-sm rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                      style={{
                        backgroundColor: colors.buttonSecondary,
                        color: colors.textPrimary,
                      }}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(index, isInstall)}
                      className="px-2 py-1 text-sm rounded transition"
                      style={{
                        backgroundColor: colors.buttonDanger,
                        color: colors.textInverse,
                      }}
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
                  className="mt-2 px-3 py-1 text-sm rounded transition"
                  style={{
                    backgroundColor: colors.buttonSuccess,
                    color: colors.textInverse,
                  }}
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
      <div className="mb-6 p-3 rounded text-sm" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}`, color: colors.infoText }}>
        <strong>Info:</strong>{t.deploymentscriptseditor267}
        {t.deploymentscriptseditor268}
      </div>

      {/* Install Script */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold theme-text-primary">Install Script</h3>
          {!readOnly && (
            <button
              type="button"
              onClick={() => addStep(true)}
              disabled={editingInstall !== null || editingUpdate !== null}
              className="px-4 py-2 rounded transition"
              style={{
                backgroundColor: editingInstall !== null || editingUpdate !== null ? colors.buttonSecondary : colors.buttonPrimary,
                color: editingInstall !== null || editingUpdate !== null ? colors.textMuted : colors.textInverse,
                cursor: editingInstall !== null || editingUpdate !== null ? 'not-allowed' : 'pointer',
              }}
            >
             {t.deploymentscriptseditor287}
            </button>
          )}
        </div>
        {renderStepList(installScript, true)}
      </div>

      {/* Update Script */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold theme-text-primary">Update Script</h3>
          {!readOnly && (
            <button
              type="button"
              onClick={() => addStep(false)}
              disabled={editingInstall !== null || editingUpdate !== null}
              className="px-4 py-2 rounded transition"
              style={{
                backgroundColor: editingInstall !== null || editingUpdate !== null ? colors.buttonSecondary : colors.buttonPrimary,
                color: editingInstall !== null || editingUpdate !== null ? colors.textMuted : colors.textInverse,
                cursor: editingInstall !== null || editingUpdate !== null ? 'not-allowed' : 'pointer',
              }}
            >
              {t.deploymentscriptseditor310}
            </button>
          )}
        </div>
        {renderStepList(updateScript, false)}
      </div>
    </div>
  );
};
