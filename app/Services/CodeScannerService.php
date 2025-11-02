<?php

namespace App\Services;

class CodeScannerService
{
    /**
     * 🔥 JAVASCRIPT BLOCKLIST - Only scan {code}...{codeend} blocks (runs in browser!)
     * These patterns will BLOCK public visibility
     * Using \b for word boundaries to avoid false positives
     */
    private static $javascriptBlocklist = [
        '\beval\s*\(' => 'eval() - Code execution',
        '\bFunction\s*\(' => 'Function() constructor - Dynamic code execution',
        '\bnew\s+Function\s*\(' => 'new Function() - Dynamic code execution',
        '\bsetTimeout\s*\(\s*["\']' => 'setTimeout() with string - Code execution',
        '\bsetInterval\s*\(\s*["\']' => 'setInterval() with string - Code execution',
    ];

    /**
     * 🛡️ PHP BLOCKLIST - Scan entire file (optional, currently disabled)
     * PHP code runs server-side, not in browser
     */
    private static $phpBlocklist = [
        // Disabled for now - PHP code in templates is generally safe
        // Can be enabled if needed for additional security
        // '\bexec\s*\(' => 'exec() - Shell command execution',
        // '\bsystem\s*\(' => 'system() - Shell command execution',
        // '\bshell_exec\s*\(' => 'shell_exec() - Shell command execution',
        // '\bpassthru\s*\(' => 'passthru() - Shell command execution',
        // '\bproc_open\s*\(' => 'proc_open() - Process execution',
        // '\bpopen\s*\(' => 'popen() - Process execution',
        // '`[^`]+`' => 'Backtick execution - Shell command',
    ];

    /**
     * ⚠️ JAVASCRIPT WARNINGS - Only scan {code}...{codeend} blocks
     * These patterns will warn but not block
     */
    private static $javascriptWarnings = [
        '\bfetch\s*\(' => 'fetch() - External network request',
        '\bXMLHttpRequest\b' => 'XMLHttpRequest - External network request',
        '\blocalStorage\b' => 'localStorage - Browser storage access',
        '\bsessionStorage\b' => 'sessionStorage - Browser storage access',
        'document\.cookie' => 'document.cookie - Cookie access',
        '\batob\s*\(' => 'atob() - Base64 decode (possible obfuscation)',
        '\bbtoa\s*\(' => 'btoa() - Base64 encode',
    ];

    /**
     * 🔍 Scan template files for malicious code
     * 🎯 ONLY scans {code}...{codeend} blocks (JavaScript executed in browser)
     *
     * @param array $files Array of template files with file_content
     * @return array ['blocked' => bool, 'issues' => [...]]
     */
    public static function scanTemplateFiles(array $files): array
    {
        $issues = [
            'hard_blocks' => [],
            'soft_warnings' => [],
        ];

        foreach ($files as $file) {
            $fileName = $file['file_name'] ?? $file->file_name ?? 'unknown';
            $content = $file['file_content'] ?? $file->file_content ?? '';

            // 🎯 Extract ONLY {code}...{codeend} blocks
            $codeBlocks = self::extractCodeBlocks($content);

            // If no code blocks found, skip scanning (template is safe)
            if (empty($codeBlocks)) {
                continue;
            }

            // Scan each code block for dangerous JavaScript patterns
            foreach ($codeBlocks as $blockInfo) {
                $blockContent = $blockInfo['content'];
                $blockStartLine = $blockInfo['start_line'];

                // 🔥 Scan for JavaScript blocklist patterns
                foreach (self::$javascriptBlocklist as $pattern => $description) {
                    if (preg_match('#' . $pattern . '#i', $blockContent, $matches)) {
                        // Find line number within the code block
                        $relativeLineNumber = self::findLineNumber($blockContent, $matches[0]);
                        $absoluteLineNumber = $blockStartLine + $relativeLineNumber;

                        $issues['hard_blocks'][] = [
                            'file' => $fileName,
                            'pattern' => $description,
                            'matched' => $matches[0],
                            'line' => $absoluteLineNumber,
                            'severity' => 'critical',
                            'context' => 'JavaScript {code} block',
                        ];
                    }
                }

                // ⚠️ Scan for JavaScript warnings
                foreach (self::$javascriptWarnings as $pattern => $description) {
                    if (preg_match('#' . $pattern . '#i', $blockContent, $matches)) {
                        $relativeLineNumber = self::findLineNumber($blockContent, $matches[0]);
                        $absoluteLineNumber = $blockStartLine + $relativeLineNumber;

                        $issues['soft_warnings'][] = [
                            'file' => $fileName,
                            'pattern' => $description,
                            'matched' => $matches[0],
                            'line' => $absoluteLineNumber,
                            'severity' => 'warning',
                            'context' => 'JavaScript {code} block',
                        ];
                    }
                }
            }
        }

        $blocked = count($issues['hard_blocks']) > 0;

        return [
            'blocked' => $blocked,
            'issues' => $issues,
            'summary' => [
                'critical_count' => count($issues['hard_blocks']),
                'warning_count' => count($issues['soft_warnings']),
                'total_files_scanned' => count($files),
                'code_blocks_scanned' => array_sum(array_map(function($file) {
                    $content = $file['file_content'] ?? $file->file_content ?? '';
                    return count(self::extractCodeBlocks($content));
                }, $files)),
            ],
        ];
    }

    /**
     * 🔧 Extract {code}...{codeend} blocks from template content
     *
     * @param string $content Template file content
     * @return array Array of ['content' => string, 'start_line' => int]
     */
    private static function extractCodeBlocks(string $content): array
    {
        $blocks = [];
        $pattern = '/\{code\}(.*?)\{codeend\}/s';

        if (preg_match_all($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
            foreach ($matches[1] as $match) {
                $blockContent = $match[0];
                $blockPosition = $match[1];

                // Calculate line number where {code} block starts
                $startLine = substr_count(substr($content, 0, $blockPosition), "\n") + 1;

                $blocks[] = [
                    'content' => $blockContent,
                    'start_line' => $startLine,
                ];
            }
        }

        return $blocks;
    }

    /**
     * Find line number of a match in content
     */
    private static function findLineNumber(string $content, string $match): int
    {
        $position = strpos($content, $match);
        if ($position === false) {
            return 0;
        }

        $lines = substr_count(substr($content, 0, $position), "\n");
        return $lines + 1;
    }

    /**
     * Generate human-readable scan report
     */
    public static function generateReport(array $scanResult): string
    {
        $report = "Code Security Scan Report\n";
        $report .= "=========================\n\n";

        if ($scanResult['blocked']) {
            $report .= "🚫 CRITICAL ISSUES FOUND - Template BLOCKED from going public\n\n";
        } else if ($scanResult['summary']['warning_count'] > 0) {
            $report .= "⚠️  WARNINGS FOUND - Manual review recommended\n\n";
        } else {
            $report .= "✅ No issues detected\n\n";
        }

        $report .= "Summary:\n";
        $report .= "- Files scanned: {$scanResult['summary']['total_files_scanned']}\n";
        $report .= "- Critical issues: {$scanResult['summary']['critical_count']}\n";
        $report .= "- Warnings: {$scanResult['summary']['warning_count']}\n\n";

        if (!empty($scanResult['issues']['hard_blocks'])) {
            $report .= "CRITICAL ISSUES:\n";
            foreach ($scanResult['issues']['hard_blocks'] as $issue) {
                $report .= "❌ {$issue['file']} (line {$issue['line']}): {$issue['pattern']}\n";
                $report .= "   Found: {$issue['matched']}\n";
            }
            $report .= "\n";
        }

        if (!empty($scanResult['issues']['soft_warnings'])) {
            $report .= "WARNINGS:\n";
            foreach ($scanResult['issues']['soft_warnings'] as $issue) {
                $report .= "⚠️  {$issue['file']} (line {$issue['line']}): {$issue['pattern']}\n";
                $report .= "   Found: {$issue['matched']}\n";
            }
        }

        return $report;
    }
}
