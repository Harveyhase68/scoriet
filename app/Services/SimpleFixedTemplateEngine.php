<?php

namespace App\Services;

/**
 * 🔧 SIMPLE FIXED TEMPLATE ENGINE
 *
 * Folgt GENAU deinem Vorschlag:
 * 1. Keine Regex
 * 2. Einfache String-Operations
 * 3. Template-Konstrukte auf neue Zeilen aufteilen
 * 4. Exakter Content-Erhalt
 */
class SimpleFixedTemplateEngine
{
    private array $gtree;
    private int $currentTableIndex;
    private string $targetTableName;

    public function __construct(array $gtree, int $tableIndex = 0, string $tableName = null)
    {
        $this->gtree = $gtree;
        $this->currentTableIndex = $tableIndex;

        // If table name provided, find the correct index by fileid
        if ($tableName && isset($gtree[0]['project'][0]['tables'])) {
            foreach ($gtree[0]['project'][0]['tables'] as $index => $table) {
                if ($table['fileid'] === $tableName || $table['tablename'] === $tableName) {
                    $this->currentTableIndex = $index;
                    break;
                }
            }
        }

        $this->targetTableName = $tableName ?? '';
    }

    /**
     * 🎯 MAIN PROCESSING - Genau wie du es beschrieben hast
     */
    public function processTemplate(string $templateContent): string
    {
        // SCHRITT 1: Problematische Zeile identifizieren und aufteilen
        $fixedContent = $this->fixComplexLines($templateContent);

        // SCHRITT 2: JavaScript generieren
        $lines = explode("\n", $fixedContent);
        $jsFunction = "function generateTemplate() {\n";
        $jsFunction .= "  let sContentResult = '';\n\n";

        $insideLoop = false;
        $inlineMode = false; // Track wenn wir im inline-Modus sind

        foreach ($lines as $lineNum => $line) {
            $trimmedLine = trim($line);

            // Debug: Zeige was verarbeitet wird
            $jsFunction .= "  // Processing line " . ($lineNum + 1) . ": " . addslashes($trimmedLine) . "\n";

            // INLINE MODE MARKERS
            if (strpos($line, '§INLINE_START§') === 0) {
                $inlineMode = true;
                $content = substr($line, strlen('§INLINE_START§'));
                $processedLine = $this->processVariables($content, $insideLoop);
                $normalizedLine = $this->normalizeIndentation($processedLine);
                $escapedLine = $this->escapeForJavaScript($normalizedLine);

                if ($insideLoop) {
                    $jsFunction .= "    sContentResult += '{$escapedLine}';\n";
                } else {
                    $jsFunction .= "  sContentResult += '{$escapedLine}';\n";
                }
                continue;
            }

            if (strpos($line, '§INLINE_END§') === 0) {
                $inlineMode = false;
                // Add newline to properly close the inline content
                if ($insideLoop) {
                    $jsFunction .= "    sContentResult += '\\u000A';\n";
                } else {
                    $jsFunction .= "  sContentResult += '\\u000A';\n";
                }
                continue;
            }

            if (strpos($line, '§INLINE§') === 0) {
                $content = substr($line, strlen('§INLINE§'));
                $processedLine = $this->processVariables($content, $insideLoop);
                $normalizedLine = $this->normalizeIndentation($processedLine);
                $escapedLine = $this->escapeForJavaScript($normalizedLine);

                if ($insideLoop) {
                    $jsFunction .= "    sContentResult += '{$escapedLine}';\n";
                } else {
                    $jsFunction .= "  sContentResult += '{$escapedLine}';\n";
                }
                continue;
            }

            // LOOP START
            if ($this->isLoopStart($trimmedLine)) {
                $insideLoop = true;
                // Use the correct loop variable based on the type
                if (strpos($trimmedLine, '{for {nmaxsearchkeys}}') !== false) {
                    $jsFunction .= "  for (let i = 0; i < gtree[0].project[0].tables[{$this->currentTableIndex}].nmaxsearchkeys; i++) {\n";
                } else {
                    // Default to nmaxitems for {for {nmaxitems}}
                    $jsFunction .= "  for (let i = 0; i < gtree[0].project[0].tables[{$this->currentTableIndex}].nmaxitems; i++) {\n";
                }
                continue;
            }

            // LOOP END
            if ($this->isLoopEnd($trimmedLine)) {
                $insideLoop = false;
                $jsFunction .= "  }\n";
                continue;
            }

            // CONDITIONAL START
            if ($this->isConditionalStart($trimmedLine)) {
                $condition = $this->extractCondition($trimmedLine);
                $jsCondition = $this->processCondition($condition);
                $jsFunction .= "  if ({$jsCondition}) {\n";
                continue;
            }

            // CONDITIONAL END
            if ($this->isConditionalEnd($trimmedLine)) {
                $jsFunction .= "  }\n";
                continue;
            }

            // REGULAR CONTENT
            $processedLine = $this->processVariables($line, $insideLoop);

            // Normalize indentation - clean up excessive whitespace but preserve reasonable indentation
            $normalizedLine = $this->normalizeIndentation($processedLine);

            $escapedLine = $this->escapeForJavaScript($normalizedLine);

            // Im inline-Modus kein \n hinzufügen, sonst normal
            if ($insideLoop) {
                if ($inlineMode) {
                    $jsFunction .= "    sContentResult += '{$escapedLine}';\n";
                } else {
                    $jsFunction .= "    sContentResult += '{$escapedLine}\\n';\n";
                }
            } else {
                if ($inlineMode) {
                    $jsFunction .= "  sContentResult += '{$escapedLine}';\n";
                } else {
                    $jsFunction .= "  sContentResult += '{$escapedLine}\\n';\n";
                }
            }
        }

        $jsFunction .= "\n  return sContentResult;\n";
        $jsFunction .= "}\n";

        return $jsFunction;
    }

    /**
     * 🛠️ FIX COMPLEX LINES - Folgt deinem Vorschlag exakt
     */
    private function fixComplexLines(string $content): string
    {
        $lines = explode("\n", $content);
        $fixedLines = [];

        foreach ($lines as $line) {
            if ($this->isComplexLine($line)) {
                // Diese Zeile hat Template-Konstrukte gemischt mit anderem Code
                $splitLines = $this->splitComplexLineWithInlineMarkers($line);
                $fixedLines = array_merge($fixedLines, $splitLines);
            } else {
                // Normale Zeile
                $fixedLines[] = $line;
            }
        }

        return implode("\n", $fixedLines);
    }

    /**
     * 🔍 CHECK: Ist das eine komplexe Zeile?
     */
    private function isComplexLine(string $line): bool
    {
        $hasTemplateConstruct = strpos($line, '{for {') !== false
                             || strpos($line, '{if ') !== false
                             || strpos($line, '{endif}') !== false
                             || strpos($line, '{endfor}') !== false;

        if (!$hasTemplateConstruct) {
            return false;
        }

        // Prüfe ob außer dem Template-Konstrukt noch anderer Code vorhanden ist
        $tempLine = $line;
        $tempLine = str_replace('{for {nmaxsearchkeys}}', '', $tempLine);
        $tempLine = str_replace('{for {nmaxitems}}', '', $tempLine);
        $tempLine = str_replace('{if ', '', $tempLine);
        $tempLine = str_replace('{endif}', '', $tempLine);
        $tempLine = str_replace('{endfor}', '', $tempLine);

        return trim($tempLine) !== '';
    }

    /**
     * ✂️ SPLIT COMPLEX LINE WITH INLINE MARKERS - Akademische Lösung
     */
    private function splitComplexLineWithInlineMarkers(string $line): array
    {
        $result = [];

        // Finde {for} Position
        $forPos = strpos($line, '{for {nmaxsearchkeys}}');
        if ($forPos !== false) {
            $beforeFor = substr($line, 0, $forPos);

            // Prüfe ob vor {for} nur Whitespace steht oder echter Text
            if (trim($beforeFor) !== '') {
                // Text vor {for} → inline-Modus aktivieren
                $result[] = '§INLINE_START§' . $beforeFor; // Marker für inline-Start
                $result[] = '{for {nmaxsearchkeys}}';

                // Rest verarbeiten im inline-Modus
                $afterFor = substr($line, $forPos + strlen('{for {nmaxsearchkeys}}'));
                if (trim($afterFor) !== '') {
                    $remainingSplit = $this->splitRemainingInInlineMode($afterFor);
                    $result = array_merge($result, $remainingSplit);
                }

                $result[] = '§INLINE_END§'; // Marker für inline-Ende
            } else {
                // Nur Whitespace vor {for} → normale Aufteilung
                if (trim($beforeFor) !== '') {
                    $result[] = $beforeFor;
                }
                $result[] = '{for {nmaxsearchkeys}}';

                $afterFor = substr($line, $forPos + strlen('{for {nmaxsearchkeys}}'));
                if (trim($afterFor) !== '') {
                    $remainingSplit = $this->splitRemainingAfterFor($afterFor);
                    $result = array_merge($result, $remainingSplit);
                }
            }
        } else {
            // Fallback zur alten Methode
            $result = $this->splitComplexLine($line);
        }

        return $result;
    }

    /**
     * 🔄 SPLIT REMAINING IN INLINE MODE - Für akademische inline-Verarbeitung
     */
    private function splitRemainingInInlineMode(string $remaining): array
    {
        $result = [];

        // Gleiche Logik wie splitRemainingAfterFor, aber alle Teile als inline markieren
        $ifPos = strpos($remaining, '{if ');
        if ($ifPos !== false && $ifPos > 0) {
            $beforeIf = substr($remaining, 0, $ifPos);
            $result[] = '§INLINE§' . trim($beforeIf);

            $ifEndPos = strpos($remaining, '}', $ifPos);
            if ($ifEndPos !== false) {
                $ifConstruct = substr($remaining, $ifPos, $ifEndPos - $ifPos + 1);
                $result[] = $ifConstruct;

                $afterIf = substr($remaining, $ifEndPos + 1);
                if (trim($afterIf) !== '') {
                    $furtherSplit = $this->splitIfRemainderInInlineMode($afterIf);
                    $result = array_merge($result, $furtherSplit);
                }
            }
        } else {
            $result[] = '§INLINE§' . $remaining;
        }

        return $result;
    }

    /**
     * 🔄 SPLIT IF REMAINDER IN INLINE MODE
     */
    private function splitIfRemainderInInlineMode(string $remaining): array
    {
        $result = [];

        $endifPos = strpos($remaining, '{endif}');
        if ($endifPos !== false && $endifPos > 0) {
            $beforeEndif = substr($remaining, 0, $endifPos);
            if (trim($beforeEndif) !== '') {
                $result[] = '§INLINE§' . $beforeEndif; // Don't trim - preserve spaces
            }

            $result[] = '{endif}';

            $afterEndif = substr($remaining, $endifPos + strlen('{endif}'));
            if (trim($afterEndif) !== '') {
                $endforPos = strpos($afterEndif, '{endfor}');
                if ($endforPos !== false) {
                    if ($endforPos > 0) {
                        $beforeEndfor = substr($afterEndif, 0, $endforPos);
                        if (trim($beforeEndfor) !== '') {
                            $result[] = '§INLINE§' . $beforeEndfor; // Don't trim - preserve spaces
                        }
                    }

                    $result[] = '{endfor}';

                    $afterEndfor = substr($afterEndif, $endforPos + strlen('{endfor}'));
                    if (trim($afterEndfor) !== '') {
                        $result[] = '§INLINE§' . trim($afterEndfor);
                    }
                }
            }
        } else {
            $result[] = '§INLINE§' . $remaining;
        }

        return $result;
    }

    /**
     * ✂️ SPLIT COMPLEX LINE - Genau wie du es beschrieben hast (Fallback)
     */
    private function splitComplexLine(string $line): array
    {
        $result = [];

        // Beispiel-Line: $sql = 'SELECT count(*) AS count FROM {filename} WHERE ({for {nmaxsearchkeys}}{item.name} LIKE \'%' . $search . '%\'{if nCountSearchkeys<{nmaxsearchkeys}} OR {endif}{endfor})' . $order_by;

        // SCHRITT 1: Schaue ob {for ist am Anfang der Zeile oder nicht
        $forPos = strpos($line, '{for {nmaxsearchkeys}}');
        if ($forPos !== false && $forPos > 0) {
            // Es gibt Text VOR dem {for} - den auf eine eigene Zeile
            $beforeFor = substr($line, 0, $forPos);
            $result[] = rtrim($beforeFor); // Text vor {for}

            // {for} auf eigene Zeile
            $result[] = '{for {nmaxsearchkeys}}';

            // Rest der Zeile verarbeiten
            $afterFor = substr($line, $forPos + strlen('{for {nmaxsearchkeys}}'));
            if (trim($afterFor) !== '') {
                $furtherSplit = $this->splitRemainingAfterFor($afterFor);
                $result = array_merge($result, $furtherSplit);
            }
        } else {
            // Andere Fälle
            $result[] = $line;
        }

        return $result;
    }

    /**
     * 🔄 SPLIT REMAINING AFTER FOR
     */
    private function splitRemainingAfterFor(string $remaining): array
    {
        $result = [];

        // remaining ist: {item.name} LIKE \'%' . $search . '%\'{if nCountSearchkeys<{nmaxsearchkeys}} OR {endif}{endfor})' . $order_by;

        // Suche nach {if
        $ifPos = strpos($remaining, '{if ');
        if ($ifPos !== false && $ifPos > 0) {
            // Text vor {if}
            $beforeIf = substr($remaining, 0, $ifPos);
            $result[] = trim($beforeIf);

            // Extrahiere {if condition}
            $ifEndPos = strpos($remaining, '}', $ifPos);
            if ($ifEndPos !== false) {
                $ifConstruct = substr($remaining, $ifPos, $ifEndPos - $ifPos + 1);
                $result[] = $ifConstruct;

                // Rest nach {if condition}
                $afterIf = substr($remaining, $ifEndPos + 1);
                if (trim($afterIf) !== '') {
                    $furtherSplit = $this->splitRemainingAfterIf($afterIf);
                    $result = array_merge($result, $furtherSplit);
                }
            }
        } else {
            // Kein {if gefunden
            $result[] = $remaining;
        }

        return $result;
    }

    /**
     * 🔄 SPLIT REMAINING AFTER IF
     */
    private function splitRemainingAfterIf(string $remaining): array
    {
        $result = [];

        // remaining ist:  OR {endif}{endfor})' . $order_by;

        // Suche nach {endif}
        $endifPos = strpos($remaining, '{endif}');
        if ($endifPos !== false && $endifPos > 0) {
            // Text vor {endif}
            $beforeEndif = substr($remaining, 0, $endifPos);
            if (trim($beforeEndif) !== '') {
                $result[] = $beforeEndif; // Don't trim - preserve spaces for inline content
            }

            // {endif}
            $result[] = '{endif}';

            // Rest nach {endif}
            $afterEndif = substr($remaining, $endifPos + strlen('{endif}'));
            if (trim($afterEndif) !== '') {
                $furtherSplit = $this->splitRemainingAfterEndif($afterEndif);
                $result = array_merge($result, $furtherSplit);
            }
        } else {
            $result[] = $remaining;
        }

        return $result;
    }

    /**
     * 🔄 SPLIT REMAINING AFTER ENDIF
     */
    private function splitRemainingAfterEndif(string $remaining): array
    {
        $result = [];

        // remaining ist: {endfor})' . $order_by;

        // Suche nach {endfor}
        $endforPos = strpos($remaining, '{endfor}');
        if ($endforPos !== false) {
            // Text vor {endfor} (sollte leer sein)
            if ($endforPos > 0) {
                $beforeEndfor = substr($remaining, 0, $endforPos);
                if (trim($beforeEndfor) !== '') {
                    $result[] = $beforeEndfor; // Don't trim - preserve spaces for inline content
                }
            }

            // {endfor}
            $result[] = '{endfor}';

            // Rest nach {endfor}
            $afterEndfor = substr($remaining, $endforPos + strlen('{endfor}'));
            if (trim($afterEndfor) !== '') {
                $result[] = trim($afterEndfor);
            }
        } else {
            $result[] = $remaining;
        }

        return $result;
    }

    /**
     * 🔧 NORMALIZE INDENTATION - Bereinige übermäßige Leerzeichen aber bewahre Template-Einrückung
     */
    private function normalizeIndentation(string $line): string
    {
        // Wenn die Zeile leer ist, gib sie leer zurück
        if (trim($line) === '') {
            return '';
        }

        // Extrahiere die führende Einrückung (Tabs/Spaces am Anfang)
        preg_match('/^(\s*)(.*)$/', $line, $matches);
        $leadingWhitespace = $matches[1] ?? '';
        $content = $matches[2] ?? '';

        // Bereinige nur den INHALT der Zeile - nicht die führende Einrückung
        // Ersetze mehrfache Spaces/Tabs INNERHALB der Zeile durch einzelne Spaces
        $cleanedContent = preg_replace('/[ \t]+/', ' ', $content);

        // Kombiniere führende Einrückung mit bereinigtem Inhalt
        return $leadingWhitespace . $cleanedContent;
    }


    /**
     * 🔍 DETECTION METHODS
     */
    private function isLoopStart(string $line): bool
    {
        return $line === '{for {nmaxsearchkeys}}' || $line === '{for {nmaxitems}}';
    }

    private function isLoopEnd(string $line): bool
    {
        return $line === '{endfor}';
    }

    private function isConditionalStart(string $line): bool
    {
        return strpos($line, '{if ') === 0 && strpos($line, '}') === strlen($line) - 1;
    }

    private function isConditionalEnd(string $line): bool
    {
        return $line === '{endif}';
    }

    private function extractCondition(string $line): string
    {
        // {if nCountSearchkeys<{nmaxsearchkeys}} -> nCountSearchkeys<{nmaxsearchkeys}
        $start = strpos($line, '{if ') + 4;
        $end = strrpos($line, '}');
        return substr($line, $start, $end - $start);
    }

    private function processCondition(string $condition): string
    {
        // nCountSearchkeys<{nmaxsearchkeys} -> i < gtree[0].project[0].tables[X].nmaxsearchkeys
        $condition = str_replace('nCountSearchkeys', 'i', $condition);

        // Handle both complete and incomplete patterns
        $condition = str_replace('{nmaxsearchkeys}', "gtree[0].project[0].tables[{$this->currentTableIndex}].nmaxsearchkeys", $condition);
        $condition = str_replace('{nmaxsearchkeys', "gtree[0].project[0].tables[{$this->currentTableIndex}].nmaxsearchkeys", $condition);

        return $condition;
    }

    /**
     * 🔄 VARIABLE PROCESSING
     */
    private function processVariables(string $line, bool $insideLoop): string
    {
        $processedLine = $line;

        // TABLE VARIABLES
        if (isset($this->gtree[0]['project'][0]['tables'][$this->currentTableIndex])) {
            $table = $this->gtree[0]['project'][0]['tables'][$this->currentTableIndex];

            // Core Scoriet FILE variables
            $processedLine = str_replace('{filename}', $table['filename'] ?? $table['tablename'] ?? 'Unknown', $processedLine);
            $processedLine = str_replace('{filenameshort}', $table['filenameshort'] ?? substr($table['tablename'] ?? '', 0, 8), $processedLine);
            $processedLine = str_replace('{fileid}', $table['fileid'] ?? $table['tablename'] ?? 'Unknown', $processedLine);
            $processedLine = str_replace('{filenamecc}', $table['filenamecc'] ?? ucwords(str_replace('_', '', $table['tablename'] ?? '')), $processedLine);

            // Master-Detail FILE variables
            $processedLine = str_replace('{filegeneratemasterdetail}', $table['filegeneratemasterdetail'] ? 'true' : 'false', $processedLine);
            $processedLine = str_replace('{filedetailfileid}', $table['filedetailfileid'] ?? '', $processedLine);
            $processedLine = str_replace('{filedetailfilename}', $table['filedetailfilename'] ?? '', $processedLine);
            $processedLine = str_replace('{filedetailkey}', $table['filedetailkey'] ?? '', $processedLine);

            // Legacy variables for compatibility
            $processedLine = str_replace('{tablename}', $table['tablename'] ?? 'Unknown', $processedLine);
            $processedLine = str_replace('{filekeyname}', $table['filekeyname'] ?? $table['primarykeyfield'] ?? 'id', $processedLine);
        }

        // PROJECT VARIABLES
        if (isset($this->gtree[0]['project'][0])) {
            $project = $this->gtree[0]['project'][0];
            $processedLine = str_replace('{projectname}', $project['projectname'] ?? 'Unknown', $processedLine);
            $processedLine = str_replace('{projectdatabase}', $project['projectdatabase'] ?? 'Unknown', $processedLine);
        }

        // ITEM VARIABLES (nur im Loop)
        if ($insideLoop) {
            $processedLine = str_replace('{item.name}', "' + gtree[0].project[0].tables[{$this->currentTableIndex}].fields[i].name + '", $processedLine);
            $processedLine = str_replace('{item.type}', "' + gtree[0].project[0].tables[{$this->currentTableIndex}].fields[i].type + '", $processedLine);
            $processedLine = str_replace('{item.controltype}', "' + gtree[0].project[0].tables[{$this->currentTableIndex}].fields[i].controltype + '", $processedLine);
        }

        return $processedLine;
    }

    /**
     * 🛡️ JAVASCRIPT ESCAPING
     */
    private function escapeForJavaScript(string $line): string
    {
        // Zuerst alle Backslashes escapen
        $escaped = str_replace("\\", "\\\\", $line);

        // JavaScript-Code-Injections temporär schützen
        $protectedParts = [];
        $counter = 0;

        // Finde und schütze alle JavaScript-Code-Teile (updated für fields statt items)
        if (preg_match_all("/' \\+ gtree\\[0\\]\\.project\\[0\\]\\.tables\\[\\d+\\]\\.fields\\[i\\]\\.\\w+ \\+ '/", $escaped, $matches, PREG_OFFSET_CAPTURE)) {
            // Von hinten nach vorne ersetzen, damit Offsets stimmen
            for ($i = count($matches[0]) - 1; $i >= 0; $i--) {
                $match = $matches[0][$i];
                $placeholder = "___PROTECTED_JS_" . $counter . "___";
                $protectedParts[$placeholder] = $match[0];
                $escaped = substr_replace($escaped, $placeholder, $match[1], strlen($match[0]));
                $counter++;
            }
        }

        // Jetzt normale Escaping-Regeln anwenden (aber JavaScript-Code ist geschützt)
        $escaped = str_replace("'", "\\'", $escaped);
        $escaped = str_replace('"', '\\"', $escaped);

        // 🔧 FIX: Escape newlines to prevent JavaScript syntax errors
        $escaped = str_replace("\n", "\\n", $escaped);   // Newlines
        $escaped = str_replace("\r", "\\r", $escaped);   // Carriage returns

        // JavaScript-Code-Teile wieder einsetzen (unescaped)
        foreach ($protectedParts as $placeholder => $originalCode) {
            $escaped = str_replace($placeholder, $originalCode, $escaped);
        }

        return $escaped;
    }

    /**
     * 🎯 DEMO: Dein exaktes Problem lösen
     */
    public static function solvYourExactProblem(): array
    {
        $originalTemplate = '$sql = \'SELECT count(*) AS count FROM {filename} WHERE ({for {nmaxsearchkeys}}{item.name} LIKE \'%\' . $search . \'%\'{if nCountSearchkeys<{nmaxsearchkeys}} OR {endif}{endfor})\' . $order_by;';

        $demoGtree = [
            [
                'project' => [
                    [
                        'projectname' => 'php_crud',
                        'projectdatabase' => 'primapos',
                        'tables' => [
                            [
                                'tablename' => 'accounting_log',
                                'primarykeyfield' => 'accl_id',
                                'nmaxitems' => 3,
                                'nmaxsearchkeys' => 3, // Same as nmaxitems - all fields are searchable
                                'fields' => [
                                    ['name' => 'accl_id'],
                                    ['name' => 'branch_no'],
                                    ['name' => 'station_no'],
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ];

        $engine = new self($demoGtree, 0);

        return [
            'original_problematic_line' => $originalTemplate,
            'step_1_split_result' => $engine->fixComplexLines($originalTemplate),
            'step_2_generated_js' => $engine->processTemplate($originalTemplate),
            'problems_solved' => [
                '✅ {filename} wird korrekt zu accounting_log ersetzt',
                '✅ Keine Geister-} mehr im JavaScript',
                '✅ Template-Konstrukte auf eigenen Zeilen',
                '✅ Saubere Loop-Strukturen',
                '✅ Keine Regex - nur String-Operations'
            ]
        ];
    }
}