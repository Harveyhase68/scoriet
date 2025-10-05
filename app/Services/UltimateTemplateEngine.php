<?php

namespace App\Services;

/**
 * 🚀 ULTIMATE SCORIET TEMPLATE ENGINE
 *
 * Diese Service-Klasse bietet erweiterte Template-Parsing-Funktionen:
 * - Verschachtelte Loops und Conditionals
 * - Template-Funktionen und Macros
 * - Multi-Language Support
 * - Performance-Optimierungen
 * - Advanced Syntax Parsing
 */
class UltimateTemplateEngine
{
    private array $gtree;
    private array $variables;
    private array $functions;
    private array $macros;
    private int $loopDepth = 0;
    private const MAX_LOOP_DEPTH = 10;

    // 🎯 Track current loop context for item variable resolution
    private string $currentLoopContext = 'fields'; // 'fields', 'keys', 'fieldsnokey', 'constraints'
    private array $loopContextStack = []; // Stack for nested loops

    public function __construct(array $gtree)
    {
        $this->gtree = $gtree;
        $this->variables = [];
        $this->functions = [];
        $this->macros = [];
        $this->initializeBuiltInFunctions();
    }

    /**
     * 🎯 MAIN TEMPLATE PROCESSING - Convert template to JavaScript function
     */
    public function processTemplate(string $templateContent, string $functionName = 'generate', int $tableIndex = null, bool $includeSource = false): string
    {
        // 🔧 SAUBERE LÖSUNG: Text-Literale schützen, dann per echte Newlines (char 10) aufteilen
        // 1. Text-Literale "\n" und "\r" schützen
        $templateContent = $this->protectTextLiterals($templateContent);

        // 2. Per echte Newlines (char 10) in Zeilen aufteilen
        $lines = explode("\n", $templateContent);

        // Store original lines for source comments
        $originalLines = explode("\n", str_replace(["\r\n", "\r"], "\n", $this->restoreTextLiterals($templateContent)));

        $jsFunction = "function {$functionName}() {\n";
        $jsFunction .= "  let sContentResult = '';\n";
        $jsFunction .= "  \n";

        foreach ($lines as $lineIndex => $line) {
            // Add source comment if enabled
            if ($includeSource && isset($originalLines[$lineIndex])) {
                $sourceLine = str_replace(['/*', '*/'], ['/ *', '* /'], $originalLines[$lineIndex]); // Escape comment delimiters
                $jsFunction .= "  // " . $sourceLine . "\n";
            }
            $jsFunction .= $this->processLine($line, $tableIndex, $lineIndex);
        }

        $jsFunction .= "  \n";
        $jsFunction .= "  return sContentResult;\n";
        $jsFunction .= "}\n";

        // 🔧 TEXT-LITERALE WIEDERHERSTELLEN: Zurück zu escaped Text-Literalen
        $jsFunction = $this->restoreTextLiterals($jsFunction);

        return $jsFunction;
    }

    /**
     * 🔧 ADVANCED LINE PROCESSING - Handle all template syntax
     */
    private function processLine(string $line, ?int $tableIndex, int $lineIndex): string
    {
        $originalLine = $line;
        $line = rtrim($line);

        // Handle ONLY completely empty lines (no content at all)
        // Lines with ONLY whitespace (tabs/spaces) must be preserved!
        if ($originalLine === '') {
            return "  sContentResult += '\\u000A';\n";
        }

        // Handle lines with ONLY whitespace (tabs/spaces) - preserve them!
        if (trim($originalLine) === '' && $originalLine !== '') {
            $escapedLine = $this->escapeForJavaScript($originalLine);
            return "  sContentResult += '{$escapedLine}\\u000A';\n";
        }

        // 🔧 SAUBERE LÖSUNG: Standalone closing braces are ALWAYS content, never JavaScript
        // This fixes the issue where `}` after PHP blocks gets treated as JavaScript
        $trimmedLine = trim($line);
        if ($trimmedLine === '}') {
            // This is content (PHP closing brace), not JavaScript structure
            $escapedLine = $this->escapeForJavaScript($line);
            return "  sContentResult += '{$escapedLine}\\u000A';\n";
        }


        // 🔄 ENHANCED LOOP PROCESSING
        if ($this->isLoopStart($line)) {
            return $this->processLoopStart($line, $tableIndex);
        }

        if ($this->isLoopEnd($line)) {
            return $this->processLoopEnd();
        }

        // 🔧 MIXED CONTENT LINE PROCESSING
        // Handle lines that contain inline template syntax mixed with content
        if ($this->hasMixedContent($line)) {
            return $this->processMixedContentLine($line, $tableIndex);
        }

        // 🎯 ENHANCED CONDITIONAL PROCESSING
        if ($this->isConditionalStart($line)) {
            return $this->processConditionalStart($line, $tableIndex);
        }

        if ($this->isConditionalElse($line)) {
            return "  } else {\n";
        }

        if ($this->isConditionalEnd($line)) {
            return "  }\n";
        }

        // 🎛️ ENHANCED SWITCH PROCESSING
        if ($this->isSwitchStart($line)) {
            return $this->processSwitchStart($line, $tableIndex);
        }

        if ($this->isSwitchCase($line)) {
            return $this->processSwitchCase($line);
        }

        if ($this->isSwitchDefault($line)) {
            return "    default:\n";
        }

        if ($this->isSwitchBreak($line)) {
            return "      break;\n";
        }

        if ($this->isSwitchEnd($line)) {
            return "  }\n";
        }

        // 📋 MACRO PROCESSING
        if ($this->isMacroDefinition($line)) {
            return $this->processMacroDefinition($line);
        }

        if ($this->isMacroCall($line)) {
            return $this->processMacroCall($line, $tableIndex);
        }

        // 🔧 FUNCTION CALLS
        if ($this->isFunctionCall($line)) {
            return $this->processFunctionCall($line, $tableIndex);
        }

        // 📝 REGULAR CONTENT LINE
        return $this->processContentLine($line, $tableIndex);
    }

    /**
     * 🔄 ENHANCED LOOP DETECTION AND PROCESSING
     */
    private function isLoopStart(string $line): bool
    {
        $trimmedLine = trim($line);

        // 🔧 SAUBERE LÖSUNG: Only treat as block loop if {for} is at start of line or standalone
        // This prevents inline loops from being treated as block structure
        if (preg_match('/^\s*\{for\s+(.*?)\}\s*$/', $line) ||
            preg_match('/^\s*\{for %\}\s*$/', $line) ||
            preg_match('/^\s*\{foreach .+?\}\s*$/', $line)) {
            return true;
        }

        return false;
    }

    private function processLoopStart(string $line, ?int $tableIndex): string
    {
        $this->loopDepth++;

        if ($this->loopDepth > self::MAX_LOOP_DEPTH) {
            throw new \Exception("Maximum loop depth exceeded");
        }

        // Enhanced for loop syntax
        if (preg_match('/\{for\s+(.+?)\s+in\s+(.+?)\}/', $line, $matches)) {
            $variable = $matches[1];
            $collection = $matches[2];
            $this->pushLoopContext('fields');
            return "  for (let {$variable} of {$this->processVariable($collection, $tableIndex)}) {\n";
        }

        // 🎯 KEYS LOOP - Loop through keys array
        if (strpos($line, '{for {nmaxkeys}}') !== false) {
            $this->pushLoopContext('keys');
            $tableIndexValue = $tableIndex !== null ? $tableIndex : 0;
            return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndexValue}].nmaxkeys; i++) {\n";
        }

        // 🎯 FIELDS WITHOUT KEY LOOP - Loop through fieldsnokey array
        if (strpos($line, '{for {nmaxitemsnokey}}') !== false) {
            $this->pushLoopContext('fieldsnokey');
            $tableIndexValue = $tableIndex !== null ? $tableIndex : 0;
            return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndexValue}].nmaxitemsnokey; i++) {\n";
        }

        // 🎯 CONSTRAINTS LOOP - Loop through constraints array
        if (strpos($line, '{for {nmaxconstraints}}') !== false) {
            $this->pushLoopContext('constraints');
            $tableIndexValue = $tableIndex !== null ? $tableIndex : 0;
            return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndexValue}].nmaxconstraints; i++) {\n";
        }

        // Standard nmaxitems loop
        if (strpos($line, '{for {nmaxitems}}') !== false) {
            $this->pushLoopContext('fields');
            $tableIndexValue = $tableIndex !== null ? $tableIndex : 0;
            return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndexValue}].nmaxitems; i++) {\n";
        }

        // Tables loop
        if (strpos($line, '{for {nmaxtables}}') !== false) {
            $this->pushLoopContext('tables');
            return "  for (let tableIdx = 0; tableIdx < gtree[0].project[0].nmaxtables; tableIdx++) {\n";
        }

        // Custom count loops
        if (preg_match('/\{for\s+\{(.+?)\}\}/', $line, $matches)) {
            $countVar = $matches[1];
            $this->pushLoopContext('fields'); // Default to fields
            return "  for (let i = 0; i < gtree[0].project[0].{$countVar}; i++) {\n";
        }

        // Fallback
        $this->pushLoopContext('fields');
        $tableIndexValue = $tableIndex !== null ? $tableIndex : 0;
        return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndexValue}].nmaxitems; i++) {\n";
    }

    private function processLoopEnd(): string
    {
        $this->loopDepth--;
        $this->popLoopContext();
        return "  }\n";
    }

    // 🎯 Loop context management
    private function pushLoopContext(string $context): void
    {
        $this->loopContextStack[] = $this->currentLoopContext;
        $this->currentLoopContext = $context;
    }

    private function popLoopContext(): void
    {
        if (count($this->loopContextStack) > 0) {
            $this->currentLoopContext = array_pop($this->loopContextStack);
        } else {
            $this->currentLoopContext = 'fields'; // Reset to default
        }
    }

    // 🎯 Get array name based on current loop context
    private function getArrayNameForContext(): string
    {
        switch ($this->currentLoopContext) {
            case 'keys':
                return 'keys';
            case 'fieldsnokey':
                return 'fieldsnokey';
            case 'constraints':
                return 'constraints';
            case 'fields':
            default:
                return 'fields';
        }
    }

    private function isLoopEnd(string $line): bool
    {
        // 🔧 SAUBERE LÖSUNG: Only treat as block loop end if {endfor} is standalone
        // This prevents inline {endfor} from being treated as block structure
        if (preg_match('/^\s*\{endfor\}\s*$/', $line) ||
            preg_match('/^\s*\{\/for\}\s*$/', $line)) {
            return true;
        }

        return false;
    }

    /**
     * 🎯 ENHANCED CONDITIONAL PROCESSING
     */
    private function isConditionalStart(string $line): bool
    {
        return preg_match('/\{if\s+(.+?)\}/', $line);
    }

    private function processConditionalStart(string $line, ?int $tableIndex): string
    {
        if (preg_match('/\{if\s+(.+?)\}/', $line, $matches)) {
            $condition = trim($matches[1]);
            $jsCondition = $this->processCondition($condition, $tableIndex);
            return "  if ({$jsCondition}) {\n";
        }
        return "";
    }

    private function processCondition(string $condition, ?int $tableIndex): string
    {
        // Replace loop counter variables first (before processing other variables)
        $condition = str_replace('nCountSearchkeys', 'i', $condition);
        $condition = str_replace('nCount', 'i', $condition);

        // 🔧 Extract and replace all {variable} patterns in the condition
        $condition = preg_replace_callback('/\{([a-zA-Z_][a-zA-Z0-9_.]*)\}/', function($matches) use ($tableIndex) {
            $varName = $matches[1];
            $replacement = $this->processVariable($varName, $tableIndex);
            // Remove the wrapping quotes that processVariable adds
            $replacement = trim($replacement, "' +");
            return $replacement;
        }, $condition);

        // Special case: When comparing loop counter with loop limit (i < nmaxX),
        // we need to subtract 1 because we check if NOT at last element
        $condition = preg_replace('/i\s*<\s*gtree\[0\]\.project\[0\]\.tables\[\d+\]\.nmaxsearchkeys/',
                                 'i < gtree[0].project[0].tables[' . ($tableIndex ?? 'tableIdx') . '].nmaxsearchkeys - 1',
                                 $condition);

        // Handle comparison operators
        $condition = preg_replace('/\s+eq\s+/', ' === ', $condition);
        $condition = preg_replace('/\s+ne\s+/', ' !== ', $condition);
        $condition = preg_replace('/\s+gt\s+/', ' > ', $condition);
        $condition = preg_replace('/\s+lt\s+/', ' < ', $condition);
        $condition = preg_replace('/\s+gte\s+/', ' >= ', $condition);
        $condition = preg_replace('/\s+lte\s+/', ' <= ', $condition);
        $condition = preg_replace('/\s+and\s+/', ' && ', $condition);
        $condition = preg_replace('/\s+or\s+/', ' || ', $condition);
        $condition = preg_replace('/\s+not\s+/', ' ! ', $condition);

        return $condition;
    }

    private function isConditionalElse(string $line): bool
    {
        return strpos($line, '{else}') !== false;
    }

    private function isConditionalEnd(string $line): bool
    {
        return strpos($line, '{endif}') !== false || strpos($line, '{/if}') !== false;
    }

    /**
     * 🎛️ SWITCH PROCESSING
     */
    private function isSwitchStart(string $line): bool
    {
        return preg_match('/\{switch\s+(.+?)\}/', $line);
    }

    private function processSwitchStart(string $line, ?int $tableIndex): string
    {
        // Match {switch ...} including nested {variable} - use greedy match to last }
        if (preg_match('/\{switch\s+(.+)\}\s*$/', $line, $matches)) {
            $switchVar = trim($matches[1]);

            // If switchVar contains {variable}, extract and process it
            if (preg_match('/^\{([a-zA-Z_][a-zA-Z0-9_.]*)\}$/', $switchVar, $varMatch)) {
                $varName = $varMatch[1];
                $jsSwitchVar = $this->processVariable($varName, $tableIndex);
                // Remove wrapping quotes from processVariable
                $jsSwitchVar = trim($jsSwitchVar, "' +");
                return "  switch ({$jsSwitchVar}) {\n";
            } else {
                // Direct variable name without braces
                $jsSwitchVar = $this->processVariable($switchVar, $tableIndex);
                $jsSwitchVar = trim($jsSwitchVar, "' +");
                return "  switch ({$jsSwitchVar}) {\n";
            }
        }
        return "";
    }

    private function isSwitchCase(string $line): bool
    {
        return preg_match('/\{case\s+(.+?)\}/', $line);
    }

    private function processSwitchCase(string $line): string
    {
        if (preg_match('/\{case\s+(.+?)\}/', $line, $matches)) {
            $caseValue = trim($matches[1]);
            // Handle both quoted and unquoted case values
            if (!preg_match('/^["\'].*["\']$/', $caseValue) && !is_numeric($caseValue)) {
                $caseValue = "'{$caseValue}'";
            }
            return "    case {$caseValue}:\n";
        }
        return "";
    }

    private function isSwitchDefault(string $line): bool
    {
        return strpos($line, '{default}') !== false;
    }

    private function isSwitchBreak(string $line): bool
    {
        return strpos($line, '{break}') !== false;
    }

    private function isSwitchEnd(string $line): bool
    {
        return strpos($line, '{endswitch}') !== false || strpos($line, '{/switch}') !== false;
    }

    /**
     * 📋 MACRO PROCESSING
     */
    private function isMacroDefinition(string $line): bool
    {
        return preg_match('/\{macro\s+(\w+)(?:\((.*?)\))?\}/', $line);
    }

    private function processMacroDefinition(string $line): string
    {
        // Macros are processed at compile time, not at runtime
        if (preg_match('/\{macro\s+(\w+)(?:\((.*?)\))?\}/', $line, $matches)) {
            $macroName = $matches[1];
            $params = isset($matches[2]) ? explode(',', $matches[2]) : [];
            // Store macro for later expansion
            $this->macros[$macroName] = ['params' => $params, 'content' => ''];
        }
        return "  // Macro definition: {$line}\n";
    }

    private function isMacroCall(string $line): bool
    {
        return preg_match('/\{@(\w+)(?:\((.*?)\))?\}/', $line);
    }

    private function processMacroCall(string $line, ?int $tableIndex): string
    {
        // Expand macro calls
        return "  // Macro call: {$line}\n";
    }

    /**
     * 🔧 FUNCTION PROCESSING
     */
    private function isFunctionCall(string $line): bool
    {
        return preg_match('/\{(\w+)\((.*?)\)\}/', $line);
    }

    private function processFunctionCall(string $line, ?int $tableIndex): string
    {
        if (preg_match('/\{(\w+)\((.*?)\)\}/', $line, $matches)) {
            $functionName = $matches[1];
            $args = $matches[2];

            if (isset($this->functions[$functionName])) {
                $jsArgs = $this->processVariable($args, $tableIndex);
                return "  sContentResult += {$functionName}({$jsArgs});\n";
            }
        }
        return "";
    }

    /**
     * 📝 ENHANCED CONTENT LINE PROCESSING - Fix variable replacement issues
     */
    private function processContentLine(string $line, ?int $tableIndex): string
    {
        // Preserve original line for debugging
        $originalLine = $line;

        // Handle empty lines properly
        if (trim($line) === '') {
            return "  sContentResult += '\\u000A';\n";
        }

        // Process all variables in the line BEFORE escaping
        if ($this->hasVariables($line)) {
            $processedLine = $this->processAllVariablesForContentLine($line, $tableIndex);
            return "  sContentResult += {$processedLine} + '\\u000A';\n";
        } else {
            // No variables, just escape and add
            $escapedLine = $this->escapeForJavaScript($line);
            return "  sContentResult += '{$escapedLine}\\u000A';\n";
        }
    }

    /**
     * 🔧 MIXED CONTENT LINE PROCESSING
     * Handles lines with inline template syntax mixed with content
     */
    private function hasMixedContent(string $line): bool
    {
        // Check if line contains template syntax but is not a standalone template command
        $trimmedLine = trim($line);

        // Skip if it's a standalone template command
        if (preg_match('/^\s*\{(for|endfor|if|endif|switch|endswitch|case|default|\/\w+)\s*.*?\}\s*$/', $line)) {
            return false;
        }

        // Check for inline template syntax including nested braces like {for {nmaxsearchkeys}}
        return preg_match('/\{(for\s+.*?|endfor|if\s+.*?|endif)\}/', $line) ||
               preg_match('/\{for\s+\{[^}]+\}\}/', $line);
    }

    private function processMixedContentLine(string $line, ?int $tableIndex): string
    {
        $result = '';
        $currentPos = 0;
        $lineLength = strlen($line);

        // Parse the line character by character to find template syntax
        while ($currentPos < $lineLength) {
            // Find next template syntax (including nested braces like {for {nmaxsearchkeys}})
            // Use greedy matching for {if ...} to handle nested {variables}
            if (preg_match('/\{for\s+\{[^}]+\}\}|\{if\s+[^}]*\{[^}]+\}[^}]*\}|\{(for\s+\w+|endfor|if\s+\w+|endif)\}/', $line, $matches, PREG_OFFSET_CAPTURE, $currentPos)) {
                $matchText = $matches[0][0];
                $matchPos = $matches[0][1];

                // Add content before the template syntax
                if ($matchPos > $currentPos) {
                    $contentBefore = substr($line, $currentPos, $matchPos - $currentPos);
                    // Check if content has variables and process them
                    if ($this->hasVariables($contentBefore)) {
                        $processedContent = $this->processAllVariablesForContentLine($contentBefore, $tableIndex);
                        $result .= "  sContentResult += {$processedContent};\n";
                    } else {
                        $escapedContent = $this->escapeForJavaScript($contentBefore);
                        $result .= "  sContentResult += '{$escapedContent}';\n";
                    }
                }

                // Process the template syntax
                if (strpos($matchText, '{for ') === 0) {
                    // Start of inline loop
                    $result .= $this->processInlineLoopStart($matchText, $tableIndex);
                } elseif ($matchText === '{endfor}') {
                    // End of inline loop
                    $result .= $this->processInlineLoopEnd();
                } elseif (strpos($matchText, '{if ') === 0) {
                    // Start of inline conditional
                    $result .= $this->processInlineConditionalStart($matchText, $tableIndex);
                } elseif ($matchText === '{endif}') {
                    // End of inline conditional
                    $result .= $this->processInlineConditionalEnd();
                }

                $currentPos = $matchPos + strlen($matchText);
            } else {
                // No more template syntax, add remaining content
                $remainingContent = substr($line, $currentPos);
                if ($remainingContent) {
                    // Check if content has variables and process them
                    if ($this->hasVariables($remainingContent)) {
                        $processedContent = $this->processAllVariablesForContentLine($remainingContent, $tableIndex);
                        $result .= "  sContentResult += {$processedContent} + '\\u000A';\n";
                    } else {
                        $escapedContent = $this->escapeForJavaScript($remainingContent);
                        $result .= "  sContentResult += '{$escapedContent}\\u000A';\n";
                    }
                }
                break;
            }
        }

        return $result;
    }

    private function processInlineLoopStart(string $matchText, ?int $tableIndex): string
    {
        $this->loopDepth++;

        // Extract loop variable from {for {variable}}
        if (preg_match('/\{for\s+\{(.+?)\}\}/', $matchText, $matches)) {
            $loopVar = $matches[1];

            // Handle different loop variable types
            if ($loopVar === 'nmaxkeys') {
                // 🎯 KEYS loop - through keys array
                $this->pushLoopContext('keys');
                if ($tableIndex !== null) {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndex}].nmaxkeys; i++) {\n";
                } else {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[tableIdx].nmaxkeys; i++) {\n";
                }
            } elseif ($loopVar === 'nmaxitemsnokey') {
                // 🎯 FIELDS WITHOUT KEY loop - through fieldsnokey array
                $this->pushLoopContext('fieldsnokey');
                if ($tableIndex !== null) {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndex}].nmaxitemsnokey; i++) {\n";
                } else {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[tableIdx].nmaxitemsnokey; i++) {\n";
                }
            } elseif ($loopVar === 'nmaxconstraints') {
                // 🎯 CONSTRAINTS loop - through constraints array
                $this->pushLoopContext('constraints');
                if ($tableIndex !== null) {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndex}].nmaxconstraints; i++) {\n";
                } else {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[tableIdx].nmaxconstraints; i++) {\n";
                }
            } elseif ($loopVar === 'nmaxsearchkeys') {
                // Search keys loop (for database search fields)
                $this->pushLoopContext('searchkeys');
                if ($tableIndex !== null) {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndex}].nmaxsearchkeys; i++) {\n";
                } else {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[tableIdx].nmaxsearchkeys; i++) {\n";
                }
            } elseif ($loopVar === 'nmaxitems') {
                // Items/fields loop (for all table fields)
                $this->pushLoopContext('fields');
                if ($tableIndex !== null) {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndex}].nmaxitems; i++) {\n";
                } else {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[tableIdx].nmaxitems; i++) {\n";
                }
            } else {
                // Generic loop variable
                $this->pushLoopContext('fields'); // Default to fields
                return "  for (let i = 0; i < gtree[0].project[0].{$loopVar}; i++) {\n";
            }
        }

        // Handle simple {for %} syntax
        if (strpos($matchText, '{for %}') !== false) {
            $this->pushLoopContext('fields');
            if ($tableIndex !== null) {
                return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndex}].nmaxitems; i++) {\n";
            } else {
                return "  for (let i = 0; i < gtree[0].project[0].tables[tableIdx].nmaxitems; i++) {\n";
            }
        }

        return "  // Unknown inline loop format: {$matchText}\n";
    }

    private function processInlineLoopEnd(): string
    {
        $this->loopDepth--;
        $this->popLoopContext();
        return "  }\n";
    }

    private function processInlineConditionalStart(string $matchText, ?int $tableIndex): string
    {
        // Extract condition from {if condition} - handle nested braces
        // Match from {if to the last } (to handle nested {variable})
        if (preg_match('/^\{if\s+(.+)\}$/', $matchText, $matches)) {
            $condition = trim($matches[1]);
            $jsCondition = $this->processCondition($condition, $tableIndex);
            return "  if ({$jsCondition}) {\n";
        }

        return "  // Unknown inline conditional format: {$matchText}\n";
    }

    private function processInlineConditionalEnd(): string
    {
        return "  }\n";
    }

    /**
     * 🔧 ESCAPE FOR JAVASCRIPT
     */
    private function escapeForJavaScript(string $text): string
    {
        // Escape backslashes first (doubles all backslashes including \r\n\t text)
        $text = str_replace('\\', '\\\\', $text);

        // Escape quotes
        $text = str_replace("'", "\\'", $text);
        $text = str_replace('"', '\\"', $text);

        // 🔧 Convert REAL CR/LF/Tab BYTES to Unicode escapes
        $text = str_replace("\r", '\\\\\\\\u000D', $text);   // Real CR byte
        $text = str_replace("\n", '\\\\\\\\u000A', $text);   // Real LF byte
        $text = str_replace("\t", '\\\\\\\\u0009', $text);   // Real Tab byte

        // 🔧 Convert TEXT escape sequences \\r\\n\\t (after doubling) to Unicode escapes
        // After line 582, template text "\r\n" became "\\r\\n" (2 backslashes in string)
        $text = str_replace('\\\\r', '\\\\\\\\u000D', $text);   // Search: \\r (2 BS) → Replace: \\\\u000D (8 BS)
        $text = str_replace('\\\\n', '\\\\\\\\u000A', $text);   // Search: \\n (2 BS) → Replace: \\\\u000A (8 BS)
        $text = str_replace('\\\\t', '\\\\\\\\u0009', $text);   // Search: \\t (2 BS) → Replace: \\\\u0009 (8 BS)

        return $text;
    }

    /**
     * 🔤 ENHANCED VARIABLE PROCESSING
     */
    private function hasVariables(string $line): bool
    {
        // Only match valid template variable names (not JavaScript objects like {'key': value})
        return preg_match('/\{([a-zA-Z_][a-zA-Z0-9_.]*)\}/', $line);
    }

    private function processAllVariables(string $line, ?int $tableIndex): string
    {
        // Process all template variables with enhanced handling
        $processedLine = preg_replace_callback('/\{([^}]+)\}/', function($matches) use ($tableIndex) {
            $variableResult = $this->processVariable($matches[1], $tableIndex);

            // Clean up the variable result - remove JavaScript concatenation syntax for content lines
            $cleanResult = str_replace(["' + ", " + '"], '', $variableResult);
            $cleanResult = trim($cleanResult, "'");

            return $cleanResult;
        }, $line);

        return $processedLine;
    }

    private function processAllVariablesForContentLine(string $line, ?int $tableIndex): string
    {
        // Build JavaScript concatenation without leading/trailing empty strings
        $parts = [];
        $currentPart = '';

        // Split the line by variables - ONLY match valid variable names (alphanumeric + dots, no quotes/special chars)
        $offset = 0;
        while (preg_match('/\{([a-zA-Z_][a-zA-Z0-9_.]*)\}/', $line, $matches, PREG_OFFSET_CAPTURE, $offset)) {
            $variableName = $matches[1][0];
            $variableStart = $matches[0][1];

            // Add text before variable
            if ($variableStart > $offset) {
                $textBefore = substr($line, $offset, $variableStart - $offset);
                $currentPart .= $this->escapeForJavaScript($textBefore);
            }

            // Close current string part if not empty
            if ($currentPart !== '') {
                $parts[] = "'{$currentPart}'";
                $currentPart = '';
            }

            // Add the variable
            $variableResult = $this->processVariable($variableName, $tableIndex);
            // Remove the surrounding quotes from processVariable result
            $cleanVariable = str_replace(["' + ", " + '"], '', $variableResult);
            $cleanVariable = trim($cleanVariable, "'");

            // Remove any || fallback patterns that got added incorrectly
            $cleanVariable = preg_replace('/\s*\|\|\s*[\'"].*?[\'"]/', '', $cleanVariable);

            $parts[] = $cleanVariable;

            $offset = $variableStart + strlen($matches[0][0]);
        }

        // Add remaining text after last variable
        if ($offset < strlen($line)) {
            $textAfter = substr($line, $offset);
            $currentPart .= $this->escapeForJavaScript($textAfter);
        }

        // Close final string part if not empty
        if ($currentPart !== '') {
            $parts[] = "'{$currentPart}'";
        }

        // Join all parts with + (NO wrapping quotes - caller handles that)
        if (empty($parts)) {
            return "";
        }

        return implode(' + ', $parts);
    }

    private function processVariable(string $variable, ?int $tableIndex): string
    {
        $variable = trim($variable);

        // 🎯 PROJECT-LEVEL VARIABLES
        if (strpos($variable, 'project.') === 0) {
            $projectVar = substr($variable, 8); // Remove 'project.'
            return "' + gtree[0].project[0].{$projectVar} + '";
        }

        // 🎯 FILE-LEVEL VARIABLES (innerhalb {for {nmaxfiles}} Loop)
        if (strpos($variable, 'file.') === 0) {
            $fileVar = substr($variable, 5); // Remove 'file.'

            // Special handling for file.caption with language support
            if ($fileVar === 'caption') {
                if ($tableIndex !== null) {
                    return "' + gtree[0].project[0].tables[{$tableIndex}].lang[gtree[0].project[0].selectedlanguageindex].caption + '";
                } else {
                    return "' + gtree[0].project[0].tables[tableIdx].lang[gtree[0].project[0].selectedlanguageindex].caption + '";
                }
            }

            if ($tableIndex !== null) {
                return "' + gtree[0].project[0].tables[{$tableIndex}].{$fileVar} + '";
            } else {
                return "' + gtree[0].project[0].tables[tableIdx].{$fileVar} + '";
            }
        }

        // 🎯 ITEM/FIELD VARIABLES - Context-aware array selection
        if (strpos($variable, 'item.') === 0 || strpos($variable, 'field.') === 0) {
            $fieldVar = substr($variable, 5); // Remove 'item.' or 'field.'

            // 🎯 Determine which array to use based on loop context
            $arrayName = $this->getArrayNameForContext();

            // 🎯 Special mapping for keys array (uses 'column' instead of 'name')
            if ($this->currentLoopContext === 'keys' && $fieldVar === 'name') {
                $fieldVar = 'column'; // keys[i].column instead of keys[i].name
            }

            // Special handling for caption - use lang array
            if ($fieldVar === 'caption') {
                if ($tableIndex !== null) {
                    return "' + gtree[0].project[0].tables[{$tableIndex}].{$arrayName}[i].lang[gtree[0].project[0].selectedlanguageindex].caption + '";
                } else {
                    return "' + gtree[0].project[0].tables[tableIdx].{$arrayName}[i].lang[gtree[0].project[0].selectedlanguageindex].caption + '";
                }
            }

            // Regular field variables
            if ($tableIndex !== null) {
                return "' + gtree[0].project[0].tables[{$tableIndex}].{$arrayName}[i].{$fieldVar} + '";
            } else {
                return "' + gtree[0].project[0].tables[tableIdx].{$arrayName}[i].{$fieldVar} + '";
            }
        }

        // 🎯 DIRECT VARIABLES - Clean and essential only (no excessive variants!)
        $legacyMappings = [
            // PROJECT BASICS
            'projectname' => "gtree[0].project[0].projectname",
            'projectcaption' => "gtree[0].project[0].lang[gtree[0].project[0].selectedlanguageindex].caption",
            'projectid' => "gtree[0].project[0].projectid",
            'projectdatabase' => "gtree[0].project[0].projectdatabase",
            'projecturl' => "gtree[0].project[0].projecturl",
            'projectdirectory' => "gtree[0].project[0].projectdirectory",
            'startpage' => "gtree[0].project[0].startpage",
            'defaultlanguage' => "gtree[0].project[0].defaultlanguage",
            'filenameshortlength' => "gtree[0].project[0].filenameshortlength",

            // LOCALIZATION SETTINGS (short template-friendly names)
            'decimalsep' => "gtree[0].project[0].decimal_separator",
            'thousandsep' => "gtree[0].project[0].thousands_separator",
            'dateformat' => "gtree[0].project[0].date_format",
            'timeformat' => "gtree[0].project[0].time_format",
            'currencysym' => "gtree[0].project[0].currency_symbol",
            'timezone' => "gtree[0].project[0].timezone",

            // TEMPLATE INFO
            'templateid' => "gtree[0].project[0].templateid",
            'projecttemplateid' => "gtree[0].project[0].templateid", // Alias for backward compatibility
            'templatename' => "gtree[0].project[0].template.name",
            'templatecategory' => "gtree[0].project[0].template.lang[gtree[0].project[0].selectedlanguageindex].category",
            'templatedescription' => "gtree[0].project[0].template.lang[gtree[0].project[0].selectedlanguageindex].description",

            // SYSTEM INFO
            'laravelversion' => "gtree[0].project[0].laravelversion",

            // FILE/TABLE INFO
            'tablename' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].tablename" : "gtree[0].project[0].tables[tableIdx].tablename",
            'filename' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filename" : "gtree[0].project[0].tables[tableIdx].filename",
            'filenameshort' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filenameshort" : "gtree[0].project[0].tables[tableIdx].filenameshort",
            'fileid' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fileid" : "gtree[0].project[0].tables[tableIdx].fileid",
            'filenamecc' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filenamecc" : "gtree[0].project[0].tables[tableIdx].filenamecc",
            'filecaption' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].lang[gtree[0].project[0].selectedlanguageindex].caption" : "gtree[0].project[0].tables[tableIdx].lang[gtree[0].project[0].selectedlanguageindex].caption",
            'filedescription' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].lang[gtree[0].project[0].selectedlanguageindex].caption" : "gtree[0].project[0].tables[tableIdx].lang[gtree[0].project[0].selectedlanguageindex].caption",
            'filekeyname' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].primarykeyfield" : "gtree[0].project[0].tables[tableIdx].primarykeyfield",
            'filegeneratemasterdetail' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filegeneratemasterdetail" : "gtree[0].project[0].tables[tableIdx].filegeneratemasterdetail",
            'filedetailfileid' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filedetailfileid" : "gtree[0].project[0].tables[tableIdx].filedetailfileid",
            'filedetailfilename' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filedetailfilename" : "gtree[0].project[0].tables[tableIdx].filedetailfilename",
            'filedetailkey' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filedetailkey" : "gtree[0].project[0].tables[tableIdx].filedetailkey",

            // COUNTERS
            'nmaxitems' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxitems" : "gtree[0].project[0].tables[tableIdx].nmaxitems",
            'nmaxitemsnokey' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxitemsnokey" : "gtree[0].project[0].tables[tableIdx].nmaxitemsnokey",
            'nmaxkeys' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxkeys" : "gtree[0].project[0].tables[tableIdx].nmaxkeys",
            'nmaxforeignkeys' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxforeignkeys" : "gtree[0].project[0].tables[tableIdx].nmaxforeignkeys",
            'nmaxitemsmasterdetail' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxitemsmasterdetail" : "gtree[0].project[0].tables[tableIdx].nmaxitemsmasterdetail",
            'nmaxitemsmasterdetailnokeys' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxitemsmasterdetailnokeys" : "gtree[0].project[0].tables[tableIdx].nmaxitemsmasterdetailnokeys",
            'nmaxfiles' => "gtree[0].project[0].nmaxfiles",
            'nmaxtables' => "gtree[0].project[0].nmaxtables",
            'nmaxlanguages' => "gtree[0].project[0].nmaxlanguages",
            'nmaxsearchkeys' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxsearchkeys" : "gtree[0].project[0].tables[tableIdx].nmaxsearchkeys",
        ];

        if (isset($legacyMappings[$variable])) {
            return "' + " . $legacyMappings[$variable] . " + '";
        }

        // 🎯 ENHANCED ITEM VARIABLES
        $itemMappings = [
            'item.name' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fields[i].name" : "gtree[0].project[0].tables[tableIdx].fields[i].name",
            'item.type' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fields[i].type" : "gtree[0].project[0].tables[tableIdx].fields[i].type",
            'item.controltype' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fields[i].controltype" : "gtree[0].project[0].tables[tableIdx].fields[i].controltype",
            'item.typecast' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fields[i].typecast" : "gtree[0].project[0].tables[tableIdx].fields[i].typecast",
            'item.caption' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fields[i].lang[gtree[0].project[0].selectedlanguageindex].caption" : "gtree[0].project[0].tables[tableIdx].fields[i].lang[gtree[0].project[0].selectedlanguageindex].caption",
            // Link fields for ComboBox, ListBox, etc.
            'item.linktable' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fields[i].linktable" : "gtree[0].project[0].tables[tableIdx].fields[i].linktable",
            'item.linkfield' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fields[i].linkfield" : "gtree[0].project[0].tables[tableIdx].fields[i].linkfield",
            'item.linkorder' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fields[i].linkorder" : "gtree[0].project[0].tables[tableIdx].fields[i].linkorder",
        ];

        if (isset($itemMappings[$variable])) {
            return "' + " . $itemMappings[$variable] . " + '";
        }

        // 🎯 FALLBACK - Try direct project access
        return "' + (gtree[0].project[0].{$variable} || '{$variable}') + '";
    }

    /**
     * 🛠️ BUILT-IN FUNCTIONS
     */
    private function initializeBuiltInFunctions(): void
    {
        $this->functions = [
            'upper' => 'function(str) { return str.toUpperCase(); }',
            'lower' => 'function(str) { return str.toLowerCase(); }',
            'capitalize' => 'function(str) { return str.charAt(0).toUpperCase() + str.slice(1); }',
            'plural' => 'function(str) { return str + "s"; }',
            'singular' => 'function(str) { return str.endsWith("s") ? str.slice(0, -1) : str; }',
            'camelcase' => 'function(str) { return str.replace(/_([a-z])/g, function(g) { return g[1].toUpperCase(); }); }',
            'snakecase' => 'function(str) { return str.replace(/([A-Z])/g, "_$1").toLowerCase(); }',
            'length' => 'function(str) { return str.length; }',
            'substr' => 'function(str, start, len) { return str.substr(start, len); }',
            'replace' => 'function(str, search, replace) { return str.replace(new RegExp(search, "g"), replace); }',
        ];
    }

    /**
     * 🎯 PUBLIC API METHODS
     */
    public function addFunction(string $name, string $jsFunction): void
    {
        $this->functions[$name] = $jsFunction;
    }

    public function setVariable(string $name, $value): void
    {
        $this->variables[$name] = $value;
    }

    public function getGeneratedFunctions(): string
    {
        $js = "// Built-in Template Functions\n";
        foreach ($this->functions as $name => $func) {
            $js .= "const {$name} = {$func};\n";
        }
        return $js;
    }

    /**
     * 🔧 SAUBERE LÖSUNG: Text-Literale "\n" und "\r" schützen
     */
    private function protectTextLiterals(string $content): string
    {
        // Nur Text-Literale schützen, echte Newlines (char 10) bleiben für Zeilenaufteilung
        $content = str_replace('"\r\n"', '"§§TEXTCRLF§§"', $content);  // Text "\r\n"
        $content = str_replace("'\r\n'", "'§§TEXTCRLF§§'", $content);  // Text '\r\n'
        $content = str_replace('"\r"', '"§§TEXTCR§§"', $content);      // Text "\r"
        $content = str_replace("'\r'", "'§§TEXTCR§§'", $content);      // Text '\r'
        $content = str_replace('"\n"', '"§§TEXTLF§§"', $content);      // Text "\n"
        $content = str_replace("'\n'", "'§§TEXTLF§§'", $content);      // Text '\n'

        return $content;
    }

    /**
     * 🔧 TEXT-LITERALE WIEDERHERSTELLEN: Zurück zu escaped Text-Literalen
     */
    private function restoreTextLiterals(string $content): string
    {
        // Zurück zu Unicode-escaped Text-Literalen für JavaScript
        // Use 8 backslashes so JavaScript doesn't interpret as Unicode escape
        $content = str_replace('§§TEXTCRLF§§', '\\\\\\\\u000D\\\\\\\\u000A', $content);
        $content = str_replace('§§TEXTCR§§', '\\\\\\\\u000D', $content);
        $content = str_replace('§§TEXTLF§§', '\\\\\\\\u000A', $content);

        return $content;
    }
}