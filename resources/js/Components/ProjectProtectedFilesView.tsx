import React from 'react';
//import { useTranslation } from '@/i18n';
import { ProtectedFilesEditor } from './ProtectedFilesEditor';
import { useTheme } from '@/contexts/ThemeContext';

interface Template {
  id: number;
  name: string;
  protected_files?: string[];
}

interface ProjectProtectedFilesViewProps {
  templates: Template[];
  projectProtectedFiles: string[];
  onProjectProtectedFilesChange: (files: string[]) => void;
  readOnly?: boolean;
}

export const ProjectProtectedFilesView: React.FC<ProjectProtectedFilesViewProps> = ({
  templates,
  projectProtectedFiles,
  onProjectProtectedFilesChange,
  readOnly = false
}) => {
  //const { t } = useTranslation('en');
  const { colors } = useTheme();

  // Check if file exists (this would need to be implemented via API)
  const checkFileExists = (_filename: string): boolean => {
    // TODO: Implement via API call to check if file exists in project directory
    return false;
  };

  return (
    <div className="project-protected-files-view">
      {/* Templates Protected Files (Read-only) */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3 theme-text-primary">Protected Files from Templates</h3>
        <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}`, color: colors.infoText }}>
          These files are protected by the templates linked to this project. They cannot be edited here.
        </div>

        {!Array.isArray(templates) || templates.length === 0 ? (
          <div className="italic p-3 text-center border border-dashed rounded theme-text-muted theme-border-primary">
            No templates linked
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border theme-border-primary" style={{ borderColor: colors.borderPrimary }}>
              <thead>
                <tr style={{ backgroundColor: colors.bgTertiary }}>
                  <th className="border px-4 py-2 text-left theme-text-secondary" style={{ borderColor: colors.borderPrimary }}>Template</th>
                  <th className="border px-4 py-2 text-left theme-text-secondary" style={{ borderColor: colors.borderPrimary }}>Protected File</th>
                  <th className="border px-4 py-2 text-center theme-text-secondary" style={{ borderColor: colors.borderPrimary }}>Exists on Disk</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(templates) && templates.flatMap((template) =>
                  (template.protected_files || []).length === 0 ? (
                    <tr key={`${template.id}-empty`}>
                      <td className="border px-4 py-2 theme-text-primary" style={{ borderColor: colors.borderPrimary }}>{template.name}</td>
                      <td className="border px-4 py-2 italic theme-text-muted" style={{ borderColor: colors.borderPrimary }} colSpan={2}>
                        No protected files
                      </td>
                    </tr>
                  ) : (
                    (template.protected_files || []).map((file, index) => (
                      <tr key={`${template.id}-${index}`} className="transition-colors" style={{ backgroundColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td className="border px-4 py-2 theme-text-primary" style={{ borderColor: colors.borderPrimary }}>{template.name}</td>
                        <td className="border px-4 py-2 font-mono text-sm theme-text-primary" style={{ borderColor: colors.borderPrimary }}>{file}</td>
                        <td className="border px-4 py-2 text-center" style={{ borderColor: colors.borderPrimary }}>
                          {checkFileExists(file) ? (
                            <span style={{ color: colors.successText }} className="font-bold">✓ Yes</span>
                          ) : (
                            <span className="theme-text-muted">✗ No</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Project-Specific Protected Files (Editable) */}
      <div>
        <ProtectedFilesEditor
          files={projectProtectedFiles}
          onChange={onProjectProtectedFilesChange}
          readOnly={readOnly}
          title="Project-Specific Protected Files"
        />
        <div className="mt-3 p-3 rounded text-sm" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningBorder}`, color: colors.warningText }}>
          <strong>Note:</strong> These are additional files specific to this project that should be protected during updates.
          They will be combined with the template protected files.
        </div>
      </div>
    </div>
  );
};
