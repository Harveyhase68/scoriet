/**
 * Template Processor Service
 * Processes template files with {code} blocks and placeholders
 */

interface TemplateChunk {
  type: 'text' | 'placeholder' | 'code';
  content: string;
  index?: number; // For code blocks: user_code_1, user_code_2, etc.
}

interface ProcessedTemplate {
  generatedFunction: string;
  error?: string;
}

export class TemplateProcessorService {
  /**
   * Parse template file and extract chunks
   */
  private static parseTemplate(templateContent: string): TemplateChunk[] {
    const chunks: TemplateChunk[] = [];
    const _currentIndex = 0; // Reserved for future use
    let codeBlockIndex = 1;

    // Regex for {code}...{codeend} blocks
    const codeBlockRegex = /\{code\}([\s\S]*?)\{codeend\}/g;

    // Find all code blocks first
    const codeBlocks: Array<{ start: number; end: number; content: string; index: number }> = [];
    let match;

    while ((match = codeBlockRegex.exec(templateContent)) !== null) {
      codeBlocks.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1].trim(),
        index: codeBlockIndex++,
      });
    }


    // Now parse the template character by character
    let i = 0;
    while (i < templateContent.length) {
      // Check if we're at a code block
      const codeBlock = codeBlocks.find(cb => cb.start === i);
      if (codeBlock) {
        chunks.push({
          type: 'code',
          content: codeBlock.content,
          index: codeBlock.index,
        });
        i = codeBlock.end;
        continue;
      }

      // Check for placeholder {something}
      if (templateContent[i] === '{') {
        const closeIndex = templateContent.indexOf('}', i);
        if (closeIndex !== -1) {
          const placeholder = templateContent.substring(i + 1, closeIndex);

          // Skip {code} and {codeend} - they're handled by code blocks
          if (placeholder === 'code' || placeholder === 'codeend') {
            i = closeIndex + 1;
            continue;
          }

          // Normal placeholder
          chunks.push({
            type: 'placeholder',
            content: placeholder,
          });
          i = closeIndex + 1;
          continue;
        }
      }

      // Regular text - collect until next special char
      let textEnd = i + 1;
      while (textEnd < templateContent.length) {
        if (templateContent[textEnd] === '{') {
          // Check if it's a code block or placeholder
          const isCodeBlock = codeBlocks.some(cb => cb.start === textEnd);
          const nextClose = templateContent.indexOf('}', textEnd);
          const isPlaceholder = nextClose !== -1 && nextClose < textEnd + 100; // Reasonable limit

          if (isCodeBlock || isPlaceholder) {
            break;
          }
        }
        textEnd++;
      }

      const text = templateContent.substring(i, textEnd);
      if (text.length > 0) {
        chunks.push({
          type: 'text',
          content: text,
        });
      }
      i = textEnd;
    }

    return chunks;
  }

  /**
   * Generate executable JavaScript function from template
   */
  public static processTemplate(
    templateContent: string,
    showSource: boolean = false
  ): ProcessedTemplate {
    try {
      const chunks = this.parseTemplate(templateContent);

      let functionCode = '';
      functionCode += 'function generateCode(gtree, table, project, showSource = false) {\n';
      functionCode += '  let sContentResult = "";\n\n';

      // Build sContentResult by processing chunks
      for (const chunk of chunks) {
        if (chunk.type === 'text') {
          // Escape quotes and newlines in text
          const escaped = chunk.content
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');

          functionCode += `  sContentResult += "${escaped}";\n`;

        } else if (chunk.type === 'placeholder') {
          // Replace common placeholders
          const placeholderMap: Record<string, string> = {
            'tablename': 'table.name',
            'projectname': 'project.name',
            'projectid': 'project.id',
            'tableid': 'table.id',
          };

          const accessor = placeholderMap[chunk.content.toLowerCase()] || `table.${chunk.content}`;
          functionCode += `  sContentResult += (${accessor} || "");\n`;

        } else if (chunk.type === 'code') {
          // Add source comment if enabled
          if (showSource) {
            functionCode += '  // Template-Quelle:\n';
            functionCode += '  // {code}\n';
            const codeLines = chunk.content.split('\n');
            for (const line of codeLines) {
              functionCode += `  // ${line}\n`;
            }
            functionCode += '  // {codeend}\n';
          }

          // Define user_code_N function inline
          functionCode += `  function user_code_${chunk.index}() {\n`;

          // Indent the user's code
          const userCodeLines = chunk.content.split('\n');
          for (const line of userCodeLines) {
            functionCode += `    ${line}\n`;
          }

          functionCode += '  }\n';

          // Call user_code function
          functionCode += `  sContentResult += (user_code_${chunk.index}() || "");\n`;
        }
      }

      functionCode += '\n  return sContentResult;\n';
      functionCode += '}\n';

      return {
        generatedFunction: functionCode,
      };

    } catch (error: any) {
      return {
        generatedFunction: '',
        error: error.message,
      };
    }
  }

  /**
   * Execute the generated function with provided data
   */
  public static executeTemplate(
    generatedFunction: string,
    gtree: any,
    table: any,
    project: any,
    showSource: boolean = false
  ): { result: string; error?: string } {
    try {
      // Execute the generated function
      const func = new Function('return ' + generatedFunction)();
      const result = func(gtree, table, project, showSource);

      return { result };
    } catch (error: any) {
      return {
        result: '',
        error: `Execution error: ${error.message}`,
      };
    }
  }

  /**
   * Complete flow: Process template and execute in one step
   */
  public static generateCode(
    templateContent: string,
    gtree: any,
    table: any,
    project: any,
    showSource: boolean = false
  ): { result: string; error?: string; generatedFunction?: string } {
    // Step 1: Process template
    const processed = this.processTemplate(templateContent, showSource);

    if (processed.error) {
      return {
        result: '',
        error: processed.error,
      };
    }

    // Step 2: Execute
    const executed = this.executeTemplate(
      processed.generatedFunction,
      gtree,
      table,
      project,
      showSource
    );

    return {
      result: executed.result,
      error: executed.error,
      generatedFunction: processed.generatedFunction,
    };
  }
}

export default TemplateProcessorService;
