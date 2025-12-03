import React from 'react';
//import { useTranslation } from '@/i18n';
import { ProtectedFilesEditor } from './ProtectedFilesEditor';

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

  // Check if file exists (this would need to be implemented via API)
  const checkFileExists = (_filename: string): boolean => {
    // TODO: Implement via API call to check if file exists in project directory
    return false;
  };

  return (
    <div className="project-protected-files-view">
      {/* Templates Protected Files (Read-only) */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Protected Files from Templates</h3>
        <div className="mb-4 p-3 bg-blue-900 border border-blue-700 rounded text-sm text-blue-100">
          These files are protected by the templates linked to this project. They cannot be edited here.
        </div>

        {!Array.isArray(templates) || templates.length === 0 ? (
          <div className="text-gray-500 italic p-3 text-center border border-dashed border-gray-600 rounded">
            No templates linked
          </div>
        ) : (
          <div className="overflow-x-auto border-gray-600">
            <table className="w-full border-collapse border border-gray-600">
              <thead>
                <tr className="bg-gray-800">
                  <th className="border border-gray-600 px-4 py-2 text-left text-gray-300">Template</th>
                  <th className="border border-gray-600 px-4 py-2 text-left text-gray-300">Protected File</th>
                  <th className="border border-gray-600 px-4 py-2 text-center text-gray-300">Exists on Disk</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(templates) && templates.flatMap((template) =>
                  (template.protected_files || []).length === 0 ? (
                    <tr key={`${template.id}-empty`}>
                      <td className="border border-gray-600 px-4 py-2">{template.name}</td>
                      <td className="border border-gray-600 px-4 py-2 italic text-gray-300" colSpan={2}>
                        No protected files
                      </td>
                    </tr>
                  ) : (
                    (template.protected_files || []).map((file, index) => (
                      <tr key={`${template.id}-${index}`} className="hover:bg-gray-700">
                        <td className="border border-gray-600 px-4 py-2">{template.name}</td>
                        <td className="border border-gray-600 px-4 py-2 font-mono text-sm">{file}</td>
                        <td className="border border-gray-600 px-4 py-2 text-center">
                          {checkFileExists(file) ? (
                            <span className="text-green-300 font-bold">✓ Yes</span>
                          ) : (
                            <span className="text-gray-300">✗ No</span>
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
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          <strong>Note:</strong> These are additional files specific to this project that should be protected during updates.
          They will be combined with the template protected files.
        </div>
      </div>
    </div>
  );
};
