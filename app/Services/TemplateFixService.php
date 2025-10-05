<?php

namespace App\Services;

/**
 * 🔧 TEMPLATE FIX SERVICE
 *
 * Service to fix specific template processing issues
 */
class TemplateFixService
{
    /**
     * 🎯 Fix the PHP sorting template issue
     */
    public static function fixPhpSortingTemplate(string $templateContent, array $gtree, int $tableIndex = 0): string
    {
        $lines = explode("\n", $templateContent);
        $result = [];
        $insideLoop = false;
        $loopContent = [];

        foreach ($lines as $line) {
            $trimmedLine = trim($line);

            // Detect loop start
            if (strpos($trimmedLine, '{for {nmaxitems}}') !== false) {
                $insideLoop = true;
                continue;
            }

            // Detect loop end
            if (strpos($trimmedLine, '{endfor}') !== false) {
                $insideLoop = false;

                // Process loop content for each item
                if (isset($gtree[0]['project'][0]['tables'][$tableIndex]['fields'])) {
                    $items = $gtree[0]['project'][0]['tables'][$tableIndex]['fields'];

                    foreach ($items as $item) {
                        foreach ($loopContent as $loopLine) {
                            $processedLine = $loopLine;

                            // Replace item variables
                            $processedLine = str_replace('{item.name}', $item['name'], $processedLine);
                            $processedLine = str_replace('{item.type}', $item['type'], $processedLine);
                            $processedLine = str_replace('{item.controltype}', $item['controltype'], $processedLine);

                            $result[] = $processedLine;
                        }
                    }
                }

                $loopContent = [];
                continue;
            }

            // Inside loop - collect lines
            if ($insideLoop) {
                $loopContent[] = $line;
                continue;
            }

            // Outside loop - process project/table variables
            $processedLine = $line;

            // Replace project variables
            if (isset($gtree[0]['project'][0])) {
                $project = $gtree[0]['project'][0];
                $processedLine = str_replace('{projectname}', $project['projectname'] ?? 'Unknown', $processedLine);
                $processedLine = str_replace('{projectdatabase}', $project['projectdatabase'] ?? 'Unknown', $processedLine);
                $processedLine = str_replace('{projecturl}', $project['projecturl'] ?? 'Unknown', $processedLine);
            }

            // Replace table variables
            if (isset($gtree[0]['project'][0]['tables'][$tableIndex])) {
                $table = $gtree[0]['project'][0]['tables'][$tableIndex];
                $processedLine = str_replace('{tablename}', $table['tablename'] ?? 'Unknown', $processedLine);
                $processedLine = str_replace('{filekeyname}', $table['primarykeyfield'] ?? 'id', $processedLine);
            }

            $result[] = $processedLine;
        }

        return implode("\n", $result);
    }

    /**
     * 🔧 Generate corrected JavaScript function
     */
    public static function generateCorrectedJsFunction(string $templateContent, array $gtree, int $tableIndex = 0): string
    {
        $processedContent = self::fixPhpSortingTemplate($templateContent, $gtree, $tableIndex);

        $functionName = "generateFixedTemplate" . ($tableIndex + 1);

        $jsFunction = "function {$functionName}() {\n";
        $jsFunction .= "  let sContentResult = '';\n\n";

        $lines = explode("\n", $processedContent);
        foreach ($lines as $line) {
            $escapedLine = addslashes($line);
            // 🔧 FIX: Additional newline escaping to prevent JavaScript syntax errors
            $escapedLine = str_replace("\n", "\\n", $escapedLine);
            $escapedLine = str_replace("\r", "\\r", $escapedLine);
            $jsFunction .= "  sContentResult += '{$escapedLine}\\n';\n";
        }

        $jsFunction .= "\n  return sContentResult;\n";
        $jsFunction .= "}\n";

        return $jsFunction;
    }

    /**
     * 🎯 Quick demo for your specific case
     */
    public static function demoFixedTemplate(): string
    {
        $templateContent = '$sort = NULL;
$order_by = (string)" ORDER BY {filekeyname} ASC";
if (isset($_POST[\'sort\'])) {
    if (!$_POST[\'sort\'] == "") {
        $sort = $_POST[\'sort\'];
        $sort = filter_var($sort, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        switch ($sort) {
{for {nmaxitems}}
            case "{item.name}":
                $order_by = (string)" ORDER BY {item.name} ASC";
                break;
            case "{item.name}_d":
                $order_by = (string)" ORDER BY {item.name} DESC";
                break;
{endfor}
        }
    }
}';

        // Demo gtree data
        $demoGtree = [
            [
                'project' => [
                    [
                        'projectname' => 'php_crud',
                        'projectdatabase' => 'primapos',
                        'projecturl' => 'http://localhost/php_crud',
                        'tables' => [
                            [
                                'tablename' => 'accounting_log',
                                'primarykeyfield' => 'accl_id',
                                'fields' => [
                                    ['name' => 'accl_id', 'type' => 'BIGINT', 'controltype' => 24],
                                    ['name' => 'branch_no', 'type' => 'INT', 'controltype' => 24],
                                    ['name' => 'station_no', 'type' => 'INT', 'controltype' => 24],
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ];

        return self::fixPhpSortingTemplate($templateContent, $demoGtree, 0);
    }
}