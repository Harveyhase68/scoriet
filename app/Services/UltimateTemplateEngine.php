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

    // 🆕 {code} Block Processing
    private array $codeBlocks = []; // Store extracted code blocks
    private int $codeBlockCounter = 0; // Counter for user_code_N functions

    // 🎯 Switch Case tracking for auto-break insertion
    private bool $inSwitchCase = false;
    private bool $userManagesBreaks = false; // If user writes ANY {break}, they manage ALL breaks

    public function __construct(array $gtree)
    {
        $this->gtree = $gtree;
        $this->variables = [];
        $this->functions = [];
        $this->macros = [];
        $this->initializeBuiltInFunctions();
    }

    /**
     * ✅ VALIDATE TEMPLATE VARIABLES WITH CONTEXT
     *
     * Scans template for all {variables} and categorizes them:
     * 1. Unknown variables (not in template_variables)
     * 2. Required but missing (is_required=true, not in project values)
     * 3. Optional but missing (is_required=false, not in project values)
     *
     * @param string $templateContent Template content to validate
     * @param int|null $templateId Template ID to load custom variables
     * @param int|null $projectId Project ID to check filled values
     * @param string|null $languageCode Language code for multi-language values
     * @return array Categorized validation results
     */
    public function validateVariablesWithContext(string $templateContent, ?int $templateId = null, ?int $projectId = null, ?string $languageCode = null): array
    {
        \Log::info("🔍 validateVariablesWithContext called", [
            'templateId' => $templateId,
            'projectId' => $projectId,
            'languageCode' => $languageCode
        ]);

        $unknownVariables = [];
        $requiredMissing = [];
        $optionalMissing = [];
        $lineNumber = 1;
        $lines = explode("\n", $templateContent);

        // Load template variables if templateId provided
        $templateVariables = [];
        if ($templateId) {
            $vars = \App\Models\TemplateVariable::where('template_id', $templateId)->get();
            foreach ($vars as $var) {
                $templateVariables[$var->variable_name] = $var;
            }
            \Log::info("🎨 Loaded template variables", [
                'count' => count($templateVariables),
                'templateId' => $templateId,
                'variables' => array_keys($templateVariables)
            ]);
        } else {
            \Log::info("⚠️ No templateId provided - cannot load template variables");
        }

        // Load project values if projectId provided
        $projectValues = [];
        if ($projectId && $templateId) {
            $query = \App\Models\ProjectTemplateVariableValue::where('project_id', $projectId)
                ->where('template_id', $templateId);

            if ($languageCode) {
                $query->where('language', $languageCode);
            }

            $values = $query->get();
            foreach ($values as $val) {
                $projectValues[$val->variable_name] = $val->value;
            }

            \Log::info("🎨 Loaded project variable values", [
                'count' => count($projectValues),
                'languageCode' => $languageCode,
                'values' => $projectValues
            ]);
        } else {
            \Log::info("⚠️ Cannot load project values", [
                'projectId' => $projectId,
                'templateId' => $templateId
            ]);
        }

        foreach ($lines as $line) {
            if (preg_match_all('/\{([a-zA-Z_][a-zA-Z0-9_.]*)\}/', $line, $matches, PREG_OFFSET_CAPTURE)) {
                foreach ($matches[1] as $match) {
                    $variableName = $match[0];

                    // Check if variable is known in system
                    if ($this->isKnownVariable($variableName)) {
                        continue; // Known system variable
                    }

                    // Check if it's a custom template variable
                    if (isset($templateVariables[$variableName])) {
                        $templateVar = $templateVariables[$variableName];

                        // Check if value is set in project
                        $valueExists = array_key_exists($variableName, $projectValues);
                        $value = $valueExists ? $projectValues[$variableName] : null;
                        $isEmpty = ($value === null || trim($value) === '');

                        if ($templateVar->is_required) {
                            // Required: Must have non-empty value
                            if (!$valueExists || $isEmpty) {
                                $requiredMissing[] = [
                                    'variable' => $variableName,
                                    'line' => $lineNumber,
                                    'description' => $templateVar->description,
                                ];
                            }
                        } else {
                            // Optional: Only show as "missing" if NOT set at all
                            // If set (even if empty), don't show in optional missing list
                            if (!$valueExists) {
                                $optionalMissing[] = [
                                    'variable' => $variableName,
                                    'line' => $lineNumber,
                                    'description' => $templateVar->description,
                                    'default_value' => $templateVar->default_value,
                                ];
                            }
                        }
                    } else {
                        // Unknown variable (not in system, not in template variables)
                        $unknownVariables[] = [
                            'variable' => $variableName,
                            'line' => $lineNumber,
                        ];
                    }
                }
            }
            $lineNumber++;
        }

        // Remove duplicates
        $unknownVariables = $this->removeDuplicateVariables($unknownVariables);
        $requiredMissing = $this->removeDuplicateVariables($requiredMissing);
        $optionalMissing = $this->removeDuplicateVariables($optionalMissing);

        return [
            'valid' => empty($unknownVariables) && empty($requiredMissing),
            'unknown_variables' => $unknownVariables,
            'required_missing' => $requiredMissing,
            'optional_missing' => $optionalMissing,
        ];
    }

    /**
     * Remove duplicate variables (keep first occurrence)
     */
    private function removeDuplicateVariables(array $variables): array
    {
        $seenVariables = [];
        $unique = [];
        foreach ($variables as $item) {
            if (!isset($seenVariables[$item['variable']])) {
                $unique[] = $item;
                $seenVariables[$item['variable']] = true;
            }
        }
        return $unique;
    }

    /**
     * ✅ VALIDATE TEMPLATE VARIABLES
     *
     * Scans template for all {variables} and checks if they are known/valid
     * Returns list of unknown variables (informational only, does not block)
     *
     * @param string $templateContent Template content to validate
     * @return array ['valid' => bool, 'unknown_variables' => [...]]
     */
    public function validateVariables(string $templateContent): array
    {
        $unknownVariables = [];
        $lineNumber = 1;
        $lines = explode("\n", $templateContent);

        foreach ($lines as $line) {
            // Find all {variable} patterns (only valid variable names)
            if (preg_match_all('/\{([a-zA-Z_][a-zA-Z0-9_.]*)\}/', $line, $matches, PREG_OFFSET_CAPTURE)) {
                foreach ($matches[1] as $match) {
                    $variableName = $match[0];

                    // Check if variable is known
                    if (!$this->isKnownVariable($variableName)) {
                        $unknownVariables[] = [
                            'variable' => $variableName,
                            'line' => $lineNumber,
                        ];
                    }
                }
            }
            $lineNumber++;
        }

        // Remove duplicates (same variable on multiple lines, show only first occurrence)
        $seenVariables = [];
        $uniqueUnknownVariables = [];
        foreach ($unknownVariables as $item) {
            if (!isset($seenVariables[$item['variable']])) {
                $uniqueUnknownVariables[] = $item;
                $seenVariables[$item['variable']] = true;
            }
        }

        return [
            'valid' => empty($uniqueUnknownVariables),
            'unknown_variables' => $uniqueUnknownVariables,
        ];
    }

    /**
     * 🔍 Check if a variable is known/valid
     *
     * @param string $variable Variable name (without braces)
     * @return bool True if variable is known
     */
    private function isKnownVariable(string $variable): bool
    {
        // 🔧 Template Control Keywords (NOT variables!)
        $controlKeywords = [
            // Loop controls
            'for', 'endfor', 'while', 'endwhile', 'foreach', 'endforeach',
            // Conditional controls
            'if', 'endif', 'else', 'elseif', 'unless', 'endunless',
            // Switch controls
            'switch', 'endswitch', 'case', 'othercase', 'default', 'break',
            // Code blocks
            'code', 'codeend',
            // Macro controls
            'macro', 'endmacro', 'call',
            // Other controls
            'include', 'extends', 'block', 'endblock',
        ];

        if (in_array(strtolower($variable), $controlKeywords)) {
            return true;
        }

        // Check if it has a known prefix (project., file., item., field.)
        if (preg_match('/^(project|file|item|field)\./', $variable)) {
            return true;
        }

        // Check against legacy mappings (known template variables)
        $legacyMappings = [
            // PROJECT BASICS
            'projectname', 'projectcaption', 'projectid', 'projectdatabase',
            'projecturl', 'projectdirectory', 'startpage', 'defaultlanguage',
            'filenameshortlength',

            // LOCALIZATION SETTINGS
            'decimalsep', 'thousandsep', 'dateformat', 'timeformat',
            'currencysym', 'timezone',

            // TEMPLATE INFO
            'templateid', 'projecttemplateid', 'templatename',
            'templatecategory', 'templatedescription',

            // SYSTEM INFO
            'laravelversion',

            // FILE/TABLE INFO
            'tablename', 'filename', 'filenameshort', 'fileid', 'filenamecc',
            'filecaption', 'filedescription', 'filekeyname',
            'filegeneratemasterdetail', 'filedetailfileid', 'filedetailfilename',
            'filedetailkey',

            // COUNTERS
            'nmaxitems', 'nmaxitemsnokey', 'nmaxkeys', 'nmaxforeignkeys',
            'nmaxitemsmasterdetail', 'nmaxitemsmasterdetailnokeys',
            'nmaxfiles', 'nmaxtables', 'nmaxlanguages', 'nmaxsearchkeys',
            'nmaxconstraints',
        ];

        if (in_array($variable, $legacyMappings)) {
            return true;
        }

        // Check against item/field mappings
        $itemFieldMappings = [
            'item.name', 'item.type', 'item.controltype', 'item.typecast',
            'item.caption', 'item.linktable', 'item.linkfield', 'item.linkdisplayfield', 'item.linkorderfield', 'item.linkorder',
            'field.name', 'field.type', 'field.controltype', 'field.typecast',
            'field.caption', 'field.linktable', 'field.linkfield', 'field.linkorder',
        ];

        if (in_array($variable, $itemFieldMappings)) {
            return true;
        }

        // Variables used in loop contexts (these appear in conditions/controls)
        $loopVariables = ['nCount', 'nCountSearchkeys', 'i', 'tableIdx'];
        if (in_array($variable, $loopVariables)) {
            return true;
        }

        // Unknown variable
        return false;
    }

    /**
     * 🎯 MAIN TEMPLATE PROCESSING - Convert template to JavaScript function
     */
    public function processTemplate(string $templateContent, string $functionName = 'generate', int $tableIndex = null, bool $includeSource = false): string
    {
        // 🆕 STEP 1: Extract {code}...{codeend} blocks FIRST before any processing
        $templateContent = $this->extractCodeBlocks($templateContent);

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
     * ✅ VALIDATE TEMPLATE SYNTAX
     *
     * Checks template for syntax errors BEFORE processing
     *
     * @param string $templateContent Template content to validate
     * @return array ['errors' => [...], 'warnings' => [...]]
     */
    public function validateTemplateSyntax(string $templateContent): array
    {
        $errors = [];
        $warnings = [];
        $lines = explode("\n", str_replace(["\r\n", "\r"], "\n", $templateContent));

        $ifStack = 0;
        $forStack = 0;
        $switchStack = 0;
        $codeStack = 0; // Track {code}...{codeend} blocks
        $elseUsedStack = []; // Track if {else} was used in each IF block

        foreach ($lines as $lineNum => $line) {
            $lineNum++; // Human-readable line numbers (1-based)
            $line = trim($line);

            // Check for invalid closing brackets like {else], {endif], {endfor]
            if (preg_match('/\{(else|elseif|endif|endfor|endswitch|if|for|switch|case|default|othercase|break|code|codeend)\]/', $line)) {
                $errors[] = "Line {$lineNum}: Invalid syntax - use } instead of ] to close template tags";
            }

            // 🎯 Check for common typos in {codeend}
            if (preg_match('/\{codend\}/', $line)) {
                $errors[] = "Line {$lineNum}: Typo detected - use {codeend} instead of {codend}";
            }
            if (preg_match('/\{code end\}/', $line)) {
                $errors[] = "Line {$lineNum}: Invalid syntax - use {codeend} instead of {code end} (no space)";
            }

            // Check {if} without condition
            if (preg_match('/^\{if\s*\}\s*$/', $line)) {
                $errors[] = "Line {$lineNum}: {if} requires a condition. Example: {if {item.name} === 'id'}";
            }

            // Check {elseif} without condition
            if (preg_match('/^\{elseif\s*\}\s*$/', $line)) {
                $errors[] = "Line {$lineNum}: {elseif} requires a condition. Use {else} for default case. Example: {elseif {item.type} === 'VARCHAR'}";
            }

            // Check {switch} without variable
            if (preg_match('/^\{switch\s*\}\s*$/', $line)) {
                $errors[] = "Line {$lineNum}: {switch} requires a variable. Example: {switch {item.type}}";
            }

            // Check {for} without loop variable
            if (preg_match('/^\{for\s*\}\s*$/', $line)) {
                $errors[] = "Line {$lineNum}: {for} requires a loop variable. Example: {for {nmaxitems}}";
            }

            // Track nesting
            if (preg_match('/\{if\s+/', $line)) {
                $ifStack++;
                $elseUsedStack[$ifStack] = false; // New IF block, no else yet
            }
            if (preg_match('/\{for\s+/', $line)) {
                $forStack++;
            }
            if (preg_match('/\{switch\s+/', $line)) {
                $switchStack++;
            }

            // 🎯 Track {code} blocks
            if (strpos($line, '{code}') !== false) {
                if ($codeStack > 0) {
                    $warnings[] = "Line {$lineNum}: Nested {code} blocks detected - this may cause issues";
                }
                $codeStack++;
            }

            // Check {else} - only once per IF block
            if (strpos($line, '{else}') !== false && strpos($line, '{elseif') === false) {
                if ($ifStack === 0) {
                    $errors[] = "Line {$lineNum}: {else} without matching {if}";
                } elseif (isset($elseUsedStack[$ifStack]) && $elseUsedStack[$ifStack]) {
                    $errors[] = "Line {$lineNum}: Multiple {else} blocks in same {if} - only one {else} allowed";
                } else {
                    $elseUsedStack[$ifStack] = true; // Mark else as used for this IF block
                }
            }

            // Check {elseif} after {else}
            if (strpos($line, '{elseif') !== false) {
                if ($ifStack === 0) {
                    $errors[] = "Line {$lineNum}: {elseif} without matching {if}";
                } elseif (isset($elseUsedStack[$ifStack]) && $elseUsedStack[$ifStack]) {
                    $errors[] = "Line {$lineNum}: {elseif} after {else} - {elseif} must come before {else}";
                }
            }

            // Check closing tags
            if (strpos($line, '{endif}') !== false || strpos($line, '{/if}') !== false) {
                if ($ifStack <= 0) {
                    $errors[] = "Line {$lineNum}: {endif} without matching {if}";
                } else {
                    unset($elseUsedStack[$ifStack]); // Clean up stack
                    $ifStack--;
                }
            }
            if (strpos($line, '{endfor}') !== false || strpos($line, '{/for}') !== false) {
                $forStack--;
                if ($forStack < 0) {
                    $errors[] = "Line {$lineNum}: {endfor} without matching {for}";
                }
            }
            if (strpos($line, '{endswitch}') !== false || strpos($line, '{/switch}') !== false) {
                $switchStack--;
                if ($switchStack < 0) {
                    $errors[] = "Line {$lineNum}: {endswitch} without matching {switch}";
                }
            }

            // 🎯 Track {codeend} blocks
            if (strpos($line, '{codeend}') !== false) {
                $codeStack--;
                if ($codeStack < 0) {
                    $errors[] = "Line {$lineNum}: {codeend} without matching {code}";
                }
            }

            // Check {case} / {default} / {othercase} outside {switch}
            if ((preg_match('/\{case\s+/', $line) || strpos($line, '{default}') !== false || strpos($line, '{othercase}') !== false) && $switchStack === 0) {
                $errors[] = "Line {$lineNum}: {case}/{default}/{othercase} without matching {switch}";
            }
        }

        // Check for unclosed blocks
        if ($ifStack > 0) {
            $errors[] = "Missing {endif} - {$ifStack} unclosed {if} block(s)";
        }
        if ($forStack > 0) {
            $errors[] = "Missing {endfor} - {$forStack} unclosed {for} loop(s)";
        }
        if ($switchStack > 0) {
            $errors[] = "Missing {endswitch} - {$switchStack} unclosed {switch} block(s)";
        }
        if ($codeStack > 0) {
            $errors[] = "Missing {codeend} - {$codeStack} unclosed {code} block(s)";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }

    /**
     * 🔧 ADVANCED LINE PROCESSING - Handle all template syntax
     */
    private function processLine(string $line, ?int $tableIndex, int $lineIndex): string
    {
        $originalLine = $line;
        $line = rtrim($line);

        // 🆕 CHECK FOR CODE BLOCK PLACEHOLDER
        if (preg_match('/§CODE_BLOCK_(\d+)§/', $line, $matches)) {
            $blockIndex = (int)$matches[1] - 1; // Array is 0-indexed
            if (isset($this->codeBlocks[$blockIndex])) {
                return $this->generateUserCodeFunction($blockIndex + 1, $this->codeBlocks[$blockIndex]);
            }
        }

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

        // Check elseif BEFORE else (because elseif contains "else")
        if ($this->isConditionalElseif($line)) {
            return $this->processConditionalElseif($line, $tableIndex);
        }

        if ($this->isConditionalElse($line)) {
            return "  } else {\n";
        }

        if ($this->isConditionalEnd($line)) {
            return "  }\n";
        }

        // 🎛️ ENHANCED SWITCH PROCESSING WITH SMART AUTO-BREAK
        if ($this->isSwitchStart($line)) {
            $this->inSwitchCase = false;
            $this->userManagesBreaks = false; // Reset: assume auto-break until user writes {break}
            return $this->processSwitchStart($line, $tableIndex);
        }

        if ($this->isSwitchCase($line)) {
            $output = '';
            // Auto-insert break before new case ONLY if user doesn't manage breaks themselves
            if ($this->inSwitchCase && !$this->userManagesBreaks) {
                $output .= "      break;\n";
            }
            $this->inSwitchCase = true;
            $output .= $this->processSwitchCase($line);
            return $output;
        }

        if ($this->isSwitchDefault($line)) {
            $output = '';
            // Auto-insert break before default ONLY if user doesn't manage breaks themselves
            if ($this->inSwitchCase && !$this->userManagesBreaks) {
                $output .= "      break;\n";
            }
            $this->inSwitchCase = true;
            $output .= "    default:\n";
            return $output;
        }

        if ($this->isSwitchBreak($line)) {
            // User wrote {break} → they manage ALL breaks in this switch
            $this->userManagesBreaks = true;
            return "      break;\n";
        }

        if ($this->isSwitchEnd($line)) {
            $output = '';
            // Auto-insert final break ONLY if user doesn't manage breaks themselves
            if ($this->inSwitchCase && !$this->userManagesBreaks) {
                $output .= "      break;\n";
            }
            $this->inSwitchCase = false;
            $this->userManagesBreaks = false; // Reset for next switch
            $output .= "  }\n";
            return $output;
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

        // 🎯 RAW JAVASCRIPT LOOP - Pass through as-is if it looks like JavaScript syntax
        // Detect patterns like: {for let i = 0; i < 9; i++} or {for (let i = 0; i < 9; i++)}
        if (preg_match('/\{for\s+(let|var|const)\s+/', $line) || preg_match('/\{for\s*\(/', $line)) {
            // Extract the JavaScript loop code between {for and }
            if (preg_match('/\{for\s+(.+?)\}\s*$/', $line, $matches)) {
                $jsLoopCode = trim($matches[1]);
                $this->pushLoopContext('custom'); // Custom JavaScript loop context
                return "  for ({$jsLoopCode}) {\n";
            }
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
        return preg_match('/\{if\s+(.+)\}/', $line);
    }

    private function processConditionalStart(string $line, ?int $tableIndex): string
    {
        if (preg_match('/\{if\s+(.+)\}/', $line, $matches)) {
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

            // 🎯 Clean up the JavaScript concatenation syntax for conditions
            // processVariable returns: "' + gtree[0].project[0].filename + '"
            // We need only: gtree[0].project[0].filename
            $replacement = preg_replace("/^'\s*\+\s*/", '', $replacement); // Remove leading ' +
            $replacement = preg_replace("/\s*\+\s*'$/", '', $replacement); // Remove trailing  + '

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

    private function isConditionalElseif(string $line): bool
    {
        // Match {elseif condition} OR just {elseif} (treated as else)
        return strpos($line, '{elseif') !== false;
    }

    private function processConditionalElseif(string $line, ?int $tableIndex): string
    {
        // Match {elseif condition}
        if (preg_match('/\{elseif\s+(.+)\}/', $line, $matches)) {
            $condition = trim($matches[1]);
            $jsCondition = $this->processCondition($condition, $tableIndex);
            return "  } else if ({$jsCondition}) {\n";
        }

        // {elseif} without condition - ERROR (caught by validation, but don't process)
        // DO NOT treat as {else} to avoid double else blocks!
        return "  // ERROR: {elseif} requires a condition\n";
    }

    private function isConditionalElse(string $line): bool
    {
        // Match {else} but NOT {elseif}
        return strpos($line, '{else}') !== false && strpos($line, '{elseif') === false;
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
        return strpos($line, '{default}') !== false || strpos($line, '{othercase}') !== false;
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
            } elseif ($loopVar === 'nmaxforeignkeys') {
                // 🎯 FOREIGN KEYS loop - through foreignkeys array
                $this->pushLoopContext('foreignkeys');
                if ($tableIndex !== null) {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndex}].nmaxforeignkeys; i++) {\n";
                } else {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[tableIdx].nmaxforeignkeys; i++) {\n";
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
            } elseif ($loopVar === 'nmaxlanguages') {
                // 🎯 LANGUAGES loop - through project lang array
                $this->pushLoopContext('languages');
                return "  for (let i = 0; i < gtree[0].project[0].nmaxlanguages; i++) {\n";
            } elseif ($loopVar === 'nmaxtables') {
                // 🎯 TABLES loop - through project tables array
                $this->pushLoopContext('tables');
                return "  for (let tableIdx = 0; tableIdx < gtree[0].project[0].nmaxtables; tableIdx++) {\n";
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

            // LANGUAGE VARIABLES (selected/current language)
            'languageid' => "gtree[0].project[0].lang[gtree[0].project[0].selectedlanguageindex].id", // Current language ID
            'languagename' => "gtree[0].project[0].lang[gtree[0].project[0].selectedlanguageindex].name", // Current language name (e.g., 'English', 'Deutsch')
            'languagetoken' => "gtree[0].project[0].selectedlanguage", // Current language code (e.g., 'en', 'de')
            'selectedlanguage' => "gtree[0].project[0].selectedlanguage", // Alias for languagetoken
            'selectedlanguageindex' => "gtree[0].project[0].selectedlanguageindex", // Current language index

            // DATABASE CONNECTION VARIABLES (without passwords/credentials)
            'projectdbid' => "gtree[0].project[0].projectdbid", // Database/Schema ID
            'projectdbtype' => "gtree[0].project[0].projectdbtype", // Database type (MySQL, PostgreSQL, etc.)
            'projectdbserver' => "gtree[0].project[0].projectdbserver", // Database server host
            'projectdbname' => "gtree[0].project[0].projectdbname", // Schema/Database name

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

            // TEMPLATE FILE VARIABLES (per-file, injected during processing)
            'templatefolder' => "gtree[0].project[0].templatefolder", // Folder from output path
            'templatepage' => "gtree[0].project[0].templatepage", // Current template file name
            'templatepagename' => "gtree[0].project[0].templatepagename", // File name without extension
            'templatefilepath' => "gtree[0].project[0].templatefilepath", // Template file path
            'templateoutputpath' => "gtree[0].project[0].templateoutputpath", // Output path for generated file

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
            'item.linkdisplayfield' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fields[i].linkdisplayfield" : "gtree[0].project[0].tables[tableIdx].fields[i].linkdisplayfield",
            'item.linkorderfield' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fields[i].linkorderfield" : "gtree[0].project[0].tables[tableIdx].fields[i].linkorderfield",
            'item.linkorder' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fields[i].linkorder" : "gtree[0].project[0].tables[tableIdx].fields[i].linkorder",
            // 🎯 NEW: Additional ITEMS variables for templates
            'item.unsigned' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fields[i].unsigned" : "gtree[0].project[0].tables[tableIdx].fields[i].unsigned",
            'item.editmask' => $tableIndex !== null ? "(gtree[0].project[0].tables[{$tableIndex}].fields[i].editmask || '')" : "(gtree[0].project[0].tables[tableIdx].fields[i].editmask || '')",
            'item.sort' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fields[i].sort" : "gtree[0].project[0].tables[tableIdx].fields[i].sort",
            'item.sortindex' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fields[i].sortindex" : "gtree[0].project[0].tables[tableIdx].fields[i].sortindex",
        ];

        if (isset($itemMappings[$variable])) {
            return "' + " . $itemMappings[$variable] . " + '";
        }

        // 🎯 KEYS VARIABLES (for {for {nmaxkeys}} loops)
        $keysMappings = [
            'keys.name' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].keys[i].name" : "gtree[0].project[0].tables[tableIdx].keys[i].name",
            'keys.id' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].keys[i].id" : "gtree[0].project[0].tables[tableIdx].keys[i].id",
            'keys.type' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].keys[i].type" : "gtree[0].project[0].tables[tableIdx].keys[i].type",
            'keys.typecast' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].keys[i].typecast" : "gtree[0].project[0].tables[tableIdx].keys[i].typecast",
        ];

        if (isset($keysMappings[$variable])) {
            return "' + " . $keysMappings[$variable] . " + '";
        }

        // 🎯 FOREIGN KEYS VARIABLES (for {for {nmaxforeignkeys}} loops)
        $foreignKeysMappings = [
            'foreign.name' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].foreignkeys[i].name" : "gtree[0].project[0].tables[tableIdx].foreignkeys[i].name",
            'foreign.id' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].foreignkeys[i].id" : "gtree[0].project[0].tables[tableIdx].foreignkeys[i].id",
            'foreign.type' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].foreignkeys[i].type" : "gtree[0].project[0].tables[tableIdx].foreignkeys[i].type",
            'foreign.typecast' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].foreignkeys[i].typecast" : "gtree[0].project[0].tables[tableIdx].foreignkeys[i].typecast",
            'foreign.referencedtable' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].foreignkeys[i].referencedtable" : "gtree[0].project[0].tables[tableIdx].foreignkeys[i].referencedtable",
            'foreign.referencedcolumn' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].foreignkeys[i].referencedcolumn" : "gtree[0].project[0].tables[tableIdx].foreignkeys[i].referencedcolumn",
            'foreign.ondelete' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].foreignkeys[i].ondelete" : "gtree[0].project[0].tables[tableIdx].foreignkeys[i].ondelete",
            'foreign.onupdate' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].foreignkeys[i].onupdate" : "gtree[0].project[0].tables[tableIdx].foreignkeys[i].onupdate",
        ];

        if (isset($foreignKeysMappings[$variable])) {
            return "' + " . $foreignKeysMappings[$variable] . " + '";
        }

        // 🎯 LANGUAGE VARIABLES (for {for {nmaxlanguages}} loops)
        $languageMappings = [
            'language.id' => "gtree[0].project[0].lang[i].id",
            'language.code' => "gtree[0].project[0].lang[i].code",
            'language.name' => "gtree[0].project[0].lang[i].name",
            'language.nativename' => "gtree[0].project[0].lang[i].native_name",
            'language.flag' => "gtree[0].project[0].lang[i].flag",
            'language.index' => "gtree[0].project[0].lang[i].index",
            'language.caption' => "gtree[0].project[0].lang[i].caption", // Project name in this language
        ];

        if (isset($languageMappings[$variable])) {
            return "' + " . $languageMappings[$variable] . " + '";
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
     * 🆕 GENERATE user_code_N() FUNCTION INLINE
     * Generate the user_code function definition and call
     */
    private function generateUserCodeFunction(int $funcIndex, string $codeContent): string
    {
        $jsCode = '';

        // Define user_code_N function inline
        $jsCode .= "  function user_code_{$funcIndex}() {\n";

        // Indent user's code (trim to remove leading/trailing whitespace from extraction)
        $codeLines = explode("\n", trim($codeContent));
        foreach ($codeLines as $codeLine) {
            $jsCode .= "    " . $codeLine . "\n";
        }

        $jsCode .= "  }\n";

        // Call the function and add result to sContentResult
        $jsCode .= "  sContentResult += (user_code_{$funcIndex}() || '');\n";

        return $jsCode;
    }

    /**
     * 🆕 EXTRACT {code}...{codeend} BLOCKS
     * Extract JavaScript code blocks from template and replace with placeholder
     */
    private function extractCodeBlocks(string $templateContent): string
    {
        // Reset code blocks counter
        $this->codeBlocks = [];
        $this->codeBlockCounter = 0;

        // Find all {code}...{codeend} blocks
        $pattern = '/\{code\}(.*?)\{codeend\}/s';

        $templateContent = preg_replace_callback($pattern, function($matches) {
            // Store the code block content (without {code} and {codeend})
            $codeContent = $matches[1];
            $this->codeBlocks[] = $codeContent;
            $this->codeBlockCounter++;

            // Replace with placeholder that will be recognized during processLine
            return '§CODE_BLOCK_' . ($this->codeBlockCounter) . '§';
        }, $templateContent);

        return $templateContent;
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