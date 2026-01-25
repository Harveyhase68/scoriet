<?php

namespace App\Services;

/**
 * 🔧 SIMPLE TEMPLATE ENGINE
 *
 * Einfache, wartbare Template-Engine OHNE Regex
 * Löst Template-Zeile für Zeile auf - keine verschachtelten Konstrukte in einer Zeile
 */
class SimpleTemplateEngine
{
    private array $gtree;
    private int $currentTableIndex;

    public function __construct(array $gtree, int $tableIndex = 0)
    {
        $this->gtree = $gtree;
        $this->currentTableIndex = $tableIndex;
    }

    /**
     * 🎯 MAIN PROCESSING - Zeile für Zeile, keine Regex
     */
    public function processTemplate(string $templateContent): string
    {
        $lines = explode("\n", $templateContent);
        $jsFunction = "function generateTemplate() {\n";
        $jsFunction .= "  let sContentResult = '';\n\n";

        $insideLoop = false;
        $loopLines = [];

        foreach ($lines as $lineNumber => $line) {
            // Trim für Checks, aber originale Einrückung beibehalten
            $trimmedLine = trim($line);

            // LOOP START DETECTION
            if ($this->isLoopStart($trimmedLine)) {
                $insideLoop = true;
                $loopLines = [];
                $jsFunction .= "  // Loop start\n";
                $jsFunction .= "  for (let i = 0; i < gtree[0].project[0].tables[{$this->currentTableIndex}].nmaxitems; i++) {\n";
                continue;
            }

            // LOOP END DETECTION
            if ($this->isLoopEnd($trimmedLine)) {
                $insideLoop = false;

                // Process collected loop lines
                foreach ($loopLines as $loopLine) {
                    $processedLine = $this->processVariables($loopLine, true); // true = inside loop
                    $escapedLine = $this->escapeForJavaScript($processedLine);
                    $jsFunction .= "    sContentResult += '{$escapedLine}\\n';\n";
                }

                $jsFunction .= "  }\n";
                $jsFunction .= "  // Loop end\n\n";
                continue;
            }

            // INSIDE LOOP - collect lines
            if ($insideLoop) {
                $loopLines[] = $line;
                continue;
            }

            // REGULAR LINE - outside loop
            $processedLine = $this->processVariables($line, false); // false = outside loop
            $escapedLine = $this->escapeForJavaScript($processedLine);
            $jsFunction .= "  sContentResult += '{$escapedLine}\\n';\n";
        }

        $jsFunction .= "\n  return sContentResult;\n";
        $jsFunction .= "}\n";

        return $jsFunction;
    }

    /**
     * 🔍 SIMPLE LOOP DETECTION - keine Regex
     */
    private function isLoopStart(string $line): bool
    {
        return strpos($line, '{:for nmaxitems:}') !== false
            || strpos($line, '{:for nmaxsearchkeys:}') !== false
            || strpos($line, '{:for %:}') !== false;
    }

    private function isLoopEnd(string $line): bool
    {
        return strpos($line, '{:endfor:}') !== false;
    }

    /**
     * 🔄 VARIABLE PROCESSING - einfach und wartbar
     */
    private function processVariables(string $line, bool $insideLoop): string
    {
        $processedLine = $line;

        // PROJECT VARIABLES - immer verfügbar
        $processedLine = $this->replaceProjectVariables($processedLine);

        // TABLE VARIABLES - immer verfügbar
        $processedLine = $this->replaceTableVariables($processedLine);

        // ITEM VARIABLES - nur im Loop
        if ($insideLoop) {
            $processedLine = $this->replaceItemVariables($processedLine);
        }

        return $processedLine;
    }

    /**
     * 🏗️ PROJECT VARIABLE REPLACEMENT
     */
    private function replaceProjectVariables(string $line): string
    {
        if (!isset($this->gtree[0]['project'][0])) {
            return $line;
        }

        $project = $this->gtree[0]['project'][0];
        $replacements = [
            '{:projectname:}' => $project['projectname'] ?? 'Unknown',
            '{:projectdatabase:}' => $project['projectdatabase'] ?? 'Unknown',
            '{:projecturl:}' => $project['projecturl'] ?? 'Unknown',
        ];

        foreach ($replacements as $search => $replace) {
            if (strpos($line, $search) !== false) {
                $line = str_replace($search, $replace, $line);
            }
        }

        return $line;
    }

    /**
     * 🗄️ TABLE VARIABLE REPLACEMENT
     */
    private function replaceTableVariables(string $line): string
    {
        if (!isset($this->gtree[0]['project'][0]['tables'][$this->currentTableIndex])) {
            return $line;
        }

        $table = $this->gtree[0]['project'][0]['tables'][$this->currentTableIndex];
        $replacements = [
            '{:tablename:}' => $table['tablename'] ?? 'Unknown',
            '{:filename:}' => $table['tablename'] ?? 'Unknown', // Alias
            '{:filekeyname:}' => $table['primarykeyfield'] ?? 'id', // 🎯 DAS WAR DER FEHLER!
            '{:nmaxitems:}' => $table['nmaxitems'] ?? 0,
            '{:nmaxsearchkeys:}' => $table['nmaxitems'] ?? 0, // Für Suchfelder
        ];

        foreach ($replacements as $search => $replace) {
            if (strpos($line, $search) !== false) {
                $line = str_replace($search, $replace, $line);
            }
        }

        return $line;
    }

    /**
     * 📝 ITEM VARIABLE REPLACEMENT - nur im Loop context
     */
    private function replaceItemVariables(string $line): string
    {
        // Diese werden zu JavaScript-Variablen, die zur Laufzeit aufgelöst werden
        $replacements = [
            '{:item.name:}' => "' + gtree[0].project[0].tables[{$this->currentTableIndex}].items[i].name + '",
            '{:item.type:}' => "' + gtree[0].project[0].tables[{$this->currentTableIndex}].items[i].type + '",
            '{:item.controltype:}' => "' + gtree[0].project[0].tables[{$this->currentTableIndex}].items[i].controltype + '",
            '{:field.name:}' => "' + gtree[0].project[0].tables[{$this->currentTableIndex}].items[i].name + '",
            '{:field.type:}' => "' + gtree[0].project[0].tables[{$this->currentTableIndex}].items[i].type + '",
        ];

        foreach ($replacements as $search => $replace) {
            if (strpos($line, $search) !== false) {
                $line = str_replace($search, $replace, $line);
            }
        }

        return $line;
    }

    /**
     * 🛡️ JAVASCRIPT ESCAPING - sicher und einfach
     */
    private function escapeForJavaScript(string $line): string
    {
        // Einfache Escapes - keine komplexen Regex
        $escaped = $line;
        $escaped = str_replace("\\", "\\\\", $escaped); // Backslashes first!
        $escaped = str_replace("'", "\\'", $escaped);    // Single quotes
        $escaped = str_replace('"', '\\"', $escaped);    // Double quotes

        // 🔧 FIX: Escape newlines to prevent JavaScript syntax errors
        $escaped = str_replace("\n", "\\n", $escaped);   // Newlines
        $escaped = str_replace("\r", "\\r", $escaped);   // Carriage returns

        return $escaped;
    }

    /**
     * 🎯 DEMO FÜR DEIN PROBLEM
     */
    public static function fixYourSqlProblem(): string
    {
        $templateContent = '$sql = \'SELECT count(*) AS count FROM {tablename} WHERE (\';
$searchConditions = [];
{:for nmaxitems:}
$searchConditions[] = \'{item.name} LIKE \\\'%\' . $search . \'%\\\'\';
{:endfor:}
$sql .= implode(\' OR \', $searchConditions);
$sql .= \')\' . $order_by;';

        // Demo gtree
        $demoGtree = [
            [
                'project' => [
                    [
                        'projectname' => 'php_crud',
                        'tables' => [
                            [
                                'tablename' => 'accounting_log',
                                'primarykeyfield' => 'accl_id', // 🎯 HIER IST DER SCHLÜSSEL!
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
        return $engine->processTemplate($templateContent);
    }
}