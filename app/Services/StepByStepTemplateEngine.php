<?php

namespace App\Services;

/**
 * 🔧 STEP-BY-STEP TEMPLATE ENGINE
 *
 * Löst Template-Konstrukte auf einzelne Zeilen auf
 * Jeder Template-Teil wird separat behandelt
 * Exakter Content-Erhalt mit korrekten Einrückungen
 */
class StepByStepTemplateEngine
{
    private array $gtree;
    private int $currentTableIndex;

    public function __construct(array $gtree, int $tableIndex = 0)
    {
        $this->gtree = $gtree;
        $this->currentTableIndex = $tableIndex;
    }

    /**
     * 🎯 MAIN PROCESSING - Schritt für Schritt Aufteilung
     */
    public function processTemplate(string $templateContent): string
    {
        // SCHRITT 1: Template-Konstrukte identifizieren und auf neue Zeilen aufteilen
        $preprocessedContent = $this->preprocessTemplateConstructs($templateContent);

        // SCHRITT 2: Zeile für Zeile verarbeiten
        $lines = explode("\n", $preprocessedContent);
        $jsFunction = "function generateTemplate() {\n";
        $jsFunction .= "  let sContentResult = '';\n\n";

        $insideLoop = false;

        foreach ($lines as $lineNumber => $line) {
            $trimmedLine = trim($line);

            // Debug-Info
            $jsFunction .= "  // Line {$lineNumber}: " . addslashes($trimmedLine) . "\n";

            // LOOP START
            if ($this->isLoopStart($trimmedLine)) {
                $insideLoop = true;
                $jsFunction .= "  for (let i = 0; i < gtree[0].project[0].tables[{$this->currentTableIndex}].nmaxitems; i++) {\n";
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

            // STRING-CLOSE MARKER - schließt vorherigen String
            if ($trimmedLine === '§CLOSE_STRING§') {
                $jsFunction .= "  sContentResult += ''; // String closed\n";
                continue;
            }

            // STRING-CONTINUE MARKER - öffnet neuen String
            if ($trimmedLine === '§CONTINUE_STRING§') {
                $jsFunction .= "  sContentResult += ''; // String continues\n";
                continue;
            }

            // REGULAR CONTENT LINE
            $processedLine = $this->processVariables($line, $insideLoop);
            $escapedLine = $this->escapeForJavaScript($processedLine);

            if ($insideLoop) {
                $jsFunction .= "    sContentResult += '{$escapedLine}';\n";
            } else {
                $jsFunction .= "  sContentResult += '{$escapedLine}';\n";
            }
        }

        $jsFunction .= "\n  return sContentResult;\n";
        $jsFunction .= "}\n";

        return $jsFunction;
    }

    /**
     * 🔄 PREPROCESS - Template-Konstrukte auf einzelne Zeilen aufteilen
     */
    private function preprocessTemplateConstructs(string $content): string
    {
        $lines = explode("\n", $content);
        $processedLines = [];

        foreach ($lines as $lineIndex => $line) {
            // Prüfe ob die Zeile Template-Konstrukte enthält
            if ($this->hasComplexTemplateConstructs($line)) {
                // SCHRITT 1: Zeile aufteilen
                $splitLines = $this->splitComplexLine($line);
                $processedLines = array_merge($processedLines, $splitLines);
            } else {
                // Normale Zeile - unverändert übernehmen
                $processedLines[] = $line;
            }
        }

        return implode("\n", $processedLines);
    }

    /**
     * 🔍 CHECK: Hat die Zeile komplexe Template-Konstrukte?
     */
    private function hasComplexTemplateConstructs(string $line): bool
    {
        $complexPatterns = [
            '{for {nmaxsearchkeys}}',
            '{for {nmaxitems}}',
            '{if ',
            '{endif}',
            '{endfor}'
        ];

        foreach ($complexPatterns as $pattern) {
            if (strpos($line, $pattern) !== false) {
                // Prüfe ob noch anderer Text in der Zeile ist
                $beforePattern = strstr($line, $pattern, true);
                $afterPattern = substr(strstr($line, $pattern), strlen($pattern));

                if (trim($beforePattern) !== '' || trim($afterPattern) !== '') {
                    return true; // Komplexe Zeile gefunden
                }
            }
        }

        return false;
    }

    /**
     * ✂️ SPLIT: Komplexe Zeile in mehrere Zeilen aufteilen
     */
    private function splitComplexLine(string $line): array
    {
        $result = [];
        $currentLine = $line;

        // Beispiel: $sql = 'SELECT count(*) AS count FROM {filename} WHERE ({for {nmaxsearchkeys}}{item.name} LIKE \'%' . $search . '%\'{if nCountSearchkeys<{nmaxsearchkeys}} OR {endif}{endfor})' . $order_by;

        // SCHRITT 1: Text vor {for} extrahieren
        if (preg_match('/^(.*?)\{for\s+\{([^}]+)\}\}(.*)$/', $currentLine, $matches)) {
            $beforeFor = $matches[1];
            $forVariable = $matches[2];
            $afterFor = $matches[3];

            // Text vor {for} als eigene Zeile
            if (trim($beforeFor) !== '') {
                $result[] = rtrim($beforeFor, ';') . ';'; // String schließen
                $result[] = '§CLOSE_STRING§'; // Marker für String-Ende
            }

            // {for} als eigene Zeile
            $result[] = '{for {' . $forVariable . '}}';

            // Rest der Zeile weiter verarbeiten
            if (trim($afterFor) !== '') {
                $furtherSplit = $this->splitRemainingLine($afterFor);
                $result = array_merge($result, $furtherSplit);
            }
        } else {
            // Andere komplexe Konstrukte
            $result[] = $currentLine;
        }

        return $result;
    }

    /**
     * 🔄 SPLIT: Verbleibende Zeile nach {for} weiter aufteilen
     */
    private function splitRemainingLine(string $line): array
    {
        $result = [];
        $currentLine = $line;

        // Extrahiere Content zwischen {for} und {if}
        if (preg_match('/^(.*?)\{if\s+([^}]+)\}(.*)$/', $currentLine, $matches)) {
            $beforeIf = $matches[1];
            $ifCondition = $matches[2];
            $afterIf = $matches[3];

            // Content vor {if}
            if (trim($beforeIf) !== '') {
                $result[] = '§CONTINUE_STRING§'; // String weiterführen
                $result[] = trim($beforeIf);
            }

            // {if} als eigene Zeile
            $result[] = '{if ' . $ifCondition . '}';

            // Rest weiter verarbeiten
            if (trim($afterIf) !== '') {
                $furtherSplit = $this->splitIfRemainder($afterIf);
                $result = array_merge($result, $furtherSplit);
            }
        } else {
            // Kein {if} gefunden - direkter Content
            $result[] = '§CONTINUE_STRING§';
            $result[] = $currentLine;
        }

        return $result;
    }

    /**
     * 🔄 SPLIT: Rest nach {if} aufteilen
     */
    private function splitIfRemainder(string $line): array
    {
        $result = [];

        // Extrahiere {endif} und {endfor}
        if (preg_match('/^(.*?)\{endif\}(.*)$/', $line, $matches)) {
            $beforeEndif = $matches[1];
            $afterEndif = $matches[2];

            // Content vor {endif}
            if (trim($beforeEndif) !== '') {
                $result[] = '§CONTINUE_STRING§';
                $result[] = trim($beforeEndif);
            }

            $result[] = '{endif}';

            // Nach {endif} - sollte {endfor} und Rest enthalten
            if (trim($afterEndif) !== '') {
                if (preg_match('/^(.*?)\{endfor\}(.*)$/', $afterEndif, $endforMatches)) {
                    $beforeEndfor = $endforMatches[1];
                    $afterEndfor = $endforMatches[2];

                    if (trim($beforeEndfor) !== '') {
                        $result[] = '§CONTINUE_STRING§';
                        $result[] = trim($beforeEndfor);
                    }

                    $result[] = '{endfor}';

                    // Rest nach {endfor}
                    if (trim($afterEndfor) !== '') {
                        $result[] = '§CONTINUE_STRING§';
                        $result[] = trim($afterEndfor);
                    }
                }
            }
        }

        return $result;
    }

    /**
     * 🔍 DETECTION METHODS
     */
    private function isLoopStart(string $line): bool
    {
        return strpos($line, '{for {nmaxitems}}') !== false
            || strpos($line, '{for {nmaxsearchkeys}}') !== false;
    }

    private function isLoopEnd(string $line): bool
    {
        return strpos($line, '{endfor}') !== false;
    }

    private function isConditionalStart(string $line): bool
    {
        return strpos($line, '{if ') !== false;
    }

    private function isConditionalEnd(string $line): bool
    {
        return strpos($line, '{endif}') !== false;
    }

    private function extractCondition(string $line): string
    {
        if (preg_match('/\{if\s+([^}]+)\}/', $line, $matches)) {
            return $matches[1];
        }
        return '';
    }

    private function processCondition(string $condition): string
    {
        // Einfache Condition-Verarbeitung
        $condition = str_replace('nCountSearchkeys', 'i', $condition);
        $condition = str_replace('{nmaxsearchkeys}', "gtree[0].project[0].tables[{$this->currentTableIndex}].nmaxitems", $condition);
        return $condition;
    }

    /**
     * 🔄 VARIABLE PROCESSING
     */
    private function processVariables(string $line, bool $insideLoop): string
    {
        $processedLine = $line;

        // Project variables
        $processedLine = str_replace('{projectname}', $this->gtree[0]['project'][0]['projectname'] ?? 'Unknown', $processedLine);
        $processedLine = str_replace('{projectdatabase}', $this->gtree[0]['project'][0]['projectdatabase'] ?? 'Unknown', $processedLine);

        // Table variables
        if (isset($this->gtree[0]['project'][0]['tables'][$this->currentTableIndex])) {
            $table = $this->gtree[0]['project'][0]['tables'][$this->currentTableIndex];
            $processedLine = str_replace('{tablename}', $table['tablename'] ?? 'Unknown', $processedLine);
            $processedLine = str_replace('{filename}', $table['tablename'] ?? 'Unknown', $processedLine);
            $processedLine = str_replace('{filekeyname}', $table['primarykeyfield'] ?? 'id', $processedLine);
        }

        // Item variables (nur im Loop)
        if ($insideLoop) {
            $processedLine = str_replace('{item.name}', "' + gtree[0].project[0].tables[{$this->currentTableIndex}].items[i].name + '", $processedLine);
            $processedLine = str_replace('{item.type}', "' + gtree[0].project[0].tables[{$this->currentTableIndex}].items[i].type + '", $processedLine);
        }

        return $processedLine;
    }

    /**
     * 🛡️ JAVASCRIPT ESCAPING
     */
    private function escapeForJavaScript(string $line): string
    {
        $escaped = str_replace("\\", "\\\\", $line);
        $escaped = str_replace("'", "\\'", $escaped);
        $escaped = str_replace('"', '\\"', $escaped);

        // 🔧 FIX: Escape newlines to prevent JavaScript syntax errors
        $escaped = str_replace("\n", "\\n", $escaped);   // Newlines
        $escaped = str_replace("\r", "\\r", $escaped);   // Carriage returns

        return $escaped;
    }

    /**
     * 🎯 DEMO: Dein SQL-Problem step-by-step lösen
     */
    public static function solveSqlProblemStepByStep(): array
    {
        $originalTemplate = '$sql = \'SELECT count(*) AS count FROM {filename} WHERE ({for {nmaxsearchkeys}}{item.name} LIKE \'%\' . $search . \'%\'{if nCountSearchkeys<{nmaxsearchkeys}} OR {endif}{endfor})\' . $order_by;';

        $demoGtree = [
            [
                'project' => [
                    [
                        'projectname' => 'php_crud',
                        'tables' => [
                            [
                                'tablename' => 'accounting_log',
                                'primarykeyfield' => 'accl_id',
                                'nmaxitems' => 3,
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
            'original_template' => $originalTemplate,
            'preprocessed' => $engine->preprocessTemplateConstructs($originalTemplate),
            'generated_js' => $engine->processTemplate($originalTemplate),
            'explanation' => [
                'step_1' => 'Template-Konstrukte werden auf einzelne Zeilen aufgeteilt',
                'step_2' => '{filename} wird zu accounting_log ersetzt',
                'step_3' => '{for} und {if} werden als separate Blöcke behandelt',
                'step_4' => 'Keine "Geister-}" mehr im JavaScript',
                'step_5' => 'Sauberer, debugbarer Code'
            ]
        ];
    }
}