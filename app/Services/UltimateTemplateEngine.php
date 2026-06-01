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
    private string $currentLoopContext = 'fields'; // 'fields', 'keys', 'fieldsnokey', 'fieldsnokeyall', 'constraints'
    private array $loopContextStack = []; // Stack for nested loops

    // 🎯 Index-based contexts: these arrays contain indices into fields[] instead of duplicated objects
    private const INDEX_BASED_CONTEXTS = [
        'fieldsnokey', 'fieldsnokeyall', 'fieldsnoblob', 'fieldsnobloball', 'fieldsnobinaryblob', 'fieldsnobinarybloball', 'fieldssearchkeys',
        // Future: 'fieldsblob', 'fieldsmasterdetail', etc.
    ];

    // 🆕 {:code:} Block Processing
    private array $codeBlocks = []; // Store extracted code blocks
    private int $codeBlockCounter = 0; // Counter for user_code_N functions

    // 🎯 Switch Case tracking for auto-break insertion
    private bool $inSwitchCase = false;
    private bool $userManagesBreaks = false; // If user writes ANY {:break:}, they manage ALL breaks

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
        }

        foreach ($lines as $line) {
            if (preg_match_all('/\{:([a-zA-Z_][a-zA-Z0-9_.]*):\}/', $line, $matches, PREG_OFFSET_CAPTURE)) {
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
            if (preg_match_all('/\{:([a-zA-Z_][a-zA-Z0-9_.]*):\}/', $line, $matches, PREG_OFFSET_CAPTURE)) {
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
            // Smart Injection marker
            'inject',
            // Smart Injection sections
            'section', 'sectionend',
        ];

        if (in_array(strtolower($variable), $controlKeywords)) {
            return true;
        }

        // Check if it's a function call like upper(tablename), lower(item.name)
        if (preg_match('/^(\w+)\(/', $variable, $funcMatch)) {
            $funcName = strtolower($funcMatch[1]);
            $knownFunctions = ['upper', 'lower', 'capitalize', 'plural', 'singular', 'camelcase', 'pascalcase', 'snakecase', 'kebabcase', 'length', 'strlen', 'substr', 'replace'];
            if (in_array($funcName, $knownFunctions)) {
                return true;
            }
        }

        // Check if it has a known prefix
        if (preg_match('/^(project|file|item|field|form|formset|table|language|keys|foreign|foreignunique|foreignkeys|foreignkeysunique|migration|layoutsingle|layoutbutton|layoutcolumn|layoutmenu|reportpattern|reportsingle|reportlist|reportsingleelement|reportlistelement|layoutreportsingle|layoutreportlist)\./', $variable)) {
            return true;
        }

        // Check against legacy mappings (known template variables)
        // MUST stay in sync with processVariable() legacyMappings!
        // ⚠️ MUST stay in sync with the actual project-data keys produced by
        // UltimateTemplateController::buildUltimateProjectData(). Whenever a
        // new top-level project variable is added there, mirror it here or
        // the syntax checker reports a false-positive "unknown variable"
        // even though the resolver knows it.
        $legacyMappings = [
            // PROJECT BASICS
            'projectname', 'projectcaption', 'projectdescription', 'projectid', 'projectdatabase',
            'projecturl', 'projectdirectory', 'startpage',
            'projectowner', 'projectowneremail', 'projectcreated', 'projectupdated',
            'defaultlanguage', 'defaultlanguagename', 'defaultlanguageindex',
            'filenameshortlength',

            // DATABASE CONNECTION VARIABLES
            'projectdbid', 'projectdbtype', 'projectdbserver', 'projectdbname',
            'projectdbdesc', 'projectdbversion',
            'projectdbusername', 'projectdbpassword', 'projectdbport',

            // LOCALIZATION SETTINGS
            'decimalsep', 'thousandsep', 'dateformat', 'timeformat',
            'currencysym', 'timezone',

            // LANGUAGE VARIABLES (selected/current language)
            'languageid', 'languagename', 'languagetoken',
            'selectedlanguage', 'selectedlanguageindex',

            // TEMPLATE INFO
            'templateid', 'projecttemplateid', 'templatename',
            'templatecategory', 'templatedescription', 'templatetags',
            'templatefolder', 'templatepage', 'templatepagename',
            'templatefilepath', 'templateoutputpath',

            // SYSTEM / GENERATION INFO
            'laravelversion', 'scorietversion',
            'generationdatetime', 'generationuser',

            // FILE/TABLE INFO
            'tablename', 'tableindex', 'filename', 'filenameshort', 'fileid',
            'filecamelcase', 'filepascalcase', 'filenamerenamed',
            'filesingular', 'filesingularpascalcase', 'filesingularcamelcase',
            'filecaption', 'filedescription', 'filekeyname', 'fileprimarykey',
            'filegeneratemasterdetail', 'filedetailfileid', 'filedetailfilename',
            'filedetailkey',

            // TABLE FLAGS (boolean)
            'hastimestamps', 'hasprimarykey', 'hasblob', 'hasbinaryblob', 'hasforeignkeys',

            // COUNTERS
            'nmaxitems', 'nmaxitemsnokey', 'nmaxitemsnokeyall',
            'nmaxitemsnoblob', 'nmaxitemsnobloball',
            'nmaxitemsnobinaryblob', 'nmaxitemsnobinarybloball',
            'nmaxkeys', 'nmaxforeignkeys', 'nmaxforeignkeysunique',
            'nmaxitemsmasterdetail', 'nmaxitemsmasterdetailnokeys',
            'nmaxfiles', 'nmaxtables', 'nmaxlanguages', 'nmaxsearchkeys',
            'nmaxconstraints', 'tablesgen', 'fieldsgen',
            // FormSet/Report counters (project-global, exposed in buildUltimateProjectData)
            'nmaxformsets', 'nmaxwindows',
            // Per-item enum value counter (resolves to fields[i].enum_values.length inside nmaxitems loops)
            'nmaxenum',
            // Loop-local: current value inside `{:for item.enum_values:}`. Resolver
            // in processVariable() returns 'value' only when currentLoopContext is
            // 'item_enum_values'; validator stays loop-context-agnostic.
            'value',
            // Form layout counters
            'nmaxlayoutsingles', 'layoutsinglecount', 'nmaxlayoutcolumns',
            'nmaxlayoutbuttons', 'nmaxlayoutmenus',
            // Report layout counters + per-table report meta
            'nmaxreportsingleelements', 'nmaxreportlistelements',
            'nmaxlayoutreportsingle', 'nmaxlayoutreportlist',
            'report_pattern_id', 'report_pattern_name', 'report_pattern_inherited',
            // Per-table FormSet provenance. `id` is always the real effective
            // DB id; `-1` only when nothing exists anywhere. Branch on
            // `*_inherited` to distinguish own-assignment vs. project-default.
            'form_set_id', 'form_set_name', 'form_set_inherited',
            // Migration counters & static fields (in addition to the migration.X
            // family already covered by $migrationStaticMappings in processVariable).
            // These are used BARE (e.g. `{:nmaxmigration_tables:}` outside loops) —
            // not as loop counters, which are handled separately in processLoopStart.
            'nmaxmigration_tables', 'nmaxmigration_fields',
            'nmaxmigration_indexes', 'nmaxmigration_foreignkeys',
            'nmaxmigration_total',
        ];

        if (in_array($variable, $legacyMappings)) {
            return true;
        }

        // Check against item/field/layout mappings
        $itemFieldMappings = [
            'item.name', 'item.pascalcase', 'item.camelcase', 'item.type', 'item.controltype', 'item.typecast',
            'item.caption', 'item.linktable', 'item.linkfield', 'item.linkdisplayfield', 'item.linkorderfield', 'item.linkorder',
            'field.name', 'field.pascalcase', 'field.camelcase', 'field.type', 'field.controltype', 'field.typecast',
            'field.caption', 'field.linktable', 'field.linkfield', 'field.linkorder',
        ];

        // Layout variable prefixes (layoutsingle.*, layoutcolumn.*, layoutbutton.*, layoutmenu.*)
        // and report layout/element loop variants
        if (preg_match('/^(layoutsingle|layoutcolumn|layoutbutton|layoutmenu|layoutreportsingle|layoutreportlist|reportsingleelement|reportlistelement)\./', $variable)) {
            return true;
        }

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

    // 🎨 Current form window index for template processing
    private int $currentFormWindowIdx = 0;

    /**
     * 🎯 MAIN TEMPLATE PROCESSING - Convert template to JavaScript function
     */
    public function processTemplate(string $templateContent, string $functionName = 'generate', ?int $tableIndex = null, bool $includeSource = false, int $formWindowType = 0): string
    {
        // 🛠️ Detect used functions BEFORE any content transformation
        $originalTemplateContent = $templateContent;
        $usedFunctions = $this->detectUsedFunctions($originalTemplateContent);

        // 🆕 STEP 1: Extract {:code:}...{:codeend:} blocks FIRST before any processing
        $templateContent = $this->extractCodeBlocks($templateContent);

        // 🔧 SAUBERE LÖSUNG: Text-Literale schützen, dann per echte Newlines (char 10) aufteilen
        // 1. Text-Literale "\n" und "\r" schützen
        $templateContent = $this->protectTextLiterals($templateContent);

        // 2. Normalize line endings BEFORE splitting: \r\n → \n, standalone \r → \n
        $templateContent = str_replace(["\r\n", "\r"], "\n", $templateContent);

        // 3. Per echte Newlines (char 10) in Zeilen aufteilen
        $lines = explode("\n", $templateContent);

        // Store original lines for source comments
        $originalLines = explode("\n", str_replace(["\r\n", "\r"], "\n", $this->restoreTextLiterals($templateContent)));

        // 🎨 Calculate form window index from form_window_type
        // form_window_type: 0=none, 1=main_menu, 2=create_edit, 3=data_table
        // NOTE: legacy values 4=report_single, 5=report_list used to map to
        // formset.windows[3]/[4] (FormWindow rows that are now dead leftovers).
        // The new report system uses {:reportsingle.X:} / {:reportlist.X:}
        // which resolve via the per-table node — see
        // UltimateTemplateController::buildUltimateProjectData(). We coerce
        // legacy report types to 0 here so any stray template metadata pointing
        // at the old enum doesn't produce garbage formset.windows[3/4] paths.
        if ($formWindowType >= 4) {
            $formWindowType = 0;
        }
        $this->currentFormWindowIdx = $formWindowType > 0 ? $formWindowType - 1 : 0;

        $jsFunction = "function {$functionName}() {\n";
        $jsFunction .= "  let sContentResult = '';\n";
        // 🎨 Add form window index as local constant for form.* variables
        if ($formWindowType > 0) {
            $jsFunction .= "  const currentFormWindowIdx = {$this->currentFormWindowIdx}; // form_window_type: {$formWindowType}\n";
        }

        // 🛠️ Add only USED built-in functions
        if (!empty($usedFunctions)) {
            $jsFunction .= "  // Built-in functions\n";
            foreach ($usedFunctions as $funcName) {
                if (isset($this->functions[$funcName])) {
                    $jsFunction .= "  const {$funcName} = {$this->functions[$funcName]};\n";
                }
            }
        }

        // 🎯 Set current table info on project level (tablename, tableindex)
        // Also define tableIdx as a constant for templates that use {:table.xxx:} placeholders
        if ($tableIndex !== null) {
            $jsFunction .= "  // Current table context\n";
            $jsFunction .= "  const tableIdx = {$tableIndex}; // Fixed table index for db_table_file\n";
            $jsFunction .= "  gtree[0].project[0].tableindex = {$tableIndex};\n";
            $jsFunction .= "  gtree[0].project[0].tablename = gtree[0].project[0].tables[{$tableIndex}]?.filename || '';\n";
        }
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
        $codeStack = 0; // Track {:code:}...{:codeend:} blocks
        $elseUsedStack = []; // Track if {:else:} was used in each IF block

        foreach ($lines as $lineNum => $line) {
            $lineNum++; // Human-readable line numbers (1-based)
            $line = trim($line);

            // Check for invalid closing brackets like {else], {endif], {endfor]
            if (preg_match('/\{:(else|elseif|endif|endfor|endswitch|if|for|switch|case|default|othercase|break|code|codeend):\]/', $line)) {
                $errors[] = "Line {$lineNum}: Invalid syntax - use } instead of ] to close template tags";
            }

            // 🎯 Check for common typos in {:codeend:}
            if (preg_match('/\{:codend:\}/', $line)) {
                $errors[] = "Line {$lineNum}: Typo detected - use {:codeend:} instead of {:codend:}";
            }
            if (preg_match('/\{:code end:\}/', $line)) {
                $errors[] = "Line {$lineNum}: Invalid syntax - use {:codeend:} instead of {:code end:} (no space)";
            }

            // Check {if} without condition
            if (preg_match('/^\{:if\s*:\}\s*$/', $line)) {
                $errors[] = "Line {$lineNum}: {:if:} requires a condition. Example: {:if item.name === 'id':}";
            }

            // Check {elseif} without condition
            if (preg_match('/^\{:elseif\s*:\}\s*$/', $line)) {
                $errors[] = "Line {$lineNum}: {:elseif:} requires a condition. Use {:else:} for default case. Example: {:elseif item.type === 'VARCHAR':}";
            }

            // Check {switch} without variable
            if (preg_match('/^\{:switch\s*:\}\s*$/', $line)) {
                $errors[] = "Line {$lineNum}: {:switch:} requires a variable. Example: {:switch item.type:}";
            }

            // Check {for} without loop variable
            if (preg_match('/^\{:for\s*:\}\s*$/', $line)) {
                $errors[] = "Line {$lineNum}: {:for:} requires a loop variable. Example: {:for nmaxitems:}";
            }

            // Track nesting
            if (preg_match('/\{:if\s+/', $line)) {
                $ifStack++;
                $elseUsedStack[$ifStack] = false; // New IF block, no else yet
            }
            if (preg_match('/\{:for\s+/', $line)) {
                $forStack++;
            }
            if (preg_match('/\{:switch\s+/', $line)) {
                $switchStack++;
            }

            // 🎯 Track {:code:} blocks
            if (strpos($line, '{:code:}') !== false) {
                if ($codeStack > 0) {
                    $warnings[] = "Line {$lineNum}: Nested {:code:} blocks detected - this may cause issues";
                }
                $codeStack++;
            }

            // Check {:else:} - only once per IF block
            if (strpos($line, '{:else:}') !== false && strpos($line, '{:elseif') === false) {
                if ($ifStack === 0) {
                    $errors[] = "Line {$lineNum}: {:else:} without matching {:if:}";
                } elseif (isset($elseUsedStack[$ifStack]) && $elseUsedStack[$ifStack]) {
                    $errors[] = "Line {$lineNum}: Multiple {:else:} blocks in same {:if:} - only one {:else:} allowed";
                } else {
                    $elseUsedStack[$ifStack] = true; // Mark else as used for this IF block
                }
            }

            // Check {elseif} after {:else:}
            if (strpos($line, '{:elseif') !== false) {
                if ($ifStack === 0) {
                    $errors[] = "Line {$lineNum}: {:elseif:} without matching {:if:}";
                } elseif (isset($elseUsedStack[$ifStack]) && $elseUsedStack[$ifStack]) {
                    $errors[] = "Line {$lineNum}: {:elseif:} after {:else:} - {:elseif:} must come before {:else:}";
                }
            }

            // Check closing tags
            if (strpos($line, '{:endif:}') !== false || strpos($line, '{:/if:}') !== false) {
                if ($ifStack <= 0) {
                    $errors[] = "Line {$lineNum}: {:endif:} without matching {:if:}";
                } else {
                    unset($elseUsedStack[$ifStack]); // Clean up stack
                    $ifStack--;
                }
            }
            if (strpos($line, '{:endfor:}') !== false || strpos($line, '{:/for:}') !== false) {
                $forStack--;
                if ($forStack < 0) {
                    $errors[] = "Line {$lineNum}: {:endfor:} without matching {:for:}";
                }
            }
            if (strpos($line, '{:endswitch:}') !== false || strpos($line, '{:/switch:}') !== false) {
                $switchStack--;
                if ($switchStack < 0) {
                    $errors[] = "Line {$lineNum}: {:endswitch:} without matching {:switch:}";
                }
            }

            // 🎯 Track {:codeend:} blocks
            if (strpos($line, '{:codeend:}') !== false) {
                $codeStack--;
                if ($codeStack < 0) {
                    $errors[] = "Line {$lineNum}: {:codeend:} without matching {:code:}";
                }
            }

            // Check {case} / {:default:} / {:othercase:} outside {switch}
            if ((preg_match('/\{:case\s+/', $line) || strpos($line, '{:default:}') !== false || strpos($line, '{:othercase:}') !== false) && $switchStack === 0) {
                $errors[] = "Line {$lineNum}: {:case:}/{:default:}/{:othercase:} without matching {:switch:}";
            }
        }

        // Check for unclosed blocks
        if ($ifStack > 0) {
            $errors[] = "Missing {:endif:} - {$ifStack} unclosed {:if:} block(s)";
        }
        if ($forStack > 0) {
            $errors[] = "Missing {:endfor:} - {$forStack} unclosed {:for:} loop(s)";
        }
        if ($switchStack > 0) {
            $errors[] = "Missing {:endswitch:} - {$switchStack} unclosed {:switch:} block(s)";
        }
        if ($codeStack > 0) {
            $errors[] = "Missing {:codeend:} - {$codeStack} unclosed {:code:} block(s)";
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

        // 🔌 SMART INJECTION TAGS — pass through as literal content
        // {:section name:}, {:sectionend:}, {:inject tag:}, {:inject tag;name:}
        // must appear verbatim in the compiled output so the frontend's
        // parseSections() and insertBeforeMarker() can process them after JS execution.
        // Without this check, {:sectionend:} gets resolved as a variable → "undefined".
        if ($this->isSmartInjectionTag($trimmedLine)) {
            $escapedLine = $this->escapeForJavaScript($line);
            return "  sContentResult += '{$escapedLine}\\u000A';\n";
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
            $this->userManagesBreaks = false; // Reset: assume auto-break until user writes {:break:}
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
            // User wrote {:break:} → they manage ALL breaks in this switch
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
        if (preg_match('/^\s*\{:for\s+(.*?):\}\s*$/', $line) ||
            preg_match('/^\s*\{:for %:\}\s*$/', $line) ||
            preg_match('/^\s*\{:foreach .+?:\}\s*$/', $line)) {
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
        if (preg_match('/\{:for\s+(.+?)\s+in\s+(.+?):\}/', $line, $matches)) {
            $variable = $matches[1];
            $collection = $matches[2];
            $this->pushLoopContext('fields');
            return "  for (let {$variable} of {$this->processVariable($collection, $tableIndex)}) {\n";
        }

        // Helper: resolve table reference - uses fixed index for db_table_file, or tableIdx for nmaxtables loops.
        //
        // NESTED-IN-TABLES override: when this loop sits ANYWHERE inside an outer
        // {:for nmaxtables:}, the JS `tableIdx` reassigned per outer iteration
        // MUST win over the static engine-context `$tableIndex`. Without this,
        // every inner nmaxitems/nmaxkeys/nmaxforeignkeys loop would lock to
        // the engine's PHP table context (e.g. 18 in db_table_file mode) and
        // emit identical content for every outer iteration.
        //
        // Stack-deep check (NOT just currentLoopContext === 'tables'): templates
        // with three or more nesting levels — e.g.
        //   {:for nmaxtables:}{:for nmaxforeignkeys:}{:for nmaxitems:}…{:endfor:}{:endfor:}{:endfor:}
        // have currentLoopContext === 'foreignkeys' by the time the innermost
        // nmaxitems loop is being emitted, so a shallow currentLoopContext check
        // would miss it and hard-code tables[18] for the inner loop preamble.
        // The stack-deep `in_array('tables', …)` catches 'tables' wherever it
        // sits in the parent chain — same fix pattern as getItemExpression() at
        // line ~1096 and the processVariable() central override at ~line 2086.
        $nestedInTables = $this->isInsideLoopContext('tables');
        $tableRef = ($tableIndex !== null && !$nestedInTables)
            ? "tables[{$tableIndex}]"
            : "tables[tableIdx]";

        // 🎯 KEYS LOOP - Loop through keys array
        if (strpos($line, '{:for nmaxkeys:}') !== false) {
            $this->pushLoopContext('keys');
            return "  for (let i = 0; i < gtree[0].project[0].{$tableRef}.nmaxkeys; i++) {\n";
        }

        // 🎯 FIELDS WITHOUT KEY LOOP - Loop through fieldsnokey array (index-based)
        if (strpos($line, '{:for nmaxitemsnokey:}') !== false) {
            $this->pushLoopContext('fieldsnokey');
            return "  for (let i = 0; i < gtree[0].project[0].{$tableRef}.nmaxitemsnokey; i++) {\n";
        }

        // 🎯 FIELDS WITHOUT KEY AND SEARCH KEY LOOP - Loop through fieldsnokeyall array (index-based)
        if (strpos($line, '{:for nmaxitemsnokeyall:}') !== false) {
            $this->pushLoopContext('fieldsnokeyall');
            return "  for (let i = 0; i < gtree[0].project[0].{$tableRef}.nmaxitemsnokeyall; i++) {\n";
        }

        // 🎯 FIELDS WITHOUT BLOB/TEXT LOOP - Loop through fieldsnoblob array (index-based)
        if (strpos($line, '{:for nmaxitemsnoblob:}') !== false) {
            $this->pushLoopContext('fieldsnoblob');
            return "  for (let i = 0; i < gtree[0].project[0].{$tableRef}.nmaxitemsnoblob; i++) {\n";
        }

        // 🎯 ALL FIELDS WITHOUT BLOB/TEXT LOOP (ignores assignments) - Loop through fieldsnobloball array
        if (strpos($line, '{:for nmaxitemsnobloball:}') !== false) {
            $this->pushLoopContext('fieldsnobloball');
            return "  for (let i = 0; i < gtree[0].project[0].{$tableRef}.nmaxitemsnobloball; i++) {\n";
        }

        // 🎯 FIELDS WITHOUT BINARY BLOB LOOP - Loop through fieldsnobinaryblob array
        if (strpos($line, '{:for nmaxitemsnobinaryblob:}') !== false) {
            $this->pushLoopContext('fieldsnobinaryblob');
            return "  for (let i = 0; i < gtree[0].project[0].{$tableRef}.nmaxitemsnobinaryblob; i++) {\n";
        }

        // 🎯 ALL FIELDS WITHOUT BINARY BLOB LOOP (ignores assignments)
        if (strpos($line, '{:for nmaxitemsnobinarybloball:}') !== false) {
            $this->pushLoopContext('fieldsnobinarybloball');
            return "  for (let i = 0; i < gtree[0].project[0].{$tableRef}.nmaxitemsnobinarybloball; i++) {\n";
        }

        // 🎯 CONSTRAINTS LOOP - Loop through constraints array
        if (strpos($line, '{:for nmaxconstraints:}') !== false) {
            $this->pushLoopContext('constraints');
            return "  for (let i = 0; i < gtree[0].project[0].{$tableRef}.nmaxconstraints; i++) {\n";
        }

        // 🎯 FOREIGN KEYS LOOP - Loop through foreignkeys array
        //
        // Counter variable is `_fkI` (not `i`) so nested fields-loops
        // (`{:for nmaxitems:}` declares `const i`) cannot shadow the outer FK
        // index. Without this, `{:foreign.X:}` inside the inner loop would
        // resolve to `foreignkeys[_fkI]` with `i` = field-index, blowing up when
        // field-index exceeds FK-count. Same fix pattern as nmaxtables which
        // uses `_tgenI`/`tableIdx` to survive nested shadowing.
        if (strpos($line, '{:for nmaxforeignkeys:}') !== false) {
            $this->pushLoopContext('foreignkeys');
            return "  for (let _fkI = 0; _fkI < gtree[0].project[0].{$tableRef}.nmaxforeignkeys; _fkI++) {\n";
        }

        // 🎯 FOREIGN KEYS UNIQUE LOOP - Deduplicated: one entry per referenced table
        if (strpos($line, '{:for nmaxforeignkeysunique:}') !== false) {
            $this->pushLoopContext('foreignkeysunique');
            return "  for (let _fkuI = 0; _fkuI < gtree[0].project[0].{$tableRef}.nmaxforeignkeysunique; _fkuI++) {\n";
        }

        // 🎯 SEARCH KEYS LOOP - Loop through fieldssearchkeys array (index-based into fields[])
        if (strpos($line, '{:for nmaxsearchkeys:}') !== false) {
            $this->pushLoopContext('fieldssearchkeys');
            return "  for (let i = 0; i < gtree[0].project[0].{$tableRef}.nmaxsearchkeys; i++) {\n";
        }

        // Standard nmaxitems loop — indirection via fieldsgen[].
        // fields[] holds ALL fields (incl. excluded/reference_only/template_only)
        // so FK/lookup still works, but only fields listed in fieldsgen[]
        // actually iterate. Body references `i` as the ACTUAL field index.
        if (strpos($line, '{:for nmaxitems:}') !== false) {
            $this->pushLoopContext('fields');
            return "  for (let _fgenI = 0; _fgenI < gtree[0].project[0].{$tableRef}.nmaxitems; _fgenI++) {\n"
                 . "    const i = gtree[0].project[0].{$tableRef}.fieldsgen[_fgenI];\n";
        }

        // Tables loop (nmaxtables and nmaxfiles are aliases).
        //
        // Indirection via tablesgen: tables[] holds ALL tables (incl. excluded,
        // reference_only, template_only) so FK/lookup still works, but only
        // tables listed in tablesgen[] actually iterate. nmaxtables === tablesgen.length.
        // Body code references `tableIdx` as the ACTUAL table index (not the
        // loop counter), so existing templates keep working unchanged.
        if (strpos($line, '{:for nmaxtables:}') !== false || strpos($line, '{:for nmaxfiles:}') !== false) {
            $this->pushLoopContext('tables');
            return "  for (let _tgenI = 0; _tgenI < gtree[0].project[0].nmaxtables; _tgenI++) {\n"
                 . "    const tableIdx = gtree[0].project[0].tablesgen[_tgenI];\n";
        }

        // 🎯 MIGRATION LOOPS - Loop through migration change arrays
        if (strpos($line, '{:for nmaxmigration_tables:}') !== false) {
            $this->pushLoopContext('migration_tables');
            return "  for (let migIdx = 0; migIdx < gtree[0].project[0].nmaxmigration_tables; migIdx++) {\n";
        }
        if (strpos($line, '{:for nmaxmigration_fields:}') !== false) {
            $this->pushLoopContext('migration_fields');
            return "  for (let migIdx = 0; migIdx < gtree[0].project[0].nmaxmigration_fields; migIdx++) {\n";
        }
        if (strpos($line, '{:for nmaxmigration_indexes:}') !== false) {
            $this->pushLoopContext('migration_indexes');
            return "  for (let migIdx = 0; migIdx < gtree[0].project[0].nmaxmigration_indexes; migIdx++) {\n";
        }
        if (strpos($line, '{:for nmaxmigration_foreignkeys:}') !== false) {
            $this->pushLoopContext('migration_foreignkeys');
            return "  for (let migIdx = 0; migIdx < gtree[0].project[0].nmaxmigration_foreignkeys; migIdx++) {\n";
        }

        // 🎯 FORM LAYOUT LOOPS
        if (strpos($line, '{:for nmaxlayoutsingles:}') !== false) {
            $this->pushLoopContext('layoutsingles');
            return "  for (let loopIndex_layoutsingles = 0; loopIndex_layoutsingles < (gtree[0].project[0].{$tableRef}.nmaxlayoutsingles || 0); loopIndex_layoutsingles++) {\n";
        }
        if (strpos($line, '{:for nmaxlayoutcolumns:}') !== false) {
            $this->pushLoopContext('layoutcolumns');
            return "  for (let loopIndex_layoutcolumns = 0; loopIndex_layoutcolumns < (gtree[0].project[0].{$tableRef}.nmaxlayoutcolumns || 0); loopIndex_layoutcolumns++) {\n";
        }
        if (strpos($line, '{:for nmaxlayoutbuttons:}') !== false) {
            $this->pushLoopContext('layoutbuttons');
            return "  for (let loopIndex_layoutbuttons = 0; loopIndex_layoutbuttons < (gtree[0].project[0].{$tableRef}.nmaxlayoutbuttons || 0); loopIndex_layoutbuttons++) {\n";
        }
        if (strpos($line, '{:for nmaxlayoutmenus:}') !== false) {
            $this->pushLoopContext('layoutmenus');
            return "  for (let loopIndex_layoutmenus = 0; loopIndex_layoutmenus < (gtree[0].project[0].{$tableRef}.nmaxlayoutmenus || 0); loopIndex_layoutmenus++) {\n";
        }

        // 🎯 REPORT LAYOUT LOOPS
        if (strpos($line, '{:for nmaxlayoutreportsingle:}') !== false) {
            $this->pushLoopContext('layoutreportsingles');
            return "  for (let loopIndex_layoutreportsingles = 0; loopIndex_layoutreportsingles < (gtree[0].project[0].{$tableRef}.nmaxlayoutreportsingle || 0); loopIndex_layoutreportsingles++) {\n";
        }
        if (strpos($line, '{:for nmaxlayoutreportlist:}') !== false) {
            $this->pushLoopContext('layoutreportlists');
            return "  for (let loopIndex_layoutreportlists = 0; loopIndex_layoutreportlists < (gtree[0].project[0].{$tableRef}.nmaxlayoutreportlist || 0); loopIndex_layoutreportlists++) {\n";
        }
        if (strpos($line, '{:for nmaxreportsingleelements:}') !== false) {
            $this->pushLoopContext('reportsingleelements');
            return "  for (let loopIndex_reportsingleelements = 0; loopIndex_reportsingleelements < (gtree[0].project[0].{$tableRef}.nmaxreportsingleelements || 0); loopIndex_reportsingleelements++) {\n";
        }
        if (strpos($line, '{:for nmaxreportlistelements:}') !== false) {
            $this->pushLoopContext('reportlistelements');
            return "  for (let loopIndex_reportlistelements = 0; loopIndex_reportlistelements < (gtree[0].project[0].{$tableRef}.nmaxreportlistelements || 0); loopIndex_reportlistelements++) {\n";
        }

        // 🎯 ITEM ARRAY-PROPERTY LOOP — {:for item.enum_values:} iterates over a
        // scalar-array property of the current item inside a {:for nmaxitems:} block.
        // Only `enum_values` is supported today (ENUM/SET values); any other array
        // properties on fields[i] would need their own special-cases.
        //
        // The loop counter `_valIdx` deliberately avoids `i` so the outer field-loop's
        // `i` (real field index, set from fieldsgen[]) stays accessible — that's what
        // makes `{:item.name:}` inside the inner block still resolve to the current
        // field. `{:value:}` (resolved separately in processVariable) gives the
        // current array entry.
        if (strpos($line, '{:for item.enum_values:}') !== false) {
            // NESTED-IN-TABLES override: same rationale as keys.X / foreign.X resolver.
            // When this inner loop sits inside a {:for nmaxtables:} outer loop, the
            // JS-runtime `tableIdx` reassigned per outer iteration MUST win over the
            // static engine-context `$tableIndex` — otherwise the enum_values lookup
            // locks to a single table (e.g. tables[1] from a db_table_file generation)
            // and crashes the moment the outer loop visits a different table whose
            // fields[i] has no enum_values (undefined.enum_values).
            $nestedInTables = $this->isInsideLoopContext('tables');
            $this->pushLoopContext('item_enum_values');
            $itemRef = ($tableIndex !== null && !$nestedInTables)
                ? "gtree[0].project[0].tables[{$tableIndex}].fields[i]"
                : "gtree[0].project[0].tables[tableIdx].fields[i]";
            return "  for (let _valIdx = 0; _valIdx < (({$itemRef}.enum_values) || []).length; _valIdx++) {\n"
                 . "    const value = {$itemRef}.enum_values[_valIdx];\n";
        }

        // Custom count loops - matches {:for countvar:}
        if (preg_match('/\{:for\s+(\w+):\}/', $line, $matches)) {
            $countVar = $matches[1];
            $this->pushLoopContext('fields'); // Default to fields
            return "  for (let i = 0; i < gtree[0].project[0].{$countVar}; i++) {\n";
        }

        // 🎯 RAW JAVASCRIPT LOOP - Pass through as-is if it looks like JavaScript syntax
        // Detect patterns like: {for let i = 0; i < 9; i++} or {for (let i = 0; i < 9; i++)}
        if (preg_match('/\{:for\s+(let|var|const)\s+/', $line) || preg_match('/\{:for\s*\(/', $line)) {
            // Extract the JavaScript loop code between {for and }
            if (preg_match('/\{:for\s+(.+?):\}\s*$/', $line, $matches)) {
                $jsLoopCode = trim($matches[1]);
                $this->pushLoopContext('custom'); // Custom JavaScript loop context
                return "  for ({$jsLoopCode}) {\n";
            }
        }

        // Fallback
        $this->pushLoopContext('fields');
        return "  for (let i = 0; i < gtree[0].project[0].{$tableRef}.nmaxitems; i++) {\n";
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

    private function getCurrentLoopContext(): string
    {
        return $this->currentLoopContext;
    }

    /**
     * Check if we are anywhere inside a loop of the given context type — including
     * the immediate (current) loop AND any outer parent loop.
     *
     * WARUM diese Helper-Methode existiert (sonst gibt's wieder die "2-Level vs 3-Level"
     * Bug-Klasse die uns am 2026-05-31 mehrfach beschäftigt hat):
     *
     * Der Loop-Context-Stack hat eine asymmetrische Semantik:
     *   - `$currentLoopContext`     = der INNERSTE aktive Loop
     *   - `$loopContextStack[]`     = die PARENTS davon (in Push-Reihenfolge)
     * `pushLoopContext('X')` schiebt den ALTEN currentLoopContext auf den Stack
     * und setzt currentLoopContext auf 'X'. Heißt: der aktuelle Loop ist NIE im
     * Stack, sondern immer NUR in $currentLoopContext.
     *
     * Wer "sind wir inside a 'tables' Loop?" prüfen will, muss daher BEIDE
     * checken — sonst:
     *   - Nur `currentLoopContext === 'tables'` → übersieht 3+ Level Nesting
     *     ({:for nmaxtables:}{:for nmaxforeignkeys:}{:for nmaxitems:}…)
     *   - Nur `in_array('tables', loopContextStack)` → übersieht 2-Level Nesting
     *     ({:for nmaxtables:}{:for nmaxitems:}…)
     *
     * Diese Helper macht beides in einem Aufruf und ist die einzige Stelle die
     * Code aufrufen soll. Niemals wieder `in_array('tables', $this->loopContextStack)`
     * irgendwo direkt schreiben — der Methodenname dokumentiert die Intention,
     * die rohen Property-Zugriffe verstecken den Bug.
     */
    private function isInsideLoopContext(string $context): bool
    {
        return $this->currentLoopContext === $context
            || in_array($context, $this->loopContextStack, true);
    }

    // 🎯 Get array name based on current loop context
    private function getArrayNameForContext(): string
    {
        switch ($this->currentLoopContext) {
            case 'keys':
                return 'keys';
            case 'fieldsnokey':
                return 'fieldsnokey';
            case 'fieldsnokeyall':
                return 'fieldsnokeyall';
            case 'fieldsnoblob':
                return 'fieldsnoblob';
            case 'fieldsnobloball':
                return 'fieldsnobloball';
            // These two were missing — fell through to 'fields' default and
            // produced `fields[fields[i]]` (double-indirection bug) inside
            // {:for nmaxitemsnobinaryblob:} loops.
            case 'fieldsnobinaryblob':
                return 'fieldsnobinaryblob';
            case 'fieldsnobinarybloball':
                return 'fieldsnobinarybloball';
            case 'fieldssearchkeys':
                return 'fieldssearchkeys';
            case 'constraints':
                return 'constraints';
            case 'fields':
            default:
                return 'fields';
        }
    }

    // 🎯 Check if current loop context uses index-based access (references into fields[])
    private function isIndexBasedContext(): bool
    {
        return in_array($this->currentLoopContext, self::INDEX_BASED_CONTEXTS);
    }

    // 🎯 Build JS expression for accessing the current item in a loop
    // Direct contexts (fields, keys, constraints): table.fields[i]
    // Index-based contexts (fieldsnokey, fieldsnokeyall): table.fields[table.fieldsnokey[i]]
    private function getItemExpression(?int $tableIndex): string
    {
        // NESTED-IN-TABLES override (same rationale as nmaxitems loop): when we
        // are resolving item.* inside a fields-loop that itself sits inside an
        // outer {:for nmaxtables:} loop, the JS `tableIdx` reassigned per outer
        // iteration MUST win over the static engine-context `$tableIndex`.
        // Without this, every outer iteration would emit identical inner field
        // references locked to the engine's PHP table context.
        $nestedInTables = $this->isInsideLoopContext('tables');

        $tablePrefix = ($tableIndex !== null && !$nestedInTables)
            ? "gtree[0].project[0].tables[{$tableIndex}]"
            : "gtree[0].project[0].tables[tableIdx]";

        if ($this->isIndexBasedContext()) {
            $arrayName = $this->getArrayNameForContext();
            return "{$tablePrefix}.fields[{$tablePrefix}.{$arrayName}[i]]";
        }

        $arrayName = $this->getArrayNameForContext();
        return "{$tablePrefix}.{$arrayName}[i]";
    }

    private function isLoopEnd(string $line): bool
    {
        // 🔧 SAUBERE LÖSUNG: Only treat as block loop end if {:endfor:} is standalone
        // This prevents inline {:endfor:} from being treated as block structure
        if (preg_match('/^\s*\{:endfor:\}\s*$/', $line) ||
            preg_match('/^\s*\{:\/for:\}\s*$/', $line)) {
            return true;
        }

        return false;
    }

    /**
     * 🎯 ENHANCED CONDITIONAL PROCESSING
     */
    private function isConditionalStart(string $line): bool
    {
        // Match standalone {:if condition:} or {:if condition{:var::}} (mixed content handled by processMixedContentLine)
        return preg_match('/^\s*\{:if\s+(.+?):?\}\s*$/', $line);
    }

    private function processConditionalStart(string $line, ?int $tableIndex): string
    {
        if (preg_match('/\{:if\s+(.+?):?\}/', $line, $matches)) {
            $condition = trim($matches[1]);
            // Normalize nested {:var::} → {:var:} (double colon from ::}} syntax)
            $condition = preg_replace('/\{:([a-zA-Z_][a-zA-Z0-9_.]*)::\}/', '{:$1:}', $condition);
            $jsCondition = $this->processCondition($condition, $tableIndex);
            return "  if ({$jsCondition}) {\n";
        }
        return "";
    }

    private function processCondition(string $condition, ?int $tableIndex): string
    {
        // Replace loop counter variables (longest names first to avoid substring matches)
        // e.g. 'nCountItemsNoKey' must be replaced before 'nCountItems' or 'nCount'.
        //
        // ORDER MATTERS — every name MUST come before any other name that is a
        // prefix of it. The "all" variants and the "NoBinaryBlob*" variants are
        // the long ones; if 'nCountItems' fires first it greedily eats the prefix
        // of 'nCountItemsNoBlob' and leaves 'iNoBlob' as a fake JS identifier.
        // That was the 2026-06-01 update_%1.php crash — a {:if nCountItemsNoBlob<…:}
        // condition became `if (iNoBlob < …)`, undefined → false → no comma →
        // SQL "UPDATE … set  WHERE …" + array(,$id) → PHP fatal.
        $condition = str_replace('nCountItemsNoBinaryBlobAll', 'i', $condition);
        $condition = str_replace('nCountItemsNoBinaryBlob', 'i', $condition);
        $condition = str_replace('nCountItemsMasterDetailNoKeys', 'i', $condition);
        $condition = str_replace('nCountItemsMasterDetail', 'i', $condition);
        $condition = str_replace('nCountItemsNoBlobAll', 'i', $condition);
        $condition = str_replace('nCountItemsNoBlob', 'i', $condition);
        $condition = str_replace('nCountItemsNoKeyAll', 'i', $condition);
        $condition = str_replace('nCountItemsNoKey', 'i', $condition);
        $condition = str_replace('nCountSearchkeys', 'i', $condition);
        $condition = str_replace('nCountConstraints', 'i', $condition);
        $condition = str_replace('nCountForeignKeysUnique', '_fkuI', $condition);
        $condition = str_replace('nCountForeignKeys', '_fkI', $condition);
        $condition = str_replace('nCountItems', 'i', $condition);
        $condition = str_replace('nCountKeys', 'i', $condition);
        $condition = str_replace('nCountTables', 'tableIdx', $condition);
        $condition = str_replace('nCount', 'i', $condition);

        // 🔧 Extract and replace all {:variable:} patterns in the condition (legacy support)
        $condition = preg_replace_callback('/\{:([a-zA-Z_][a-zA-Z0-9_.]*):\}/', function($matches) use ($tableIndex) {
            $varName = $matches[1];
            $replacement = $this->processVariable($varName, $tableIndex);

            // 🎯 Clean up the JavaScript concatenation syntax for conditions
            // processVariable returns: "' + gtree[0].project[0].filename + '"
            // We need only: gtree[0].project[0].filename
            $replacement = preg_replace("/^'\s*\+\s*/", '', $replacement); // Remove leading ' +
            $replacement = preg_replace("/\s*\+\s*'$/", '', $replacement); // Remove trailing  + '

            return $replacement;
        }, $condition);

        // 🔧 NEW: Also support bare variable names like item.typecast (without {:...:})
        // Match dotted variable names that are NOT inside quotes and NOT already processed
        $condition = preg_replace_callback('/\b(item|field|table|project|file|form)\.[a-zA-Z_][a-zA-Z0-9_.]*\b/', function($matches) use ($tableIndex) {
            $varName = $matches[0];
            $replacement = $this->processVariable($varName, $tableIndex);

            // 🎯 Clean up the JavaScript concatenation syntax for conditions
            $replacement = preg_replace("/^'\s*\+\s*/", '', $replacement);
            $replacement = preg_replace("/\s*\+\s*'$/", '', $replacement);

            return $replacement;
        }, $condition);

        // 🎯 Handle bare variable names (without {:...:} wrapper and without dot prefix)
        // e.g. {:if hasblob:} → resolve 'hasblob' via processVariable → gtree path
        // Must run AFTER the {:var:} and item.xxx replacements above.
        // Negative lookbehind (?<![.'"]) prevents matching words inside already-resolved
        // gtree property paths (.notnull, .phptype) or string literals ('string').
        $condition = preg_replace_callback('/(?<![.\'"])\b([a-zA-Z_][a-zA-Z0-9_]*)\b/', function($matches) use ($tableIndex) {
            $word = $matches[1];
            // Skip JavaScript keywords, literals, already-resolved expressions, and loop variables
            $skipWords = ['true', 'false', 'null', 'undefined', 'typeof', 'instanceof',
                          'i', 'j', 'tableIdx', 'gtree', 'project', 'tables', 'fields',
                          'keys', 'foreignkeys', 'constraints', 'lang', 'formset', 'windows',
                          'if', 'else', 'return', 'var', 'let', 'const', 'function',
                          'length', 'indexOf', 'includes', 'toString', 'trim',
                          'String', 'Number', 'Boolean', 'Array', 'Object', 'Math',
                          // Comparison operators — must NOT be resolved as variables!
                          // They are converted to JS operators in the next step.
                          'eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'and', 'or', 'not'];
            if (in_array($word, $skipWords)) {
                return $word;
            }
            // Try to resolve via processVariable - if it returns a gtree path, use it
            $resolved = $this->processVariable($word, $tableIndex);
            if (strpos($resolved, 'gtree[') !== false) {
                $resolved = preg_replace("/^'\s*\+\s*/", '', $resolved);
                $resolved = preg_replace("/\s*\+\s*'$/", '', $resolved);
                return $resolved;
            }
            return $word;
        }, $condition);

        // When comparing loop counter with loop limit (i < nmaxX), subtract 1
        // because WinDev counters are 1-based but JavaScript loops are 0-based.
        // WinDev: nCount goes 1..nmax, so nCount < nmax skips last element
        // JS: i goes 0..nmax-1, so i < nmax is ALWAYS true → need i < nmax - 1
        $tableRef = ($tableIndex !== null) ? $tableIndex : 'tableIdx';
        $condition = preg_replace(
            '/i\s*<\s*gtree\[0\]\.project\[0\]\.tables\[(?:\d+|tableIdx)\]\.(nmax\w+)/',
            'i < gtree[0].project[0].tables[' . $tableRef . '].$1 - 1',
            $condition
        );

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
        // Match standalone {:elseif condition:} (mixed content handled by processMixedContentLine)
        return preg_match('/^\s*\{:elseif\s+/', $line) && preg_match('/:\}\s*$/', $line);
    }

    private function processConditionalElseif(string $line, ?int $tableIndex): string
    {
        // Match {elseif condition}
        if (preg_match('/\{:elseif\s+(.+):\}/', $line, $matches)) {
            $condition = trim($matches[1]);
            $jsCondition = $this->processCondition($condition, $tableIndex);
            return "  } else if ({$jsCondition}) {\n";
        }

        // {elseif} without condition - ERROR (caught by validation, but don't process)
        // DO NOT treat as {:else:} to avoid double else blocks!
        return "  // ERROR: {elseif} requires a condition\n";
    }

    private function isConditionalElse(string $line): bool
    {
        // Match standalone {:else:} (mixed content handled by processMixedContentLine)
        return preg_match('/^\s*\{:else:\}\s*$/', $line);
    }

    private function isConditionalEnd(string $line): bool
    {
        // Match standalone {:endif:} or {:/if:} (mixed content handled by processMixedContentLine)
        return preg_match('/^\s*\{:endif:\}\s*$/', $line) || preg_match('/^\s*\{:\/if:\}\s*$/', $line);
    }

    /**
     * 🎛️ SWITCH PROCESSING
     */
    private function isSwitchStart(string $line): bool
    {
        // Match standalone {:switch ...:} (mixed content handled by processMixedContentLine)
        return preg_match('/^\s*\{:switch\s+(.+?):\}\s*$/', $line);
    }

    private function processSwitchStart(string $line, ?int $tableIndex): string
    {
        // Match {switch ...} including nested {variable} - use greedy match to last }
        if (preg_match('/\{:switch\s+(.+):\}\s*$/', $line, $matches)) {
            $switchVar = trim($matches[1]);

            // If switchVar contains {variable}, extract and process it
            if (preg_match('/^\{:([a-zA-Z_][a-zA-Z0-9_.]*):\}$/', $switchVar, $varMatch)) {
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
        // Match standalone {:case ...:} (mixed content handled by processMixedContentLine)
        return preg_match('/^\s*\{:case\s+(.+?):\}\s*$/', $line);
    }

    private function processSwitchCase(string $line): string
    {
        if (preg_match('/\{:case\s+(.+?):\}/', $line, $matches)) {
            $rawValue = trim($matches[1]);

            // Support comma-separated multiple values: {:case 2,3,4,5:} → case 2: case 3: case 4: case 5:
            if (strpos($rawValue, ',') !== false) {
                $values = array_map('trim', explode(',', $rawValue));
                $result = '';
                foreach ($values as $val) {
                    if (!preg_match('/^["\'].*["\']$/', $val) && !is_numeric($val)) {
                        $val = "'{$val}'";
                    }
                    $result .= "    case {$val}:\n";
                }
                return $result;
            }

            // Single value
            $caseValue = $rawValue;
            if (!preg_match('/^["\'].*["\']$/', $caseValue) && !is_numeric($caseValue)) {
                $caseValue = "'{$caseValue}'";
            }
            return "    case {$caseValue}:\n";
        }
        return "";
    }

    private function isSwitchDefault(string $line): bool
    {
        // Match standalone {:default:} or {:othercase:} (mixed content handled by processMixedContentLine)
        return preg_match('/^\s*\{:default:\}\s*$/', $line) || preg_match('/^\s*\{:othercase:\}\s*$/', $line);
    }

    private function isSwitchBreak(string $line): bool
    {
        // Match standalone {:break:} (mixed content handled by processMixedContentLine)
        return preg_match('/^\s*\{:break:\}\s*$/', $line);
    }

    private function isSwitchEnd(string $line): bool
    {
        // Match standalone {:endswitch:} or {:/switch:} (mixed content handled by processMixedContentLine)
        return preg_match('/^\s*\{:endswitch:\}\s*$/', $line) || preg_match('/^\s*\{:\/switch:\}\s*$/', $line);
    }

    /**
     * 📋 MACRO PROCESSING
     */
    private function isMacroDefinition(string $line): bool
    {
        return preg_match('/\{:macro\s+(\w+)(?:\((.*?)\))?:\}/', $line);
    }

    private function processMacroDefinition(string $line): string
    {
        // Macros are processed at compile time, not at runtime
        if (preg_match('/\{:macro\s+(\w+)(?:\((.*?)\))?:\}/', $line, $matches)) {
            $macroName = $matches[1];
            $params = isset($matches[2]) ? explode(',', $matches[2]) : [];
            // Store macro for later expansion
            $this->macros[$macroName] = ['params' => $params, 'content' => ''];
        }
        return "  // Macro definition: {$line}\n";
    }

    private function isMacroCall(string $line): bool
    {
        return preg_match('/\{:@(\w+)(?:\((.*?)\))?:\}/', $line);
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
        // Only return true if the line contains ONLY a function call (no surrounding text)
        // Lines with mixed content (text + function) should go through processContentLine
        $trimmed = trim($line);
        return preg_match('/^\{:(\w+)\((.*?)\):\}$/', $trimmed);
    }

    private function processFunctionCall(string $line, ?int $tableIndex): string
    {
        if (preg_match('/\{:(\w+)\((.*?)\):\}/', $line, $matches)) {
            $functionName = $matches[1];
            $args = $matches[2];

            if (isset($this->functions[$functionName])) {
                // Use processFunctionArguments for correct JS expression (without quotes)
                $jsArgs = $this->processFunctionArguments($args, $tableIndex);
                return "  sContentResult += {$functionName}({$jsArgs});\n";
            }
        }
        return "";
    }

    /**
     * 🔌 SMART INJECTION TAG DETECTION
     *
     * Detects Smart Injection tags that must pass through as literal content:
     * - {:section name:}     — Section start marker
     * - {:sectionend:}       — Section end marker
     * - {:inject tag:}       — Injection point marker (normal mode)
     * - {:inject tag;name:}  — Injection point marker (section mode)
     *
     * These tags are consumed by the frontend's parseSections() and insertBeforeMarker()
     * functions AFTER JavaScript execution. They must NOT be processed as variables.
     */
    private function isSmartInjectionTag(string $trimmedLine): bool
    {
        // Check if the line CONTAINS any Smart Injection tag.
        // These can appear standalone or embedded in comments:
        //   {:sectionend:}
        //   {:section auth1:}
        //   // {:inject routes:}
        //   <!-- {:inject scripts;head:} -->

        // {:sectionend:}
        if (strpos($trimmedLine, '{:sectionend:}') !== false) {
            return true;
        }

        // {:section name:} — {:section followed by space (name contains no {:} syntax)
        if (strpos($trimmedLine, '{:section ') !== false && strpos($trimmedLine, ':}') !== false) {
            return true;
        }

        // {:inject tag:} or {:inject tag;name:}
        if (strpos($trimmedLine, '{:inject ') !== false && strpos($trimmedLine, ':}') !== false) {
            return true;
        }

        return false;
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

        // Skip if it's a standalone template command (entire line is just one template tag)
        if (preg_match('/^\s*\{:(for|endfor|foreach|if|endif|else|elseif|switch|endswitch|case|default|othercase|break|macro|\/\w+)\s*.*?:\}\s*$/', $line)) {
            return false;
        }

        // Check for ANY structural template construct mixed with content
        // This covers: for, endfor, if, endif, else, elseif, switch, endswitch, case, default, break, othercase
        return preg_match('/\{:(?:for\s+.*?|endfor|foreach\s+.*?|if\s+.*?|endif|else|elseif\s+.*?|switch\s+.*?|endswitch|case\s+.*?|default|othercase|break):\}/', $line) ||
               preg_match('/\{:for\s+\{:[^:]+:\}:\}/', $line);
    }

    private function processMixedContentLine(string $line, ?int $tableIndex): string
    {
        $result = '';
        $currentPos = 0;
        $lineLength = strlen($line);

        // Universal pattern matching ALL structural template constructs
        // Order matters: longer/more specific patterns first to avoid partial matches
        // Note: Conditions (if/elseif/switch) can contain nested {:var:} constructs,
        // so their patterns use [^{}:]* with optional {:...:} groups instead of [^:]+
        $nestedCondition = '(?:[^{}:]*(?:\\{:[^}]+\\}|:(?!\\}))?)*'; // Matches content with optional nested {:var:}
        // Note: :? before closing \} handles both {:if cond:} and {:if cond{:var::}} syntax
        $templatePattern = '/\{:for\s+\{:[^:]+:\}:\}'  // {:for {:var:}:} (nested syntax)
            . '|\{:foreach\s+[^:]+:\}'                  // {:foreach ...:}
            . '|\{:for\s+\w+:\}'                        // {:for word:}
            . '|\{:elseif\s+' . $nestedCondition . ':?\\}' // {:elseif condition:} (before else!)
            . '|\{:if\s+' . $nestedCondition . ':?\\}'  // {:if condition:} (supports nested {:var:})
            . '|\{:switch\s+' . $nestedCondition . ':?\\}' // {:switch var:} (supports nested {:var:})
            . '|\{:case\s+[^:]+:\}'                     // {:case value:}
            . '|\{:endif:\}'                             // {:endif:}
            . '|\{:endfor:\}'                            // {:endfor:}
            . '|\{:else:\}'                              // {:else:}
            . '|\{:endswitch:\}'                         // {:endswitch:}
            . '|\{:default:\}'                           // {:default:}
            . '|\{:othercase:\}'                         // {:othercase:}
            . '|\{:break:\}'                             // {:break:}
            . '/';

        // Parse the line to find template syntax
        while ($currentPos < $lineLength) {
            if (preg_match($templatePattern, $line, $matches, PREG_OFFSET_CAPTURE, $currentPos)) {
                $matchText = $matches[0][0];
                $matchPos = $matches[0][1];

                // Add content before the template syntax
                $hadContentBefore = ($matchPos > $currentPos);
                if ($hadContentBefore) {
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

                // Determine if this tag opens a block (content before it needs a newline INSIDE the block)
                $isBlockOpener = strpos($matchText, '{:if ') === 0
                    || strpos($matchText, '{:for ') === 0
                    || strpos($matchText, '{:foreach ') === 0
                    || strpos($matchText, '{:elseif ') === 0
                    || $matchText === '{:else:}';

                // Process the template syntax based on type
                if (strpos($matchText, '{:for ') === 0 || strpos($matchText, '{:foreach ') === 0) {
                    $result .= $this->processInlineLoopStart($matchText, $tableIndex);
                } elseif ($matchText === '{:endfor:}') {
                    $result .= $this->processInlineLoopEnd();
                } elseif (strpos($matchText, '{:if ') === 0) {
                    $result .= $this->processInlineConditionalStart($matchText, $tableIndex);
                } elseif ($matchText === '{:endif:}') {
                    $result .= $this->processInlineConditionalEnd();
                } elseif (strpos($matchText, '{:elseif ') === 0) {
                    // Extract condition from {:elseif condition:}
                    if (preg_match('/\{:elseif\s+(.+):\}/', $matchText, $elseifMatch)) {
                        $jsCondition = $this->processCondition($elseifMatch[1], $tableIndex);
                        $result .= "  } else if ({$jsCondition}) {\n";
                    }
                } elseif ($matchText === '{:else:}') {
                    $result .= "  } else {\n";
                } elseif (strpos($matchText, '{:switch ') === 0) {
                    if (preg_match('/\{:switch\s+(.+?):\}/', $matchText, $switchMatch)) {
                        $result .= $this->processSwitchStart("{$matchText}", $tableIndex);
                    }
                } elseif ($matchText === '{:endswitch:}') {
                    $result .= "  }\n";
                } elseif (strpos($matchText, '{:case ') === 0) {
                    $result .= $this->processSwitchCase($matchText);
                } elseif ($matchText === '{:default:}' || $matchText === '{:othercase:}') {
                    $result .= "    default:\n";
                } elseif ($matchText === '{:break:}') {
                    $result .= "      break;\n";
                }

                // When content preceded a block-opening tag AND the tag is the last
                // thing on the line, the newline belongs INSIDE the block so it only
                // appears when the condition/loop is active.
                // Example: ->get(){:if hasblob:}\n  → newline only when hasblob=true
                // But NOT: AAAA{:if x:}BBBB → no extra newline (inline continues)
                $isAtEndOfLine = ($matchPos + strlen($matchText)) >= $lineLength;
                if ($hadContentBefore && $isBlockOpener && $isAtEndOfLine) {
                    $result .= "  sContentResult += '\\u000A';\n";
                }

                $currentPos = $matchPos + strlen($matchText);
                $lastMatchText = $matchText;
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
                    $lastMatchText = null; // Content after last tag → newline already included
                }
                break;
            }
        }

        // Line ended with a closing tag (while-loop exited because $currentPos >= $lineLength)
        // The newline after the closing tag must be preserved, otherwise the next line glues onto this one
        if (isset($lastMatchText) && (
            $lastMatchText === '{:endif:}' ||
            $lastMatchText === '{:endfor:}' ||
            $lastMatchText === '{:endswitch:}'
        )) {
            $result .= "  sContentResult += '\\u000A';\n";
        }

        return $result;
    }

    private function processInlineLoopStart(string $matchText, ?int $tableIndex): string
    {
        $this->loopDepth++;

        // 🎯 NESTED-IN-TABLES OVERRIDE — same rationale as processVariable() at ~line 2086.
        //
        // This whole function is a parallel implementation of processLoopStart() for
        // "inline" loop tags (multiple loops on one line, or other edge cases that
        // bypass the line-based loop emitter). Every elseif-branch below historically
        // wrote out a fresh `$tableIndex !== null ? tables[{$tableIndex}] : tables[tableIdx]`
        // ternary without any nested-tables guard. That meant: in a template like
        //   {:for nmaxtables:}{:for nmaxforeignkeysunique:}…{:endfor:}{:endfor:}
        // generated from a db_table_file context (tableIndex = 1), the INNER loop
        // header emitted `tables[1].nmaxforeignkeysunique` while the body (which goes
        // through foreign.X resolver with its own nested check) emitted `tables[tableIdx]`.
        // First outer iteration ran fine because _fkuI stays inside tables[1]'s range;
        // second outer iteration broke because tables[tableIdx ≠ 1].foreignkeysunique[_fkuI]
        // was outside its range and crashed at `.referencedtable`.
        //
        // Single override here makes every "$tableIndex !== null" branch below fall
        // through to its tables[tableIdx] arm automatically. Specialized branches
        // (nmaxitems at ~line 1707) keep their local nested guard as safety net.
        if ($tableIndex !== null && $this->isInsideLoopContext('tables')) {
            $tableIndex = null;
        }

        // Extract loop variable - support BOTH formats:
        // New format: {:for nmaxitems:}
        // Old format: {:for {:nmaxitems:}:}
        $loopVar = null;
        if (preg_match('/\{:for\s+(\w+):\}/', $matchText, $matches)) {
            // New simple format: {:for nmaxitems:}
            $loopVar = $matches[1];
        } elseif (preg_match('/\{:for\s+\{:(.+?):\}:\}/', $matchText, $matches)) {
            // Old nested format: {:for {:nmaxitems:}:}
            $loopVar = $matches[1];
        }

        if ($loopVar) {

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
                // 🎯 FOREIGN KEYS loop - uses `_fkI` to survive nested shadowing
                // (see comment at the other nmaxforeignkeys emit block).
                $this->pushLoopContext('foreignkeys');
                if ($tableIndex !== null) {
                    return "  for (let _fkI = 0; _fkI < gtree[0].project[0].tables[{$tableIndex}].nmaxforeignkeys; _fkI++) {\n";
                } else {
                    return "  for (let _fkI = 0; _fkI < gtree[0].project[0].tables[tableIdx].nmaxforeignkeys; _fkI++) {\n";
                }
            } elseif ($loopVar === 'nmaxforeignkeysunique') {
                // 🎯 FOREIGN KEYS UNIQUE loop - same `_fkuI` pattern
                $this->pushLoopContext('foreignkeysunique');
                if ($tableIndex !== null) {
                    return "  for (let _fkuI = 0; _fkuI < gtree[0].project[0].tables[{$tableIndex}].nmaxforeignkeysunique; _fkuI++) {\n";
                } else {
                    return "  for (let _fkuI = 0; _fkuI < gtree[0].project[0].tables[tableIdx].nmaxforeignkeysunique; _fkuI++) {\n";
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
                // Search keys loop (for database search/file-key fields) - index-based into fields[]
                $this->pushLoopContext('fieldssearchkeys');
                if ($tableIndex !== null) {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndex}].nmaxsearchkeys; i++) {\n";
                } else {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[tableIdx].nmaxsearchkeys; i++) {\n";
                }
            } elseif ($loopVar === 'nmaxitems') {
                // Items/fields loop — indirection via fieldsgen[].
                // nmaxitems === fieldsgen.length, body's `i` = fieldsgen[_fgenI]
                // so templates referencing {item.xxx:} keep working unchanged
                // against the full fields[] array.
                //
                // NESTED-IN-TABLES override: when this nmaxitems sits INSIDE an
                // outer {:for nmaxtables:} loop (ANYWHERE in the parent chain,
                // not necessarily directly), the outer loop redefines the JS
                // `tableIdx` per iteration. Using the static `$tableIndex` here
                // would lock the inner loop to the engine's PHP context table
                // (e.g. 18 when generating from a db_table_file context) and
                // emit the same fields for every outer iteration. Stack-deep
                // check catches 3+ level nesting like
                // {:for nmaxtables:}{:for nmaxforeignkeys:}{:for nmaxitems:}…
                // where currentLoopContext would be 'foreignkeys' at this point
                // and a shallow check would miss it.
                $nestedInTables = $this->isInsideLoopContext('tables');
                $this->pushLoopContext('fields');
                if ($tableIndex !== null && !$nestedInTables) {
                    return "  for (let _fgenI = 0; _fgenI < gtree[0].project[0].tables[{$tableIndex}].nmaxitems; _fgenI++) {\n"
                         . "    const i = gtree[0].project[0].tables[{$tableIndex}].fieldsgen[_fgenI];\n";
                } else {
                    return "  for (let _fgenI = 0; _fgenI < gtree[0].project[0].tables[tableIdx].nmaxitems; _fgenI++) {\n"
                         . "    const i = gtree[0].project[0].tables[tableIdx].fieldsgen[_fgenI];\n";
                }
            } elseif ($loopVar === 'nmaxlanguages') {
                // 🎯 LANGUAGES loop - through project lang array
                $this->pushLoopContext('languages');
                return "  for (let i = 0; i < gtree[0].project[0].nmaxlanguages; i++) {\n";
            } elseif ($loopVar === 'nmaxitemsnoblob') {
                // 🎯 FIELDS WITHOUT BLOB/TEXT loop — through fieldsnoblob array (index-based).
                // Parallel to processLoopStart() line 854; was missing here so inline
                // {:for nmaxitemsnoblob:} fell through to the generic fallback and
                // emitted gtree[0].project[0].nmaxitemsnoblob (project-level, undefined)
                // instead of gtree[0].project[0].tables[tableIdx].nmaxitemsnoblob — the
                // loop ran 0 times and {update_X.php} SQL came out as
                // "UPDATE … set  WHERE …" with no columns and an empty array element.
                $this->pushLoopContext('fieldsnoblob');
                if ($tableIndex !== null) {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndex}].nmaxitemsnoblob; i++) {\n";
                } else {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[tableIdx].nmaxitemsnoblob; i++) {\n";
                }
            } elseif ($loopVar === 'nmaxitemsnobloball') {
                // 🎯 ALL FIELDS WITHOUT BLOB/TEXT loop (ignores assignments) — parallel
                // to processLoopStart() line 860; same fix as nmaxitemsnoblob above.
                $this->pushLoopContext('fieldsnobloball');
                if ($tableIndex !== null) {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndex}].nmaxitemsnobloball; i++) {\n";
                } else {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[tableIdx].nmaxitemsnobloball; i++) {\n";
                }
            } elseif ($loopVar === 'nmaxitemsnokeyall') {
                // 🎯 FIELDS WITHOUT KEY AND SEARCH KEY loop — parallel to
                // processLoopStart() line 848; same fix as nmaxitemsnoblob above.
                $this->pushLoopContext('fieldsnokeyall');
                if ($tableIndex !== null) {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndex}].nmaxitemsnokeyall; i++) {\n";
                } else {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[tableIdx].nmaxitemsnokeyall; i++) {\n";
                }
            } elseif ($loopVar === 'nmaxitemsnobinaryblob') {
                // 🎯 FIELDS WITHOUT BINARY BLOB loop
                $this->pushLoopContext('fieldsnobinaryblob');
                if ($tableIndex !== null) {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndex}].nmaxitemsnobinaryblob; i++) {\n";
                } else {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[tableIdx].nmaxitemsnobinaryblob; i++) {\n";
                }
            } elseif ($loopVar === 'nmaxitemsnobinarybloball') {
                // 🎯 ALL FIELDS WITHOUT BINARY BLOB loop (ignores assignments)
                $this->pushLoopContext('fieldsnobinarybloball');
                if ($tableIndex !== null) {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndex}].nmaxitemsnobinarybloball; i++) {\n";
                } else {
                    return "  for (let i = 0; i < gtree[0].project[0].tables[tableIdx].nmaxitemsnobinarybloball; i++) {\n";
                }
            } elseif ($loopVar === 'nmaxtables' || $loopVar === 'nmaxfiles') {
                // 🎯 TABLES loop — indirection via tablesgen[].
                // tables[] keeps ALL tables (incl. non-iterable ones for FK lookup),
                // nmaxtables === tablesgen.length. Body uses tableIdx = tablesgen[_tgenI]
                // so templates referencing {table.xxx:} work unchanged.
                // (nmaxfiles is the legacy alias; same semantics.)
                $this->pushLoopContext('tables');
                return "  for (let _tgenI = 0; _tgenI < gtree[0].project[0].nmaxtables; _tgenI++) {\n"
                     . "    const tableIdx = gtree[0].project[0].tablesgen[_tgenI];\n";
            } else {
                // Generic loop variable
                $this->pushLoopContext('fields'); // Default to fields
                return "  for (let i = 0; i < gtree[0].project[0].{$loopVar}; i++) {\n";
            }
        }

        // Handle simple {for %} syntax — shorthand for {:for nmaxitems:},
        // same fieldsgen indirection so excluded/reference_only/template_only
        // fields are skipped while remaining available in fields[] by name/index.
        if (strpos($matchText, '{:for %:}') !== false) {
            $this->pushLoopContext('fields');
            if ($tableIndex !== null) {
                return "  for (let _fgenI = 0; _fgenI < gtree[0].project[0].tables[{$tableIndex}].nmaxitems; _fgenI++) {\n"
                     . "    const i = gtree[0].project[0].tables[{$tableIndex}].fieldsgen[_fgenI];\n";
            } else {
                return "  for (let _fgenI = 0; _fgenI < gtree[0].project[0].tables[tableIdx].nmaxitems; _fgenI++) {\n"
                     . "    const i = gtree[0].project[0].tables[tableIdx].fieldsgen[_fgenI];\n";
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
        // Extract condition: strip {:if and closing :} or }
        // Handles both {:if cond:} and {:if cond{:var::}} syntax
        $inner = $matchText;
        $inner = preg_replace('/^\{:if\s+/', '', $inner);  // Remove opening {:if
        $inner = preg_replace('/:?\}$/', '', $inner);       // Remove closing :} or }

        // Normalize nested {:var::} → {:var:} (double colon from ::}} syntax)
        $inner = preg_replace('/\{:([a-zA-Z_][a-zA-Z0-9_.]*)::\}/', '{:$1:}', $inner);

        $condition = trim($inner);
        if ($condition !== '') {
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
        // 🔧 STEP 1: Convert REAL CR/LF/Tab BYTES to placeholders BEFORE backslash doubling
        // These are actual control character bytes (0x0D, 0x0A, 0x09) — not text like "\r"
        $text = str_replace("\r\n", '§§CRLF§§', $text);   // Real CRLF pair (must be first!)
        $text = str_replace("\r", '§§CR§§', $text);        // Real CR byte (0x0D)
        $text = str_replace("\n", '§§LF§§', $text);        // Real LF byte (0x0A)
        $text = str_replace("\t", '§§TAB§§', $text);       // Real Tab byte (0x09)

        // 🔧 STEP 2: Double all backslashes
        // Text like \\ru_RU\\ becomes \\\\ru_RU\\\\ — preserved correctly
        // NO conversion of \r \n \t text sequences — those are literal text, not escape codes
        $text = str_replace('\\', '\\\\', $text);

        // 🔧 STEP 3: Escape quotes
        $text = str_replace("'", "\\'", $text);
        $text = str_replace('"', '\\"', $text);

        // 🔧 STEP 4: Restore real control character placeholders to JavaScript Unicode escapes
        $text = str_replace('§§CRLF§§', '\\u000D\\u000A', $text);
        $text = str_replace('§§CR§§', '\\u000D', $text);
        $text = str_replace('§§LF§§', '\\u000A', $text);
        $text = str_replace('§§TAB§§', '\\u0009', $text);

        return $text;
    }

    /**
     * 🔤 ENHANCED VARIABLE PROCESSING
     */
    private function hasVariables(string $line): bool
    {
        // Match valid template variable names AND function calls
        // Variables: {:varname:}, {:item.name:}
        // Functions: {:upper(tablename):}, {:substr(name, 0, 3):}
        return preg_match('/\{:([a-zA-Z_][a-zA-Z0-9_.]*(?:\([^)]*\))?):\}/', $line);
    }

    private function processAllVariables(string $line, ?int $tableIndex): string
    {
        // Process all template variables with enhanced handling
        $processedLine = preg_replace_callback('/\{:([^:]+):\}/', function($matches) use ($tableIndex) {
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

        // Match BOTH simple variables AND function calls
        // Pattern 1: {:varname:} - simple variable
        // Pattern 2: {:funcname(args):} - function call
        $offset = 0;
        while (preg_match('/\{:([a-zA-Z_][a-zA-Z0-9_.]*(?:\([^)]*\))?):\}/', $line, $matches, PREG_OFFSET_CAPTURE, $offset)) {
            $match = $matches[1][0];
            $matchStart = $matches[0][1];

            // Add text before match
            if ($matchStart > $offset) {
                $textBefore = substr($line, $offset, $matchStart - $offset);
                $currentPart .= $this->escapeForJavaScript($textBefore);
            }

            // Close current string part if not empty
            if ($currentPart !== '') {
                $parts[] = "'{$currentPart}'";
                $currentPart = '';
            }

            // Check if it's a function call
            if (preg_match('/^(\w+)\((.+)\)$/', $match, $funcMatch)) {
                $funcName = $funcMatch[1];
                $funcArgs = $funcMatch[2];

                // Process the arguments (they might be variables)
                $processedArgs = $this->processFunctionArguments($funcArgs, $tableIndex);
                $parts[] = "{$funcName}({$processedArgs})";
            } else {
                // Simple variable
                $variableResult = $this->processVariable($match, $tableIndex);
                $cleanVariable = str_replace(["' + ", " + '"], '', $variableResult);
                $cleanVariable = trim($cleanVariable, "'");
                // NOTE: An earlier `preg_replace('/\s*\|\|\s*[\'"].*?[\'"]/', ...)` stripped
                // the trailing `|| ''` fallback that several resolvers emit (layoutsingle.*,
                // layoutcolumn.*, form.*, formset.*, reportsingleelement.* etc.). Stripping
                // it caused missing/null properties to render literally as "undefined" or
                // "null" in the output (test FORM-01 surfaced this on `layoutsingle.row`,
                // `layoutsingle.col`, `layoutcolumn.header`, etc.). The fallback is the
                // resolver's promise to the template — preserving it costs a few bytes of
                // extra JS but makes the output behave as documented.
                $parts[] = $cleanVariable;
            }

            $offset = $matchStart + strlen($matches[0][0]);
        }

        // Add remaining text after last match
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

    /**
     * 🛠️ Process function arguments - convert variable names to JS expressions
     */
    private function processFunctionArguments(string $args, ?int $tableIndex): string
    {
        // Split by comma, but respect nested parentheses
        $argList = array_map('trim', explode(',', $args));
        $processedArgs = [];

        foreach ($argList as $arg) {
            // Check if arg is a string literal (starts and ends with quotes)
            if ((str_starts_with($arg, '"') && str_ends_with($arg, '"')) ||
                (str_starts_with($arg, "'") && str_ends_with($arg, "'"))) {
                $processedArgs[] = $arg;
            }
            // Check if arg is a number
            elseif (is_numeric($arg)) {
                $processedArgs[] = $arg;
            }
            // It's a variable name - get the raw JS expression
            else {
                $jsExpr = $this->getVariableAsJsExpression($arg, $tableIndex);
                $processedArgs[] = $jsExpr;
            }
        }

        return implode(', ', $processedArgs);
    }

    /**
     * 🛠️ Get variable as pure JS expression (without string concatenation quotes)
     */
    private function getVariableAsJsExpression(string $variable, ?int $tableIndex): string
    {
        $variable = trim($variable);

        // NESTED-IN-TABLES override (single source of truth for the whole map):
        // when this resolver runs inside a {:for nmaxtables:} loop, the JS-runtime
        // `tableIdx` reassigned per outer iteration MUST win over the static
        // engine-context `$tableIndex`. Without this, ALL the *_mappings below
        // (filename, nmaxitems, nmaxkeys, hastimestamps, …) would lock to the
        // db_table_file context table — so an outer-loop iteration over 19 tables
        // would print "Table 0: users / Table 1: users / Table 2: users / …"
        // instead of advancing the table per iteration. Same pattern as the
        // keys.X / foreign.X resolver fixes.
        $nestedInTables = $this->isInsideLoopContext('tables');

        // Check legacyMappings first (most common variables)
        $tableRef = ($tableIndex !== null && !$nestedInTables)
            ? "gtree[0].project[0].tables[{$tableIndex}]"
            : "gtree[0].project[0].tables[tableIdx]";
        $legacyMappings = [
            // Project-level
            'projectname' => "gtree[0].project[0].projectname",
            'projectcaption' => "gtree[0].project[0].lang[gtree[0].project[0].selectedlanguageindex].caption",
            'projectdescription' => "gtree[0].project[0].lang[gtree[0].project[0].selectedlanguageindex].filedescription",
            'projectid' => "gtree[0].project[0].projectid",
            'projectdatabase' => "gtree[0].project[0].projectdatabase",
            'tablename' => "gtree[0].project[0].tablename", // Set directly on project level before execution
            'tableindex' => "gtree[0].project[0].tableindex", // Set directly on project level before execution

            // Table-level: basic info
            'filename' => "{$tableRef}.filename",
            'filecamelcase' => "{$tableRef}.filecamelcase",
            'filepascalcase' => "{$tableRef}.filepascalcase",
            'filenameshort' => "{$tableRef}.filenameshort",
            'filenamerenamed' => "{$tableRef}.filenamerenamed",
            'filekeyname' => "{$tableRef}.primarykeyfield",
            'fileprimarykey' => "{$tableRef}.fileprimarykey",

            // Table-level: singular variants
            'filesingular' => "{$tableRef}.filesingular",
            'filesingularpascalcase' => "{$tableRef}.filesingularpascalcase",
            'filesingularcamelcase' => "{$tableRef}.filesingularcamelcase",
        ];

        if (isset($legacyMappings[$variable])) {
            return $legacyMappings[$variable];
        }

        // Item variables (inside loops) - supports index-based contexts
        if (strpos($variable, 'item.') === 0) {
            $itemVar = substr($variable, 5);
            $itemExpr = $this->getItemExpression($tableIndex);
            return "{$itemExpr}.{$itemVar}";
        }

        // Field variables (alias for item.* inside field loops)
        if (strpos($variable, 'field.') === 0) {
            $fieldVar = substr($variable, 6);
            $itemExpr = $this->getItemExpression($tableIndex);
            return "{$itemExpr}.{$fieldVar}";
        }

        // Foreign key variables — context-aware:
        //   • Inside nmaxforeignkeys       → foreignkeys[_fkI]
        //   • Inside nmaxforeignkeysunique → foreignkeysunique[_fkuI]
        // Same pattern as keys.* which auto-switches between keys[i] and
        // constraints[i] based on currentLoopContext. Templates can use
        // {:foreign.X:} in either loop type without thinking about the array.
        if (strpos($variable, 'foreign.') === 0) {
            $fkVar = substr($variable, 8);
            if ($this->currentLoopContext === 'foreignkeysunique') {
                return "{$tableRef}.foreignkeysunique[_fkuI].{$fkVar}";
            }
            return "{$tableRef}.foreignkeys[_fkI].{$fkVar}";
        }

        // Foreign key unique variables (inside nmaxforeignkeysunique loops)
        if (strpos($variable, 'foreignunique.') === 0) {
            $fkuVar = substr($variable, 14);
            return "{$tableRef}.foreignkeysunique[_fkuI].{$fkuVar}";
        }

        // Keys variables (inside nmaxkeys loops) — keys[i] is a constraint entry
        if (strpos($variable, 'keys.') === 0) {
            $keysVar = substr($variable, 5);
            return "{$tableRef}.keys[i].{$keysVar}";
        }

        // Table variables (inside nmaxtables loops)
        if (strpos($variable, 'table.') === 0) {
            $tableVar = substr($variable, 6);
            return "gtree[0].project[0].tables[tableIdx].{$tableVar}";
        }

        // Language variables (inside nmaxlanguages loops)
        if (strpos($variable, 'language.') === 0) {
            $langVar = substr($variable, 9);
            return "gtree[0].project[0].lang[i].{$langVar}";
        }

        // Fallback - try direct project access
        return "gtree[0].project[0].{$variable}";
    }

    private function processVariable(string $variable, ?int $tableIndex): string
    {
        $variable = trim($variable);

        // 🎯 NESTED-IN-TABLES OVERRIDE — single source of truth for the whole resolver.
        //
        // When this resolver runs inside a {:for nmaxtables:} loop, the JS-runtime
        // `tableIdx` reassigned per outer iteration MUST win over the static
        // engine-context `$tableIndex` (the db_table_file PHP context). Without
        // this, every standalone {:filename:} / {:nmaxitems:} / {:hastimestamps:}
        // / {:nmaxkeys:} / … would lock to the db_table_file table and emit the
        // same value for every outer iteration — so "Table 0: users / Table 1:
        // users / Table 2: users / ..." instead of advancing per iteration.
        //
        // We override `$tableIndex` to null here so every `$tableIndex !== null`
        // branch in the resolver below automatically falls through to its
        // `tables[tableIdx]` arm — one fix for ~50 hand-written mappings.
        // Specialized resolvers further down (keys.X, foreign.X, item.enum_values,
        // nmaxenum, …) had their own local nested checks before this central
        // override existed; those are now redundant-but-harmless safety nets.
        if ($tableIndex !== null && $this->isInsideLoopContext('tables')) {
            $tableIndex = null;
        }

        // 🎯 LOOP COUNTER VARIABLES
        // These reference identifiers declared by the for-loop preamble:
        //   - `i`        : real field index (set by nmaxitems-loop from fieldsgen[_fgenI])
        //                   or plain counter for other loops
        //   - `tableIdx` : real table index (set by nmaxtables-loop from tablesgen[_tgenI])
        //                   or fixed table index for db_table_file generations
        //   - `nCount`   : 1-based legacy alias (WinDev-style) — see condition rewriter
        //   - `migIdx`   : migration loop counter
        // Without these handlers, `{:i:}` would fall through to the generic project-level
        // fallback and resolve to `gtree[0].project[0].i` (undefined) — that's the bug
        // that surfaced as "FELD #undefined" in the field loop output.
        // 🎯 LOOP COUNTER `{:i:}` — CONTEXT-AWARE
        // The template-engine convention: `{:i:}` is the current loop's array-
        // resolved index. Different loops declare different counter variables
        // (PHP-emit time), so we map context → JS identifier here. Without this
        // mapping `{:i:}` in a tables-loop would emit `' + i + '` but the loop
        // only declares `tableIdx` — JS runtime crashes with "i is undefined".
        if ($variable === 'i') {
            $counterMap = [
                'item_enum_values' => '_valIdx',        // innermost wins (outer `i` still reachable via closure)
                'tables' => 'tableIdx',                  // nmaxtables emits `const tableIdx = tablesgen[_tgenI]`
                'foreignkeys' => '_fkI',                 // FK loop counter — `_fkI` survives nested items-loop shadowing
                'foreignkeysunique' => '_fkuI',          // FK-unique loop counter — same rationale
                'migration_tables' => 'migIdx',
                'migration_fields' => 'migIdx',
                'migration_indexes' => 'migIdx',
                'migration_foreignkeys' => 'migIdx',
                'layoutsingles' => 'loopIndex_layoutsingles',
                'layoutcolumns' => 'loopIndex_layoutcolumns',
                'layoutbuttons' => 'loopIndex_layoutbuttons',
                'layoutmenus' => 'loopIndex_layoutmenus',
                'layoutreportsingles' => 'loopIndex_layoutreportsingles',
                'layoutreportlists' => 'loopIndex_layoutreportlists',
                'reportsingleelements' => 'loopIndex_reportsingleelements',
                'reportlistelements' => 'loopIndex_reportlistelements',
            ];
            // languages, fields, keys, constraints, foreignkeys*, fieldsnokey*,
            // fieldsnoblob*, fieldsnobinaryblob*, fieldssearchkeys all use `i` directly.
            $jsCounter = $counterMap[$this->currentLoopContext] ?? 'i';
            return "' + {$jsCounter} + '";
        }
        if ($variable === 'tableIdx' || $variable === 'migIdx') {
            return "' + {$variable} + '";
        }
        if ($variable === 'nCount') {
            // WinDev-style 1-based counter
            return "' + (i + 1) + '";
        }

        // 🎯 ITEM ARRAY-PROPERTY LOOP VALUE
        // Inside `{:for item.enum_values:}` the loop preamble (see processLoopStart)
        // declares `const value = gtree[...].fields[i].enum_values[_valIdx];`. So
        // `{:value:}` must resolve to that local — NOT fall through to the project
        // fallback which would give `gtree[0].project[0].value` (undefined).
        if ($variable === 'value' && $this->currentLoopContext === 'item_enum_values') {
            return "' + value + '";
        }

        // 🎯 PER-ITEM ENUM VALUE COUNT
        // `{:nmaxenum:}` resolves to the length of the current item's enum_values
        // array. Only meaningful inside a `{:for nmaxitems:}` loop (where `i` is
        // the field index) and inside the `{:for item.enum_values:}` inner loop
        // (where `i` is still the OUTER field index thanks to JS closure — the
        // inner counter is `_valIdx`). Outside any field context it resolves to 0.
        if ($variable === 'nmaxenum') {
            if ($this->currentLoopContext === 'fields' || $this->currentLoopContext === 'item_enum_values') {
                // NESTED-IN-TABLES override (same as item.enum_values loop emitter):
                // when this resolver runs inside an outer {:for nmaxtables:}, the JS
                // `tableIdx` MUST win over the static $tableIndex, otherwise enum
                // counter locks to one table and reports the wrong length for every
                // other table the outer loop visits.
                $nestedInTables = $this->isInsideLoopContext('tables');
                $tableRef = ($tableIndex !== null && !$nestedInTables)
                    ? "gtree[0].project[0].tables[{$tableIndex}]"
                    : "gtree[0].project[0].tables[tableIdx]";
                return "' + (({$tableRef}.fields[i].enum_values) || []).length + '";
            }
            return "' + 0 + '";
        }

        // 🎯 PROJECT-LEVEL VARIABLES
        if (strpos($variable, 'project.') === 0) {
            $projectVar = substr($variable, 8); // Remove 'project.'
            return "' + gtree[0].project[0].{$projectVar} + '";
        }

        // 🎯 FORM ELEMENT VARIABLES (direkter Zugriff auf aktuelles Fenster - basierend auf form_window_type)
        // z.B. {form.button_nav_first.x}, {form.container.width}, {form.button_save.label}
        // Nutzt currentFormWindowIdx (0-4 basierend auf Template-Datei form_window_type)
        if (strpos($variable, 'form.') === 0) {
            $formPath = substr($variable, 5); // Remove 'form.'
            // Convert all dots to optional chaining: button_nav_first.x → button_nav_first?.x
            $safeFormPath = str_replace('.', '?.', $formPath);
            // form.button_save.label → formset.windows[INDEX].button_save?.label
            // Use the literal index value for reliable access (not dependent on gtree variable)
            $windowIdx = $this->currentFormWindowIdx;
            return "' + (gtree[0].project[0].formset?.windows[{$windowIdx}]?.{$safeFormPath} ?? '') + '";
        }

        // 🎯 FORMSET VARIABLES (direkter Zugriff auf FormSet und Fenster)
        // z.B. {formset.name}, {formset.create_edit.button_save.label}, {formset.default_button_color}
        if (strpos($variable, 'formset.') === 0) {
            $formsetPath = substr($variable, 8); // Remove 'formset.'
            // Convert all dots to optional chaining for safe access
            $safeFormsetPath = str_replace('.', '?.', $formsetPath);
            return "' + (gtree[0].project[0].formset?.{$safeFormsetPath} ?? '') + '";
        }

        // 🎯 LAYOUT VARIABLES — resolve table reference (fixed index or tableIdx loop var)
        $layoutTableRef = $tableIndex !== null ? "tables[{$tableIndex}]" : "tables[tableIdx]";

        // LAYOUT SINGLE VARIABLES (innerhalb {:for nmaxlayoutsingles:} Loop)
        if (strpos($variable, 'layoutsingle.') === 0) {
            $layoutVar = substr($variable, 13);
            return "' + (gtree[0].project[0].{$layoutTableRef}.layoutsingles[loopIndex_layoutsingles].{$layoutVar} ?? '') + '";
        }

        // LAYOUT COLUMN VARIABLES (innerhalb {:for nmaxlayoutcolumns:} Loop)
        if (strpos($variable, 'layoutcolumn.') === 0) {
            $layoutVar = substr($variable, 13);
            return "' + (gtree[0].project[0].{$layoutTableRef}.layoutcolumns[loopIndex_layoutcolumns].{$layoutVar} ?? '') + '";
        }

        // LAYOUT BUTTON VARIABLES (innerhalb {:for nmaxlayoutbuttons:} Loop)
        if (strpos($variable, 'layoutbutton.') === 0) {
            $layoutVar = substr($variable, 13);
            return "' + (gtree[0].project[0].{$layoutTableRef}.layoutbuttons[loopIndex_layoutbuttons].{$layoutVar} ?? '') + '";
        }

        // LAYOUT MENU VARIABLES (innerhalb {:for nmaxlayoutmenus:} Loop)
        if (strpos($variable, 'layoutmenu.') === 0) {
            $layoutVar = substr($variable, 11);
            return "' + (gtree[0].project[0].{$layoutTableRef}.layoutmenus[loopIndex_layoutmenus].{$layoutVar} ?? '') + '";
        }

        // 🎯 REPORT VARIABLES — IMPORTANT: longer prefixes must be checked BEFORE
        // their shorter siblings, otherwise `reportsingleelement.x` would
        // accidentally match `reportsingle.element.x` and break.

        // LAYOUT REPORT SINGLE VARIABLES (innerhalb {:for nmaxlayoutreportsingle:} Loop)
        if (strpos($variable, 'layoutreportsingle.') === 0) {
            $layoutVar = substr($variable, strlen('layoutreportsingle.'));
            return "' + (gtree[0].project[0].{$layoutTableRef}.layoutreportsingles[loopIndex_layoutreportsingles].{$layoutVar} ?? '') + '";
        }
        // LAYOUT REPORT LIST VARIABLES (innerhalb {:for nmaxlayoutreportlist:} Loop)
        if (strpos($variable, 'layoutreportlist.') === 0) {
            $layoutVar = substr($variable, strlen('layoutreportlist.'));
            return "' + (gtree[0].project[0].{$layoutTableRef}.layoutreportlists[loopIndex_layoutreportlists].{$layoutVar} ?? '') + '";
        }
        // REPORT-SINGLE ELEMENT VARIABLES (innerhalb {:for nmaxreportsingleelements:} Loop)
        if (strpos($variable, 'reportsingleelement.') === 0) {
            $elementVar = substr($variable, strlen('reportsingleelement.'));
            return "' + (gtree[0].project[0].{$layoutTableRef}.reportsingle?.elements[loopIndex_reportsingleelements]?.{$elementVar} ?? '') + '";
        }
        // REPORT-LIST ELEMENT VARIABLES (innerhalb {:for nmaxreportlistelements:} Loop)
        if (strpos($variable, 'reportlistelement.') === 0) {
            $elementVar = substr($variable, strlen('reportlistelement.'));
            return "' + (gtree[0].project[0].{$layoutTableRef}.reportlist?.elements[loopIndex_reportlistelements]?.{$elementVar} ?? '') + '";
        }
        // REPORT-PATTERN scalar (design template — single, no loop)
        if (strpos($variable, 'reportsingle.') === 0) {
            $patternVar = substr($variable, strlen('reportsingle.'));
            $safePath = str_replace('.', '?.', $patternVar);
            return "' + (gtree[0].project[0].{$layoutTableRef}.reportsingle?.{$safePath} ?? '') + '";
        }
        if (strpos($variable, 'reportlist.') === 0) {
            $patternVar = substr($variable, strlen('reportlist.'));
            $safePath = str_replace('.', '?.', $patternVar);
            return "' + (gtree[0].project[0].{$layoutTableRef}.reportlist?.{$safePath} ?? '') + '";
        }
        // REPORT PATTERN identity meta
        if (strpos($variable, 'reportpattern.') === 0) {
            $patternVar = substr($variable, strlen('reportpattern.'));
            $safePath = str_replace('.', '?.', $patternVar);
            return "' + (gtree[0].project[0].{$layoutTableRef}.{$safePath} ?? '') + '";
        }

        // 🎯 FILE-LEVEL VARIABLES (innerhalb {for {nmaxfiles}} / {for nmaxtables} Loop)
        if (strpos($variable, 'file.') === 0) {
            $fileVar = substr($variable, 5); // Remove 'file.'

            // file.name is a legacy alias for filename (gtree has no 'name' on tables)
            if ($fileVar === 'name') {
                $fileVar = 'filename';
            }

            // Special handling for file.caption with language support
            if ($fileVar === 'caption') {
                if ($tableIndex !== null) {
                    return "' + gtree[0].project[0].tables[{$tableIndex}].lang[gtree[0].project[0].selectedlanguageindex].caption + '";
                } else {
                    return "' + gtree[0].project[0].tables[tableIdx].lang[gtree[0].project[0].selectedlanguageindex].caption + '";
                }
            }

            // file.description maps to default language caption (lang[0].caption)
            if ($fileVar === 'description') {
                if ($tableIndex !== null) {
                    return "' + gtree[0].project[0].tables[{$tableIndex}].lang[0].caption + '";
                } else {
                    return "' + gtree[0].project[0].tables[tableIdx].lang[0].caption + '";
                }
            }

            if ($tableIndex !== null) {
                return "' + gtree[0].project[0].tables[{$tableIndex}].{$fileVar} + '";
            } else {
                return "' + gtree[0].project[0].tables[tableIdx].{$fileVar} + '";
            }
        }

        // 🎯 ITEM/FIELD VARIABLES - Context-aware array selection (supports index-based contexts)
        if (strpos($variable, 'item.') === 0 || strpos($variable, 'field.') === 0) {
            $fieldVar = substr($variable, 5); // Remove 'item.' or 'field.'

            // 🎯 Special mapping for keys array (uses 'column' instead of 'name')
            if ($this->currentLoopContext === 'keys' && $fieldVar === 'name') {
                $fieldVar = 'column'; // keys[i].column instead of keys[i].name
            }

            // 🎯 Use getItemExpression() for transparent direct/index-based access
            $itemExpr = $this->getItemExpression($tableIndex);

            // Special handling for caption - use lang array
            if ($fieldVar === 'caption') {
                return "' + {$itemExpr}.lang[gtree[0].project[0].selectedlanguageindex].caption + '";
            }

            // Reject sub-paths (item.lang[0].caption) and array-access; bare scalars only.
            // Anything else needs its own dedicated resolver — falls through to the
            // generic block below or stays unmodified.
            if (!ctype_alpha($fieldVar[0] ?? '_') || strpbrk($fieldVar, '.[]') !== false) {
                // fall through
            } else {
                // Regular field variables — `?? ''` keeps optional properties from
                // rendering as literal "undefined" (e.g. linktable on non-FK fields,
                // enum_values on non-enum fields, generation_expression on plain cols).
                return "' + ({$itemExpr}.{$fieldVar} ?? '') + '";
            }
        }

        // 🎯 DIRECT VARIABLES - Clean and essential only (no excessive variants!)
        $legacyMappings = [
            // PROJECT BASICS
            'projectname' => "gtree[0].project[0].projectname",
            'projectcaption' => "gtree[0].project[0].lang[gtree[0].project[0].selectedlanguageindex].caption",
            'projectdescription' => "gtree[0].project[0].lang[gtree[0].project[0].selectedlanguageindex].filedescription",
            'projectid' => "gtree[0].project[0].projectid",
            'projectdatabase' => "gtree[0].project[0].projectdatabase",
            'projecturl' => "gtree[0].project[0].projecturl",
            'projectdirectory' => "gtree[0].project[0].projectdirectory",
            'startpage' => "gtree[0].project[0].startpage",
            'defaultlanguage' => "gtree[0].project[0].lang[gtree[0].project[0].selectedlanguageindex].code", // Language code (e.g., 'en', 'de')
            'defaultlanguagename' => "gtree[0].project[0].lang[gtree[0].project[0].selectedlanguageindex].name", // Language name (e.g., 'English', 'Deutsch')
            'defaultlanguageindex' => "gtree[0].project[0].selectedlanguageindex", // Language index (e.g., 0, 1, 2)
            'filenameshortlength' => "gtree[0].project[0].filenameshortlength",

            // LANGUAGE VARIABLES (selected/current language)
            'languageid' => "gtree[0].project[0].lang[gtree[0].project[0].selectedlanguageindex].id", // Current language ID
            'languagename' => "gtree[0].project[0].lang[gtree[0].project[0].selectedlanguageindex].name", // Current language name (e.g., 'English', 'Deutsch')
            'languagetoken' => "gtree[0].project[0].selectedlanguage", // Current language code (e.g., 'en', 'de')
            'selectedlanguage' => "gtree[0].project[0].selectedlanguage", // Alias for languagetoken
            'selectedlanguageindex' => "gtree[0].project[0].selectedlanguageindex", // Current language index

            // DATABASE CONNECTION VARIABLES
            // Intentionally includes username/password/port — these are needed for
            // generated config files (appsettings.json, .env, docker-compose.yml, etc.).
            // Keep this block in sync with the legacyMappings whitelist in isKnownVariable().
            'projectdbid' => "gtree[0].project[0].projectdbid", // Database/Schema ID
            'projectdbtype' => "gtree[0].project[0].projectdbtype", // Database type (MySQL, PostgreSQL, etc.)
            'projectdbserver' => "gtree[0].project[0].projectdbserver", // Database server host
            'projectdbport' => "gtree[0].project[0].projectdbport", // Database server port (e.g. 5432, 3306)
            'projectdbname' => "gtree[0].project[0].projectdbname", // Schema/Database name
            'projectdbusername' => "gtree[0].project[0].projectdbusername", // Database user
            'projectdbpassword' => "gtree[0].project[0].projectdbpassword", // Database password

            // LOCALIZATION SETTINGS (short template-friendly names)
            'decimalsep' => "gtree[0].project[0].decimal_separator",
            'thousandsep' => "gtree[0].project[0].thousands_separator",
            'dateformat' => "gtree[0].project[0].date_format",
            'timeformat' => "gtree[0].project[0].time_format",
            'currencysym' => "gtree[0].project[0].currency_symbol",
            'timezone' => "gtree[0].project[0].timezone",

            // TEMPLATE INFO (values are set directly on project level in UltimateTemplateController)
            'templateid' => "gtree[0].project[0].templateid",
            'projecttemplateid' => "gtree[0].project[0].templateid", // Alias for backward compatibility
            'templatename' => "gtree[0].project[0].templatename",
            'templatecategory' => "gtree[0].project[0].templatecategory",
            'templatedescription' => "gtree[0].project[0].templatedescription",

            // TEMPLATE FILE VARIABLES (per-file, injected during processing)
            'templatefolder' => "gtree[0].project[0].templatefolder", // Folder from output path
            'templatepage' => "gtree[0].project[0].templatepage", // Current template file name
            'templatepagename' => "gtree[0].project[0].templatepagename", // File name without extension
            'templatefilepath' => "gtree[0].project[0].templatefilepath", // Template file path
            'templateoutputpath' => "gtree[0].project[0].templateoutputpath", // Output path for generated file

            // SYSTEM INFO
            'laravelversion' => "gtree[0].project[0].laravelversion",

            // FILE/TABLE INFO
            'tablename' => "gtree[0].project[0].tablename", // Set directly on project level before execution
            'tableindex' => "gtree[0].project[0].tableindex", // Set directly on project level before execution
            'filename' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filename" : "gtree[0].project[0].tables[tableIdx].filename",
            'filenameshort' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filenameshort" : "gtree[0].project[0].tables[tableIdx].filenameshort",
            'fileid' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fileid" : "gtree[0].project[0].tables[tableIdx].fileid",
            'filecaption' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].lang[gtree[0].project[0].selectedlanguageindex].caption" : "gtree[0].project[0].tables[tableIdx].lang[gtree[0].project[0].selectedlanguageindex].caption",
            'filedescription' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].lang[gtree[0].project[0].selectedlanguageindex].caption" : "gtree[0].project[0].tables[tableIdx].lang[gtree[0].project[0].selectedlanguageindex].caption",
            'filekeyname' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].primarykeyfield" : "gtree[0].project[0].tables[tableIdx].primarykeyfield",
            'fileprimarykey' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fileprimarykey" : "gtree[0].project[0].tables[tableIdx].fileprimarykey",
            'filegeneratemasterdetail' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filegeneratemasterdetail" : "gtree[0].project[0].tables[tableIdx].filegeneratemasterdetail",
            'filedetailfileid' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filedetailfileid" : "gtree[0].project[0].tables[tableIdx].filedetailfileid",
            'filedetailfilename' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filedetailfilename" : "gtree[0].project[0].tables[tableIdx].filedetailfilename",
            'filedetailkey' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filedetailkey" : "gtree[0].project[0].tables[tableIdx].filedetailkey",

            // Table naming variants
            'filecamelcase' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filecamelcase" : "gtree[0].project[0].tables[tableIdx].filecamelcase",
            'filepascalcase' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filepascalcase" : "gtree[0].project[0].tables[tableIdx].filepascalcase",
            'filenamerenamed' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filenamerenamed" : "gtree[0].project[0].tables[tableIdx].filenamerenamed",

            // Singular variants
            'filesingular' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filesingular" : "gtree[0].project[0].tables[tableIdx].filesingular",
            'filesingularpascalcase' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filesingularpascalcase" : "gtree[0].project[0].tables[tableIdx].filesingularpascalcase",
            'filesingularcamelcase' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].filesingularcamelcase" : "gtree[0].project[0].tables[tableIdx].filesingularcamelcase",

            // TABLE FLAGS (boolean)
            'hastimestamps' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].hastimestamps" : "gtree[0].project[0].tables[tableIdx].hastimestamps",
            'hasprimarykey' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].hasprimarykey" : "gtree[0].project[0].tables[tableIdx].hasprimarykey",
            'hasblob' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].hasblob" : "gtree[0].project[0].tables[tableIdx].hasblob",
            'hasbinaryblob' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].hasbinaryblob" : "gtree[0].project[0].tables[tableIdx].hasbinaryblob",
            'hasforeignkeys' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].hasforeignkeys" : "gtree[0].project[0].tables[tableIdx].hasforeignkeys",

            // COUNTERS
            'nmaxitems' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxitems" : "gtree[0].project[0].tables[tableIdx].nmaxitems",
            // fieldsgen[] per-table index array for {:for nmaxitems:} indirection.
            // Parallel to tablesgen[] at project level.
            'fieldsgen' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].fieldsgen" : "gtree[0].project[0].tables[tableIdx].fieldsgen",
            'nmaxitemsnokey' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxitemsnokey" : "gtree[0].project[0].tables[tableIdx].nmaxitemsnokey",
            'nmaxitemsnokeyall' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxitemsnokeyall" : "gtree[0].project[0].tables[tableIdx].nmaxitemsnokeyall",
            'nmaxitemsnoblob' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxitemsnoblob" : "gtree[0].project[0].tables[tableIdx].nmaxitemsnoblob",
            'nmaxitemsnobloball' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxitemsnobloball" : "gtree[0].project[0].tables[tableIdx].nmaxitemsnobloball",
            'nmaxitemsnobinaryblob' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxitemsnobinaryblob" : "gtree[0].project[0].tables[tableIdx].nmaxitemsnobinaryblob",
            'nmaxitemsnobinarybloball' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxitemsnobinarybloball" : "gtree[0].project[0].tables[tableIdx].nmaxitemsnobinarybloball",
            'nmaxkeys' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxkeys" : "gtree[0].project[0].tables[tableIdx].nmaxkeys",
            'nmaxforeignkeys' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxforeignkeys" : "gtree[0].project[0].tables[tableIdx].nmaxforeignkeys",
            'nmaxforeignkeysunique' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxforeignkeysunique" : "gtree[0].project[0].tables[tableIdx].nmaxforeignkeysunique",
            'nmaxitemsmasterdetail' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxitemsmasterdetail" : "gtree[0].project[0].tables[tableIdx].nmaxitemsmasterdetail",
            'nmaxitemsmasterdetailnokeys' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxitemsmasterdetailnokeys" : "gtree[0].project[0].tables[tableIdx].nmaxitemsmasterdetailnokeys",
            // nmaxfiles is a legacy alias — always maps to nmaxtables in the gtree data.
            'nmaxfiles' => "gtree[0].project[0].nmaxtables",
            'nmaxtables' => "gtree[0].project[0].nmaxtables",
            // tablesgen[] exposes the index array of iterable tables (full/code_only).
            // tables[tablesgen[i]] is the table iterated at position i in a
            // {:for nmaxtables:} loop. Available for templates that want to
            // manually iterate without the {:for:} directive.
            'tablesgen' => "gtree[0].project[0].tablesgen",
            'nmaxlanguages' => "gtree[0].project[0].nmaxlanguages",
            'nmaxsearchkeys' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxsearchkeys" : "gtree[0].project[0].tables[tableIdx].nmaxsearchkeys",

            // FORM/REPORT layout counters (per table)
            'nmaxlayoutsingles' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxlayoutsingles" : "gtree[0].project[0].tables[tableIdx].nmaxlayoutsingles",
            'layoutsinglecount' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].layoutsinglecount" : "gtree[0].project[0].tables[tableIdx].layoutsinglecount",
            'nmaxlayoutcolumns' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxlayoutcolumns" : "gtree[0].project[0].tables[tableIdx].nmaxlayoutcolumns",
            'nmaxlayoutbuttons' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxlayoutbuttons" : "gtree[0].project[0].tables[tableIdx].nmaxlayoutbuttons",
            'nmaxlayoutmenus' => $tableIndex !== null ? "gtree[0].project[0].tables[{$tableIndex}].nmaxlayoutmenus" : "gtree[0].project[0].tables[tableIdx].nmaxlayoutmenus",

            // REPORT pattern + layout counters / per-table report metadata
            'nmaxreportsingleelements' => $tableIndex !== null ? "(gtree[0].project[0].tables[{$tableIndex}].nmaxreportsingleelements || 0)" : "(gtree[0].project[0].tables[tableIdx].nmaxreportsingleelements || 0)",
            'nmaxreportlistelements' => $tableIndex !== null ? "(gtree[0].project[0].tables[{$tableIndex}].nmaxreportlistelements || 0)" : "(gtree[0].project[0].tables[tableIdx].nmaxreportlistelements || 0)",
            'nmaxlayoutreportsingle' => $tableIndex !== null ? "(gtree[0].project[0].tables[{$tableIndex}].nmaxlayoutreportsingle || 0)" : "(gtree[0].project[0].tables[tableIdx].nmaxlayoutreportsingle || 0)",
            'nmaxlayoutreportlist' => $tableIndex !== null ? "(gtree[0].project[0].tables[{$tableIndex}].nmaxlayoutreportlist || 0)" : "(gtree[0].project[0].tables[tableIdx].nmaxlayoutreportlist || 0)",
            // FormSet / ReportPattern provenance — the id is now ALWAYS the
            // real effective DB id (no sentinel for "inherited"). `-1` is
            // only emitted when nothing exists at all. To detect provenance
            // (own assignment vs. project-default inheritance) branch on
            // the `*_inherited` flag instead:
            //   {:if form_set_id gt 0:}
            //     {:if form_set_inherited:} ... inherited from project default ...
            //     {:else:}                 ... explicit table assignment ...
            //     {:endif:}
            //   {:else:}                   ... no FormSet anywhere ...
            //   {:endif:}
            'report_pattern_id' => $tableIndex !== null ? "(gtree[0].project[0].tables[{$tableIndex}].report_pattern_id || -1)" : "(gtree[0].project[0].tables[tableIdx].report_pattern_id || -1)",
            'report_pattern_name' => $tableIndex !== null ? "(gtree[0].project[0].tables[{$tableIndex}].report_pattern_name || '')" : "(gtree[0].project[0].tables[tableIdx].report_pattern_name || '')",
            'report_pattern_inherited' => $tableIndex !== null ? "(gtree[0].project[0].tables[{$tableIndex}].report_pattern_inherited ?? null)" : "(gtree[0].project[0].tables[tableIdx].report_pattern_inherited ?? null)",
            'form_set_id' => $tableIndex !== null ? "(gtree[0].project[0].tables[{$tableIndex}].form_set_id || -1)" : "(gtree[0].project[0].tables[tableIdx].form_set_id || -1)",
            'form_set_name' => $tableIndex !== null ? "(gtree[0].project[0].tables[{$tableIndex}].form_set_name || '')" : "(gtree[0].project[0].tables[tableIdx].form_set_name || '')",
            'form_set_inherited' => $tableIndex !== null ? "(gtree[0].project[0].tables[{$tableIndex}].form_set_inherited ?? null)" : "(gtree[0].project[0].tables[tableIdx].form_set_inherited ?? null)",
        ];

        if (isset($legacyMappings[$variable])) {
            return "' + " . $legacyMappings[$variable] . " + '";
        }

        // 🎯 ITEM VARIABLES — only entries with NON-trivial resolution (translation lookup,
        // explicit '' fallback) need to live in the whitelist. Everything else (name,
        // pascalcase, type, linktable, linkfield, ..., is_generated, enum_values, ...)
        // is handled by the generic `item.*` fallback below, which adds `?? ''` so
        // missing properties render as empty string instead of literal "undefined".
        $itemMappings = [
            // Caption goes through the per-language translation array, not the bare field.
            'item.caption' => $tableIndex !== null
                ? "gtree[0].project[0].tables[{$tableIndex}].fields[i].lang[gtree[0].project[0].selectedlanguageindex].caption"
                : "gtree[0].project[0].tables[tableIdx].fields[i].lang[gtree[0].project[0].selectedlanguageindex].caption",
            // editmask used to render literal "undefined" in templates that string-concat
            // it; the explicit `|| ''` predates the generic resolver and stays for safety.
            'item.editmask' => $tableIndex !== null
                ? "(gtree[0].project[0].tables[{$tableIndex}].fields[i].editmask || '')"
                : "(gtree[0].project[0].tables[tableIdx].fields[i].editmask || '')",
        ];

        if (isset($itemMappings[$variable])) {
            return "' + " . $itemMappings[$variable] . " + '";
        }

        // Generic fallback for item.* — covers everything else the whitelist misses:
        // size, precision, scale, enum_values, is_generated, generation_expression,
        // generation_storage, isprimary, isunique, isindex, isforeign, istimestamp,
        // autoincrement, isblob, isbinaryblob, visible, notnull, order, id, default,
        // phptype, jstype, laraveltype, state, generation_mode, ... — anything the
        // gtree adds in the future works without an engine edit.
        //
        // Note: `i` is already the real field index (set by the nmaxitems-loop preamble
        // from fieldsgen[_fgenI]), so fields[i].<x> resolves to the iterated row.
        if (strpos($variable, 'item.') === 0) {
            $itemField = substr($variable, 5);
            // Reject sub-paths/array-access (item.lang[0].caption etc.) — they need
            // their own dedicated resolvers; here we only handle one-level scalar fields.
            if ($itemField !== '' && ctype_alpha($itemField[0]) && strpbrk($itemField, '.[]') === false) {
                $fieldsRef = $tableIndex !== null
                    ? "gtree[0].project[0].tables[{$tableIndex}].fields[i]"
                    : "gtree[0].project[0].tables[tableIdx].fields[i]";
                return "' + ({$fieldsRef}.{$itemField} ?? '') + '";
            }
        }

        // 🎯 KEYS VARIABLES (for {for {nmaxkeys}} loops)
        // `keys.*` placeholders read from whichever array the current loop is iterating.
        // {:for nmaxkeys:}        → keys[]        (PRIMARY KEY + UNIQUE only, 2 entries for users)
        // {:for nmaxconstraints:} → constraints[] (ALL constraints incl. INDEX/KEY + FOREIGN, 5 entries)
        // Without this, `{:keys.constraintname:}` inside an nmaxconstraints loop would index
        // into keys[i] past its length and throw "Cannot read properties of undefined".
        //
        // NESTED-IN-TABLES override (same rationale as getItemExpression line ~1096):
        // when this resolver runs inside a {:for nmaxtables:} loop, the JS `tableIdx`
        // reassigned per outer iteration MUST win over the static engine-context
        // `$tableIndex`. Without this, an outer nmaxtables loop emits the loop body
        // 19 times but every body locks to tables[0] — runs fine for the first table
        // and then crashes at constraints[k] when the actual iterated table has more
        // constraints than table 0. We detect nesting via the loopContextStack (NOT
        // currentLoopContext, which is already 'constraints' or 'keys' by the time
        // this resolver runs).
        $nestedInTables = $this->isInsideLoopContext('tables');
        $keysArrayName = $this->currentLoopContext === 'constraints' ? 'constraints' : 'keys';
        $keysRef = ($tableIndex !== null && !$nestedInTables)
            ? "gtree[0].project[0].tables[{$tableIndex}].{$keysArrayName}[i]"
            : "gtree[0].project[0].tables[tableIdx].{$keysArrayName}[i]";
        $keysMappings = [
            'keys.name' => "{$keysRef}.name",
            'keys.id' => "{$keysRef}.id",
            'keys.type' => "{$keysRef}.type",
            'keys.typecast' => "{$keysRef}.typecast",
            'keys.constrainttype' => "{$keysRef}.constrainttype",
            'keys.constraintname' => "{$keysRef}.constraintname",
            'keys.column' => "{$keysRef}.column",
            'keys.isprimary' => "{$keysRef}.isprimary",
            'keys.isunique' => "{$keysRef}.isunique",
            'keys.isindex' => "{$keysRef}.isindex",
        ];

        if (isset($keysMappings[$variable])) {
            return "' + " . $keysMappings[$variable] . " + '";
        }

        // Generic fallback for keys.* — same rationale as language.* / table.*:
        // covers any constraint metadata the whitelist hasn't been updated for.
        if (strpos($variable, 'keys.') === 0) {
            $keysField = substr($variable, 5);
            if ($keysField !== '' && ctype_alpha($keysField[0]) && strpbrk($keysField, '.[]') === false) {
                return "' + ({$keysRef}.{$keysField} ?? '') + '";
            }
        }

        // 🎯 FOREIGN KEYS VARIABLES — context-aware between regular and unique
        //   • foreignkeys loop      → foreignkeys[_fkI]
        //   • foreignkeysunique loop → foreignkeysunique[_fkuI]
        // Templates can use {:foreign.X:} in either loop type. The compile-time
        // currentLoopContext flips the path so the right array index is used.
        // Same NESTED-IN-TABLES override rationale as keys.X above.
        $fkArrayRef = ($this->currentLoopContext === 'foreignkeysunique')
            ? (($tableIndex !== null && !$nestedInTables)
                ? "gtree[0].project[0].tables[{$tableIndex}].foreignkeysunique[_fkuI]"
                : "gtree[0].project[0].tables[tableIdx].foreignkeysunique[_fkuI]")
            : (($tableIndex !== null && !$nestedInTables)
                ? "gtree[0].project[0].tables[{$tableIndex}].foreignkeys[_fkI]"
                : "gtree[0].project[0].tables[tableIdx].foreignkeys[_fkI]");

        $foreignKeysMappings = [
            'foreign.name' => "{$fkArrayRef}.name",
            'foreign.id' => "{$fkArrayRef}.id",
            'foreign.type' => "{$fkArrayRef}.type",
            'foreign.typecast' => "{$fkArrayRef}.typecast",
            'foreign.constraintname' => "{$fkArrayRef}.constraintname",
            'foreign.referencedtable' => "{$fkArrayRef}.referencedtable",
            'foreign.referencedtablepascalcase' => "{$fkArrayRef}.referencedtablepascalcase",
            'foreign.referencedtablecamelcase' => "{$fkArrayRef}.referencedtablecamelcase",
            'foreign.referencedcolumn' => "{$fkArrayRef}.referencedcolumn",
            'foreign.ondelete' => "{$fkArrayRef}.ondelete",
            'foreign.onupdate' => "{$fkArrayRef}.onupdate",
        ];

        if (isset($foreignKeysMappings[$variable])) {
            return "' + " . $foreignKeysMappings[$variable] . " + '";
        }

        // Generic fallback for foreign.* — covers fields the whitelist may miss.
        if (strpos($variable, 'foreign.') === 0) {
            $fkField = substr($variable, 8);
            if ($fkField !== '' && ctype_alpha($fkField[0]) && strpbrk($fkField, '.[]') === false) {
                return "' + ({$fkArrayRef}.{$fkField} ?? '') + '";
            }
        }

        // 🎯 FOREIGN KEYS UNIQUE VARIABLES (for {:for nmaxforeignkeysunique:} loops)
        // Same NESTED-IN-TABLES override as keys.X / foreign.X above.
        $fkuRef = ($tableIndex !== null && !$nestedInTables)
            ? "gtree[0].project[0].tables[{$tableIndex}].foreignkeysunique[_fkuI]"
            : "gtree[0].project[0].tables[tableIdx].foreignkeysunique[_fkuI]";
        $foreignKeysUniqueMappings = [
            'foreignunique.name' => "{$fkuRef}.name",
            'foreignunique.id' => "{$fkuRef}.id",
            'foreignunique.type' => "{$fkuRef}.type",
            'foreignunique.typecast' => "{$fkuRef}.typecast",
            'foreignunique.constraintname' => "{$fkuRef}.constraintname",
            'foreignunique.referencedtable' => "{$fkuRef}.referencedtable",
            'foreignunique.referencedtablepascalcase' => "{$fkuRef}.referencedtablepascalcase",
            'foreignunique.referencedtablecamelcase' => "{$fkuRef}.referencedtablecamelcase",
            'foreignunique.referencedcolumn' => "{$fkuRef}.referencedcolumn",
            'foreignunique.ondelete' => "{$fkuRef}.ondelete",
            'foreignunique.onupdate' => "{$fkuRef}.onupdate",
        ];

        if (isset($foreignKeysUniqueMappings[$variable])) {
            return "' + " . $foreignKeysUniqueMappings[$variable] . " + '";
        }

        // 🎯 LANGUAGE VARIABLES (for {:for nmaxlanguages:} loops)
        //
        // Generic resolver: any `language.<field>` maps to `gtree[0].project[0].lang[i].<field>`
        // where `i` is the loop counter pushed by {:for nmaxlanguages:}. This used to be a
        // hand-maintained whitelist of 7 keys (id/code/name/nativename/flag/index/caption)
        // which silently broke on every additional gtree language field — most recently
        // native_name, filedescription, decimalsep, thousandsep, dateformat, timeformat,
        // currencysym, timezone. A naïve `{:language.native_name:}` then compiled to
        // `gtree[0].project[0].language.native_name` (no `lang[i]`) and threw "Cannot
        // read properties of undefined" at runtime.
        //
        // `nativename` was a legacy alias that intentionally rewrote to `native_name`;
        // we keep it as the single hardcoded exception.
        if ($variable === 'language.nativename') {
            return "' + (gtree[0].project[0].lang[i].native_name ?? '') + '";
        }
        if (strpos($variable, 'language.') === 0) {
            $langField = substr($variable, 9); // strip "language."
            // Reject anything with dots or brackets — those would let templates reach
            // outside the current lang[i] entry. language.<single-word> only.
            if ($langField !== '' && ctype_alpha($langField[0]) && strpbrk($langField, '.[]') === false) {
                return "' + (gtree[0].project[0].lang[i].{$langField} ?? '') + '";
            }
        }

        // 🎯 TABLE VARIABLES (for {:for nmaxtables:} loops)
        // These variables are only available inside {:for nmaxtables:} loops
        $tableMappings = [
            'table.tablename' => "gtree[0].project[0].tables[tableIdx].filename", // tablename = filename in gtree structure
            'table.filename' => "gtree[0].project[0].tables[tableIdx].filename",
            'table.filecamelcase' => "gtree[0].project[0].tables[tableIdx].filecamelcase",
            'table.filepascalcase' => "gtree[0].project[0].tables[tableIdx].filepascalcase",
            'table.filesingular' => "gtree[0].project[0].tables[tableIdx].filesingular",
            'table.filesingularpascalcase' => "gtree[0].project[0].tables[tableIdx].filesingularpascalcase",
            'table.filesingularcamelcase' => "gtree[0].project[0].tables[tableIdx].filesingularcamelcase",
            'table.filenameshort' => "gtree[0].project[0].tables[tableIdx].filenameshort",
            'table.filenamerenamed' => "gtree[0].project[0].tables[tableIdx].filenamerenamed",
            'table.fileid' => "gtree[0].project[0].tables[tableIdx].fileid",
            'table.caption' => "gtree[0].project[0].tables[tableIdx].lang[gtree[0].project[0].selectedlanguageindex].caption",
            // Alias: templates that mirror item.*/file.* naming use `filecaption` —
            // resolve to the same localized caption (lang-array) rather than the
            // non-existent top-level `tables[tableIdx].filecaption`. The generic
            // table.* fallback would otherwise return '' for this common name.
            'table.filecaption' => "gtree[0].project[0].tables[tableIdx].lang[gtree[0].project[0].selectedlanguageindex].caption",
            'table.primarykey' => "gtree[0].project[0].tables[tableIdx].primarykeyfield",
            'table.primarykeyfield' => "gtree[0].project[0].tables[tableIdx].primarykeyfield",
            // Alias: gtree exposes the primary-key column name as `fileprimarykey`.
            // Templates intuitively reach for `filekeyname` — same field, gentler name.
            'table.fileprimarykey' => "gtree[0].project[0].tables[tableIdx].fileprimarykey",
            'table.filekeyname' => "gtree[0].project[0].tables[tableIdx].fileprimarykey",
            'table.hasforeignkeys' => "gtree[0].project[0].tables[tableIdx].hasforeignkeys",
            'table.nmaxitems' => "gtree[0].project[0].tables[tableIdx].nmaxitems",
            'table.nmaxitemsnokey' => "gtree[0].project[0].tables[tableIdx].nmaxitemsnokey",
            'table.nmaxitemsnokeyall' => "gtree[0].project[0].tables[tableIdx].nmaxitemsnokeyall",
            'table.nmaxitemsnoblob' => "gtree[0].project[0].tables[tableIdx].nmaxitemsnoblob",
            'table.nmaxitemsnobloball' => "gtree[0].project[0].tables[tableIdx].nmaxitemsnobloball",
            'table.nmaxitemsnobinaryblob' => "gtree[0].project[0].tables[tableIdx].nmaxitemsnobinaryblob",
            'table.nmaxitemsnobinarybloball' => "gtree[0].project[0].tables[tableIdx].nmaxitemsnobinarybloball",
            'table.nmaxkeys' => "gtree[0].project[0].tables[tableIdx].nmaxkeys",
            'table.nmaxforeignkeys' => "gtree[0].project[0].tables[tableIdx].nmaxforeignkeys",
            'table.nmaxforeignkeysunique' => "gtree[0].project[0].tables[tableIdx].nmaxforeignkeysunique",
            'table.nmaxsearchkeys' => "gtree[0].project[0].tables[tableIdx].nmaxsearchkeys",
            'table.index' => "tableIdx",
        ];

        if (isset($tableMappings[$variable])) {
            return "' + " . $tableMappings[$variable] . " + '";
        }

        // Generic fallback for table.* — covers fields not in the explicit map
        // (hastimestamps, hasblob, hasbinaryblob, hasprimarykey, filecaption, ...).
        // Same rationale as language.* above: the whitelist drifted out of sync
        // with the gtree shape and silently dropped legitimate fields.
        if (strpos($variable, 'table.') === 0) {
            $tableField = substr($variable, 6);
            if ($tableField !== '' && ctype_alpha($tableField[0]) && strpbrk($tableField, '.[]') === false) {
                return "' + (gtree[0].project[0].tables[tableIdx].{$tableField} ?? '') + '";
            }
        }

        // 🎯 MIGRATION TABLE VARIABLES (for {for {nmaxmigration_tables}} loops)
        $migrationTableMappings = [
            'migration.action' => "gtree[0].project[0].migration.tables[migIdx].action",
            'migration.name' => "gtree[0].project[0].migration.tables[migIdx].name",
            'migration.sql' => "gtree[0].project[0].migration.tables[migIdx].sql",
            'migration.type' => "gtree[0].project[0].migration.tables[migIdx].type",
            'migration.priority' => "gtree[0].project[0].migration.tables[migIdx].priority",
        ];

        if (isset($migrationTableMappings[$variable]) && $this->getCurrentLoopContext() === 'migration_tables') {
            return "' + " . $migrationTableMappings[$variable] . " + '";
        }

        // 🎯 MIGRATION FIELD VARIABLES (for {for {nmaxmigration_fields}} loops)
        $migrationFieldMappings = [
            'migration.action' => "gtree[0].project[0].migration.fields[migIdx].action",
            'migration.table' => "gtree[0].project[0].migration.fields[migIdx].table",
            'migration.name' => "gtree[0].project[0].migration.fields[migIdx].name",
            'migration.sql' => "gtree[0].project[0].migration.fields[migIdx].sql",
            'migration.type' => "gtree[0].project[0].migration.fields[migIdx].type",
            'migration.priority' => "gtree[0].project[0].migration.fields[migIdx].priority",
        ];

        if (isset($migrationFieldMappings[$variable]) && $this->getCurrentLoopContext() === 'migration_fields') {
            return "' + " . $migrationFieldMappings[$variable] . " + '";
        }

        // 🎯 MIGRATION INDEX VARIABLES (for {for {nmaxmigration_indexes}} loops)
        $migrationIndexMappings = [
            'migration.action' => "gtree[0].project[0].migration.indexes[migIdx].action",
            'migration.table' => "gtree[0].project[0].migration.indexes[migIdx].table",
            'migration.name' => "gtree[0].project[0].migration.indexes[migIdx].name",
            'migration.sql' => "gtree[0].project[0].migration.indexes[migIdx].sql",
            'migration.type' => "gtree[0].project[0].migration.indexes[migIdx].type",
            'migration.priority' => "gtree[0].project[0].migration.indexes[migIdx].priority",
        ];

        if (isset($migrationIndexMappings[$variable]) && $this->getCurrentLoopContext() === 'migration_indexes') {
            return "' + " . $migrationIndexMappings[$variable] . " + '";
        }

        // 🎯 MIGRATION FOREIGN KEY VARIABLES (for {for {nmaxmigration_foreignkeys}} loops)
        $migrationForeignKeyMappings = [
            'migration.action' => "gtree[0].project[0].migration.foreignKeys[migIdx].action",
            'migration.table' => "gtree[0].project[0].migration.foreignKeys[migIdx].table",
            'migration.name' => "gtree[0].project[0].migration.foreignKeys[migIdx].name",
            'migration.sql' => "gtree[0].project[0].migration.foreignKeys[migIdx].sql",
            'migration.type' => "gtree[0].project[0].migration.foreignKeys[migIdx].type",
            'migration.priority' => "gtree[0].project[0].migration.foreignKeys[migIdx].priority",
        ];

        if (isset($migrationForeignKeyMappings[$variable]) && $this->getCurrentLoopContext() === 'migration_foreignkeys') {
            return "' + " . $migrationForeignKeyMappings[$variable] . " + '";
        }

        // 🎯 MIGRATION STATIC VARIABLES (available everywhere)
        $migrationStaticMappings = [
            'migration.enabled' => "gtree[0].project[0].migration.enabled",
            'migration.from_version' => "gtree[0].project[0].migration.from_version",
            'migration.to_version' => "gtree[0].project[0].migration.to_version",
            'migration.dialect' => "gtree[0].project[0].migration.dialect",
            'migration.sql_complete' => "gtree[0].project[0].migration.sql_complete",
            // Bare migration counters (used outside of {:for nmaxmigration_X:} loops).
            // The loop-counter usage is handled separately in processLoopStart.
            'nmaxmigration_tables' => "(gtree[0].project[0].nmaxmigration_tables || 0)",
            'nmaxmigration_fields' => "(gtree[0].project[0].nmaxmigration_fields || 0)",
            'nmaxmigration_indexes' => "(gtree[0].project[0].nmaxmigration_indexes || 0)",
            'nmaxmigration_foreignkeys' => "(gtree[0].project[0].nmaxmigration_foreignkeys || 0)",
            'nmaxmigration_total' => "(gtree[0].project[0].nmaxmigration_total || 0)",
        ];

        if (isset($migrationStaticMappings[$variable])) {
            return "' + " . $migrationStaticMappings[$variable] . " + '";
        }

        // 🎯 FALLBACK - Try direct project access
        return "' + (gtree[0].project[0].{$variable} || '{$variable}') + '";
    }

    /**
     * 🛠️ BUILT-IN FUNCTIONS
     */
    private function initializeBuiltInFunctions(): void
    {
        // All functions use String(str ?? "") to safely handle null/undefined values
        $this->functions = [
            'upper' => 'function(str) { return String(str ?? "").toUpperCase(); }',
            'lower' => 'function(str) { return String(str ?? "").toLowerCase(); }',
            'capitalize' => 'function(str) { str = String(str ?? ""); return str.length > 0 ? str.charAt(0).toUpperCase() + str.slice(1) : ""; }',
            'plural' => 'function(str) { return String(str ?? "") + "s"; }',
            'singular' => 'function(str) { str = String(str ?? ""); return str.endsWith("s") ? str.slice(0, -1) : str; }',
            'camelcase' => 'function(str) { return String(str ?? "").replace(/_([a-z])/g, function(g) { return g[1].toUpperCase(); }); }',
            'snakecase' => 'function(str) { return String(str ?? "").replace(/([A-Z])/g, "_$1").toLowerCase(); }',
            'length' => 'function(str) { return String(str ?? "").length; }',
            'substr' => 'function(str, start, len) { return String(str ?? "").substr(start, len); }',
            'replace' => 'function(str, search, replace) { return String(str ?? "").replace(new RegExp(search, "g"), replace); }',
            'pascalcase' => 'function(str) { return String(str ?? "").split(/[_\\s-]+/).map(function(w) { return w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""; }).join(""); }',
            'kebabcase' => 'function(str) { return String(str ?? "").replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[_\\s]+/g, "-").toLowerCase(); }',
            'strlen' => 'function(str) { return String(str ?? "").length; }',
        ];
    }

    /**
     * 🔍 Detect which built-in functions are used in template
     */
    private function detectUsedFunctions(string $templateContent): array
    {
        $usedFunctions = [];
        foreach (array_keys($this->functions) as $funcName) {
            // Match {:funcname( or {:funcname (with space
            if (preg_match('/\{:' . preg_quote($funcName, '/') . '\s*\(/i', $templateContent)) {
                $usedFunctions[] = $funcName;
            }
        }
        return $usedFunctions;
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

        // Replace {:variable:} placeholders inside code blocks with JS expressions
        // Inside code blocks, variables must be raw JS values (not wrapped in string concatenation)
        $codeContent = $this->replaceVariablesInCodeBlock($codeContent);

        $trimmedCode = trim($codeContent);

        // Detect if code uses sContentResult += directly (closure pattern)
        $usesDirectAppend = (strpos($trimmedCode, 'sContentResult') !== false);

        // Auto-inject 'var res = "";' and 'return res;' if the user uses 'res' as a standalone variable
        // Use word-boundary check to avoid false positives from words like 'reset', 'resizable', 'response', etc.
        $usesRes = (bool)preg_match('/\bres\b/', $trimmedCode);
        $hasResDeclaration = (bool)preg_match('/\b(var|let|const)\s+res\b/', $trimmedCode);
        $hasReturn = (strpos($trimmedCode, 'return') !== false);

        // If code uses sContentResult += directly (closure to outer scope),
        // don't auto-inject res handling — the closure handles output
        if ($usesDirectAppend) {
            $usesRes = false;
        }

        // Define user_code_N function inline
        $jsCode .= "  function user_code_{$funcIndex}() {\n";

        // Auto-declare res if user uses it but didn't declare it
        if ($usesRes && !$hasResDeclaration) {
            $jsCode .= "    var res = '';\n";
        }

        // Indent user's code
        $codeLines = explode("\n", $trimmedCode);
        foreach ($codeLines as $codeLine) {
            $jsCode .= "    " . $codeLine . "\n";
        }

        // Auto-return:
        // - sContentResult direct append: ALWAYS add return sContentResult (inner returns
        //   inside helper functions like toSingular() don't count as the main return)
        // - res pattern: only add return res if no return exists
        if ($usesDirectAppend) {
            $jsCode .= "    return sContentResult;\n";
        } elseif ($usesRes && !$hasReturn) {
            $jsCode .= "    return res;\n";
        }

        $jsCode .= "  }\n";

        // Call the function:
        // - If code uses sContentResult directly, the function returns the accumulated content
        //   and we ASSIGN (not append) to avoid double content
        // - Otherwise, append the return value as before
        if ($usesDirectAppend) {
            $jsCode .= "  sContentResult = (user_code_{$funcIndex}() || '');\n";
        } else {
            $jsCode .= "  sContentResult += (user_code_{$funcIndex}() || '');\n";
        }

        return $jsCode;
    }

    /**
     * Replace {:variable:} placeholders inside {:code:} blocks with JavaScript expressions.
     * Unlike content lines, code blocks need raw JS expressions (no string concatenation wrapping).
     */
    private function replaceVariablesInCodeBlock(string $codeContent): string
    {
        // Find all {:variableName:} patterns and replace with JS expressions
        return preg_replace_callback('/\{:([a-zA-Z_][a-zA-Z0-9_.]*?):\}/', function($matches) {
            $variableName = $matches[1];
            // Get the JS expression for this variable (without ' + ... + ' wrapping)
            return $this->getVariableAsJsExpression($variableName, null);
        }, $codeContent);
    }

    /**
     * 🆕 EXTRACT {:code:}...{:codeend:} BLOCKS
     * Extract JavaScript code blocks from template and replace with placeholder
     */
    private function extractCodeBlocks(string $templateContent): string
    {
        // Reset code blocks counter
        $this->codeBlocks = [];
        $this->codeBlockCounter = 0;

        // Find all {:code:}...{:codeend:} blocks
        $pattern = '/\{:code:\}(.*?)\{:codeend:\}/s';

        $templateContent = preg_replace_callback($pattern, function($matches) {
            // Store the code block content (without {:code:} and {:codeend:})
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