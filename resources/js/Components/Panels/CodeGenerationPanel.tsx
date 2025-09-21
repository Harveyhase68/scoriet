import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { Message } from 'primereact/message';

// interface TabPanelProps {
//   isActive: boolean;
// }

interface GeneratedFile {
  filename: string;
  content: string;
  content_clean: string;
  type: string;
  table: string;
  table_index: number;
  fields_count: number;
}

interface GTreeData {
  gtree: Array<{
    project: Array<{
      projectname: string;
      nmaxfiles: number;
      tables: Array<{
        tablename: string;
        nmaxitems: number;
        items: Array<{
          name: string;
          type: string;
          controltype: number;
        }>;
      }>;
    }>;
  }>;
  generated_files: GeneratedFile[];
}

export default function CodeGenerationPanel() {
  const [templateId, setTemplateId] = useState<string>('1');
  const [tableIndex, setTableIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [generationData, setGenerationData] = useState<GTreeData | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [executionResult, setExecutionResult] = useState<string>('');
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [generatedCodeFiles, setGeneratedCodeFiles] = useState<{filename: string, content: string}[]>([]);

  const generateCode = async () => {
    if (!templateId) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/template-process/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGenerationData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to generate code');
      }
    } catch (err) {
      console.error('Error generating code:', err);
      setError('Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  const executeJavaScript = () => {
    if (!generationData || !generationData.generated_files) return;

    const tableFiles = generationData.generated_files.filter(f => f.table && f.table_index === tableIndex);
    if (tableFiles.length === 0) {
      setExecutionResult('No files found for selected table index');
      return;
    }

    try {
      // Get the gtree data and selected file
      const gtree = generationData.gtree;
      const selectedFile = tableFiles[0];

      let result = `// Executing JavaScript function for: ${selectedFile.filename}\n`;
      result += `// Table: ${selectedFile.table} (Index: ${tableIndex})\n\n`;

      // Execute the JavaScript function
      try {
        // Parse the function from the content
        const functionMatch = selectedFile.content.match(/function\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*)\}/);
        if (functionMatch) {
          const [, functionName, functionBody] = functionMatch;

          // Simple JavaScript interpretation for sContentResult
          const lines = functionBody.split('\n');
          let sContentResult = '';

          for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.startsWith('sContentResult +=')) {
              // Extract the string being added
              const stringMatch = trimmed.match(/sContentResult\s*\+=\s*'([^']*)';\s*$/);
              if (stringMatch) {
                let content = stringMatch[1];
                // Replace \\n with actual newlines
                content = content.replace(/\\n/g, '\n');
                sContentResult += content;
              }
            } else if (trimmed.includes('for (let i = 0; i < gtree[0].project[0].tables[')) {
              // Handle loops - execute for each item in the table
              const table = gtree[0]?.project?.[0]?.tables?.[tableIndex];
              if (table && table.items) {
                // Process field loop lines following this for loop
                let loopContent = '';
                const nextLines = lines.slice(lines.indexOf(line) + 1);

                for (const nextLine of nextLines) {
                  const nextTrimmed = nextLine.trim();
                  if (nextTrimmed === '}') break;

                  if (nextTrimmed.startsWith('sContentResult +=')) {
                    const loopStringMatch = nextTrimmed.match(/sContentResult\s*\+=\s*'([^']*)';\s*$/);
                    if (loopStringMatch) {
                      loopContent = loopStringMatch[1];
                      break;
                    }
                  }
                }

                // Execute the loop for each field
                table.items.forEach((item) => {
                  let fieldLine = loopContent;
                  fieldLine = fieldLine.replace(/\\n/g, '\n');
                  // Replace any remaining template variables with actual values
                  fieldLine = fieldLine.replace(/gtree\[0\]\.project\[0\]\.tables\[\d+\]\.items\[i\]\.name/g, item.name);
                  fieldLine = fieldLine.replace(/gtree\[0\]\.project\[0\]\.tables\[\d+\]\.items\[i\]\.type/g, item.type);
                  fieldLine = fieldLine.replace(/gtree\[0\]\.project\[0\]\.tables\[\d+\]\.items\[i\]\.controltype/g, item.controltype.toString());
                  sContentResult += fieldLine;
                });
              }
            }
          }

          result += `Generated Code Output:\n`;
          result += `${'='.repeat(50)}\n`;
          result += sContentResult;
          result += `\n${'='.repeat(50)}\n`;
          result += `\nExecution completed successfully!\n`;
          result += `Function: ${functionName}\n`;
          result += `Content length: ${sContentResult.length} characters\n`;
          result += `Table fields processed: ${gtree[0]?.project?.[0]?.tables?.[tableIndex]?.items?.length || 0}\n`;
        } else {
          result += 'Could not parse JavaScript function\n\n';
          result += 'Raw content:\n';
          result += selectedFile.content;
        }

      } catch (execError) {
        result += `Function execution error: ${execError}\n`;
        result += `\nFunction content:\n${selectedFile.content}`;
      }

      setExecutionResult(result);
    } catch (err) {
      setExecutionResult(`Execution Error: ${err}`);
    }
  };

  const executeAllJavaScriptFunctions = () => {
    if (!generationData || !generationData.generated_files) return;

    setBatchProcessing(true);
    const generatedFiles: {filename: string, content: string}[] = [];
    let progressLog = 'Starting batch execution of all 278 JavaScript functions...\n\n';

    try {
      const gtree = generationData.gtree;

      generationData.generated_files.forEach((file, index) => {
        try {
          progressLog += `Processing ${index + 1}/${generationData.generated_files.length}: ${file.filename}\n`;

          // Parse and execute each JavaScript function
          const functionMatch = file.content.match(/function\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*)\}/);
          if (functionMatch) {
            const [, , functionBody] = functionMatch;
            const lines = functionBody.split('\n');
            let sContentResult = '';

            for (const line of lines) {
              const trimmed = line.trim();

              if (trimmed.startsWith('sContentResult +=')) {
                const stringMatch = trimmed.match(/sContentResult\s*\+=\s*'([^']*)';\s*$/);
                if (stringMatch) {
                  let content = stringMatch[1];
                  content = content.replace(/\\n/g, '\n');
                  sContentResult += content;
                }
              } else if (trimmed.includes('for (let i = 0; i < gtree[0].project[0].tables[')) {
                // Extract table index from the line
                const tableIndexMatch = trimmed.match(/tables\[(\d+)\]/);
                if (tableIndexMatch) {
                  const currentTableIndex = parseInt(tableIndexMatch[1]);
                  const table = gtree[0]?.project?.[0]?.tables?.[currentTableIndex];

                  if (table && table.items) {
                    // Find loop content
                    let loopContent = '';
                    const nextLines = lines.slice(lines.indexOf(line) + 1);

                    for (const nextLine of nextLines) {
                      const nextTrimmed = nextLine.trim();
                      if (nextTrimmed === '}') break;

                      if (nextTrimmed.startsWith('sContentResult +=')) {
                        const loopStringMatch = nextTrimmed.match(/sContentResult\s*\+=\s*'([^']*)';\s*$/);
                        if (loopStringMatch) {
                          loopContent = loopStringMatch[1];
                          break;
                        }
                      }
                    }

                    // Execute loop for each field
                    table.items.forEach((item) => {
                      let fieldLine = loopContent.replace(/\\n/g, '\n');
                      fieldLine = fieldLine.replace(/gtree\[0\]\.project\[0\]\.tables\[\d+\]\.items\[i\]\.name/g, item.name);
                      fieldLine = fieldLine.replace(/gtree\[0\]\.project\[0\]\.tables\[\d+\]\.items\[i\]\.type/g, item.type);
                      fieldLine = fieldLine.replace(/gtree\[0\]\.project\[0\]\.tables\[\d+\]\.items\[i\]\.controltype/g, item.controltype.toString());
                      sContentResult += fieldLine;
                    });
                  }
                }
              }
            }

            // Store the generated file content
            generatedFiles.push({
              filename: file.filename,
              content: sContentResult
            });

            progressLog += `✓ Generated ${sContentResult.length} characters\n`;
          } else {
            progressLog += `⚠ Could not parse function in ${file.filename}\n`;
          }
        } catch (fileError) {
          progressLog += `✗ Error processing ${file.filename}: ${fileError}\n`;
        }
      });

      progressLog += `\n🎉 Batch execution completed!\n`;
      progressLog += `Generated ${generatedFiles.length} files\n`;
      progressLog += `Total characters: ${generatedFiles.reduce((sum, f) => sum + f.content.length, 0)}\n`;

      setGeneratedCodeFiles(generatedFiles);
      setExecutionResult(progressLog);
    } catch (err) {
      setExecutionResult(`Batch execution error: ${err}\n\n${progressLog}`);
    } finally {
      setBatchProcessing(false);
    }
  };

  const downloadAsZip = async () => {
    if (generatedCodeFiles.length === 0) {
      alert('No generated files to download. Please execute all functions first.');
      return;
    }

    try {
      // Create a simple text file with all content (later we can use JSZip)
      let allContent = '# Generated Code Files from Template System\n\n';
      allContent += `Generated: ${new Date().toISOString()}\n`;
      allContent += `Template ID: ${templateId}\n`;
      allContent += `Total Files: ${generatedCodeFiles.length}\n\n`;

      generatedCodeFiles.forEach((file, index) => {
        allContent += `${'='.repeat(80)}\n`;
        allContent += `File ${index + 1}: ${file.filename}\n`;
        allContent += `${'='.repeat(80)}\n`;
        allContent += file.content;
        allContent += '\n\n';
      });

      // Create and download the file
      const blob = new Blob([allContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-code-${templateId}-${new Date().getTime()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`Downloaded ${generatedCodeFiles.length} generated files as text file!`);
    } catch (err) {
      alert(`Download error: ${err}`);
    }
  };

  const tableOptions = generationData?.gtree?.[0]?.project?.[0]?.tables?.map((table, index) => ({
    label: `${index}: ${table.tablename} (${table.nmaxitems} fields)`,
    value: index
  })) || [];

  const selectedFile = generationData?.generated_files?.find(f => f.table_index === tableIndex && f.type === 'template');

  return (
    <div className="h-full bg-gray-800 text-gray-100 p-4">
      <Card className="h-full bg-gray-700 border-gray-600">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Code Generation Test Panel</h2>

          {/* Input Controls */}
          <div className="flex space-x-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-white mb-2">
                Template ID
              </label>
              <InputText
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                placeholder="Enter template ID (e.g., 1)"
                className="w-full"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-white mb-2">
                Table Index
              </label>
              <Dropdown
                value={tableIndex}
                options={tableOptions}
                onChange={(e) => setTableIndex(e.value)}
                placeholder="Select table"
                className="w-full"
                disabled={!generationData}
              />
            </div>

            <Button
              label={loading ? "Generating..." : "Generate Code"}
              icon={loading ? "pi pi-spinner pi-spin" : "pi pi-cog"}
              onClick={generateCode}
              disabled={loading || !templateId}
              className="bg-blue-600 hover:bg-blue-700"
            />
          </div>

          {error && (
            <Message severity="error" text={error} className="w-full" />
          )}

          {/* Generation Summary */}
          {generationData && (
            <div className="bg-gray-800 p-3 rounded border border-gray-600">
              <div className="text-sm text-gray-300">
                <strong>Generation Summary:</strong> {generationData.generation_summary?.total_generated_files} files,
                {generationData.generation_summary?.tables_processed} tables processed
              </div>
            </div>
          )}

          {/* Tab System */}
          {selectedFile && (
            <TabView
              activeIndex={activeTabIndex}
              onTabChange={(e) => setActiveTabIndex(e.index)}
              className="bg-gray-700"
            >
              <TabPanel header="Clean JavaScript" className="text-gray-100">
                <div className="bg-gray-900 p-4 rounded border border-gray-600 max-h-96 overflow-auto">
                  <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono">
                    {selectedFile.content_clean || selectedFile.content}
                  </pre>
                </div>
              </TabPanel>

              <TabPanel header="Execution Result" className="text-gray-100">
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Button
                      label="Execute Single File"
                      icon="pi pi-play"
                      onClick={executeJavaScript}
                      className="bg-green-600 hover:bg-green-700"
                      size="small"
                    />

                    <Button
                      label={batchProcessing ? "Processing All 278..." : "Execute All Files"}
                      icon={batchProcessing ? "pi pi-spinner pi-spin" : "pi pi-cog"}
                      onClick={executeAllJavaScriptFunctions}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="small"
                      disabled={batchProcessing}
                    />

                    <Button
                      label="Download ZIP"
                      icon="pi pi-download"
                      onClick={downloadAsZip}
                      className="bg-purple-600 hover:bg-purple-700"
                      size="small"
                      disabled={generatedCodeFiles.length === 0}
                    />
                  </div>

                  {generatedCodeFiles.length > 0 && (
                    <div className="bg-green-900 p-2 rounded border border-green-600 text-sm">
                      🎉 Ready for download: {generatedCodeFiles.length} files generated
                    </div>
                  )}

                  <div className="bg-gray-900 p-4 rounded border border-gray-600 max-h-96 overflow-auto">
                    <pre className="text-sm text-yellow-400 whitespace-pre-wrap font-mono">
                      {executionResult || 'Click "Execute Single File" or "Execute All Files" to see results...'}
                    </pre>
                  </div>
                </div>
              </TabPanel>
            </TabView>
          )}

          {/* Performance Info */}
          {generationData && (
            <div className="bg-blue-900 p-3 rounded border border-blue-600">
              <div className="text-sm text-blue-200">
                <strong>Performance:</strong> {generationData.performance?.single_request} -
                {generationData.performance?.total_content_size}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}