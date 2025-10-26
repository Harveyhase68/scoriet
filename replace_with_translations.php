<?php

/**
 * Replace hardcoded strings with translation variables
 *
 * Supports mixed German/English texts
 * TSX files: 'text' → {t.keyname}
 * PHP files: 'text' → __('keyname')
 */

class TranslationReplacer
{
    private array $translations = []; // key => ['en' => 'text', 'de' => 'text', ...]
    private array $replacedFiles = [];
    private int $totalReplacements = 0;
    private bool $dryRun = false;
    private array $detailedLog = [];
    private string $logFile = 'translation_replacements.log';

    public function __construct(bool $dryRun = false)
    {
        $this->dryRun = $dryRun;
        echo "=== Translation String Replacer ===\n";
        if ($dryRun) {
            echo "*** DRY RUN MODE - No files will be modified ***\n";
        }
        echo "\n";

        // Clear log file
        file_put_contents($this->logFile, "=== Translation Replacement Log ===\n");
        file_put_contents($this->logFile, "Started: " . date('Y-m-d H:i:s') . "\n\n", FILE_APPEND);
    }

    /**
     * Load translations from all language files
     */
    public function loadAllTranslations(): void
    {
        $languages = ['en', 'de', 'fr', 'es', 'it'];

        foreach ($languages as $lang) {
            $file = "resources/js/i18n/locales/{$lang}.ts";
            if (file_exists($file)) {
                $this->loadLanguageFile($file, $lang);
            }
        }

        echo "Loaded translations for " . count($languages) . " languages.\n";
        echo "Total unique keys: " . count($this->translations) . "\n\n";
    }

    /**
     * Parse a language file and extract translations
     */
    private function loadLanguageFile(string $filePath, string $lang): void
    {
        echo "Loading $lang from {$filePath}...\n";

        $content = file_get_contents($filePath);

        // Extract all key: 'value' or key: "value" pairs
        preg_match_all("/\s+([a-zA-Z0-9_]+):\s*'([^'\\\\]*(\\\\.[^'\\\\]*)*)',?/", $content, $singleQuotes);
        preg_match_all('/\s+([a-zA-Z0-9_]+):\s*"([^"\\\\]*(\\\\.[^"\\\\]*)*)",?/', $content, $doubleQuotes);

        $count = 0;

        // Process single quotes
        foreach ($singleQuotes[1] as $index => $key) {
            $text = $singleQuotes[2][$index];
            if (!isset($this->translations[$key])) {
                $this->translations[$key] = [];
            }
            $this->translations[$key][$lang] = $text;
            $count++;
        }

        // Process double quotes
        foreach ($doubleQuotes[1] as $index => $key) {
            $text = $doubleQuotes[2][$index];
            if (!isset($this->translations[$key])) {
                $this->translations[$key] = [];
            }
            if (!isset($this->translations[$key][$lang])) {
                $this->translations[$key][$lang] = $text;
                $count++;
            }
        }

        echo "  → $count translations loaded\n";
    }

    /**
     * Replace strings in a TSX file
     */
    public function replaceTSXFile(string $filePath): void
    {
        $lines = file($filePath);
        $content = implode('', $lines);
        $originalContent = $content;
        $replacements = 0;
        $replacementLog = [];

        foreach ($this->translations as $key => $texts) {
            // Try all language variants
            foreach ($texts as $lang => $text) {
                // Skip very short texts (likely not worth translating)
                if (strlen($text) < 3) {
                    continue;
                }

                // Skip if text contains curly braces (likely already a variable)
                if (strpos($text, '{') !== false || strpos($text, '}') !== false) {
                    continue;
                }

                // Escape special regex characters
                $escapedText = preg_quote($text, '/');

                // Replace in different contexts and track line numbers
                $patterns = [
                    // Single quotes: 'text'
                    [
                        'pattern' => "/'$escapedText'/",
                        'replacement' => '{t.' . $key . '}',
                        'context' => 'single-quote'
                    ],
                    // Double quotes: "text"
                    [
                        'pattern' => "/\"$escapedText\"/",
                        'replacement' => '{t.' . $key . '}',
                        'context' => 'double-quote'
                    ],
                    // JSX expression: {'text'}
                    [
                        'pattern' => '/\{[\'"]' . $escapedText . '[\'"]\}/',
                        'replacement' => '{t.' . $key . '}',
                        'context' => 'jsx-expression'
                    ],
                ];

                foreach ($patterns as $patternInfo) {
                    // Find all matches with their positions
                    $matches = [];
                    preg_match_all($patternInfo['pattern'], $content, $matches, PREG_OFFSET_CAPTURE);

                    if (!empty($matches[0])) {
                        foreach ($matches[0] as $match) {
                            $position = $match[1];
                            $lineNumber = $this->getLineNumber($originalContent, $position);

                            $logEntry = [
                                'file' => $filePath,
                                'line' => $lineNumber,
                                'key' => $key,
                                'original_text' => $text,
                                'language' => $lang,
                                'context' => $patternInfo['context']
                            ];
                            $this->detailedLog[] = $logEntry;

                            $replacementLog[] = sprintf(
                                "  Line %4d: [%s] '%s' → {t.%s}",
                                $lineNumber,
                                $patternInfo['context'],
                                substr($text, 0, 50) . (strlen($text) > 50 ? '...' : ''),
                                $key
                            );
                        }
                    }

                    // Do the actual replacement
                    $newContent = preg_replace($patternInfo['pattern'], $patternInfo['replacement'], $content, -1, $count);
                    if ($count > 0 && $newContent !== $content) {
                        $content = $newContent;
                        $replacements += $count;
                    }
                }
            }
        }

        if ($replacements > 0) {
            if (!$this->dryRun) {
                file_put_contents($filePath, $content);
            }
            $this->replacedFiles[] = $filePath;
            $this->totalReplacements += $replacements;

            $relativePath = str_replace(getcwd() . DIRECTORY_SEPARATOR, '', $filePath);
            $relativePath = str_replace('\\', '/', $relativePath);

            echo "\n✓ $relativePath: $replacements replacements\n";
            foreach ($replacementLog as $log) {
                echo $log . "\n";
            }

            // Write to log file
            $this->writeToLogFile($relativePath, $replacementLog);
        }
    }

    /**
     * Get line number from content offset
     */
    private function getLineNumber(string $content, int $offset): int
    {
        $beforeOffset = substr($content, 0, $offset);
        return substr_count($beforeOffset, "\n") + 1;
    }

    /**
     * Write detailed log to file
     */
    private function writeToLogFile(string $file, array $logs): void
    {
        file_put_contents($this->logFile, "\n$file:\n", FILE_APPEND);
        foreach ($logs as $log) {
            file_put_contents($this->logFile, $log . "\n", FILE_APPEND);
        }
    }

    /**
     * Replace strings in a PHP file
     */
    public function replacePHPFile(string $filePath): void
    {
        $lines = file($filePath);
        $content = implode('', $lines);
        $originalContent = $content;
        $replacements = 0;
        $replacementLog = [];

        foreach ($this->translations as $key => $texts) {
            // Try all language variants
            foreach ($texts as $lang => $text) {
                // Skip very short texts
                if (strlen($text) < 3) {
                    continue;
                }

                // Skip if text contains variables (likely already translated)
                if (strpos($text, '{$') !== false || strpos($text, '__') !== false) {
                    continue;
                }

                // Escape special regex characters
                $escapedText = preg_quote($text, '/');

                $patterns = [
                    // Single quotes: 'text'
                    [
                        'pattern' => "/'$escapedText'/",
                        'replacement' => "__('$key')",
                        'context' => 'single-quote'
                    ],
                    // Double quotes: "text"
                    [
                        'pattern' => "/\"$escapedText\"/",
                        'replacement' => "__('$key')",
                        'context' => 'double-quote'
                    ],
                ];

                foreach ($patterns as $patternInfo) {
                    // Find all matches with their positions
                    $matches = [];
                    preg_match_all($patternInfo['pattern'], $content, $matches, PREG_OFFSET_CAPTURE);

                    if (!empty($matches[0])) {
                        foreach ($matches[0] as $match) {
                            $position = $match[1];
                            $lineNumber = $this->getLineNumber($originalContent, $position);

                            $logEntry = [
                                'file' => $filePath,
                                'line' => $lineNumber,
                                'key' => $key,
                                'original_text' => $text,
                                'language' => $lang,
                                'context' => $patternInfo['context']
                            ];
                            $this->detailedLog[] = $logEntry;

                            $replacementLog[] = sprintf(
                                "  Line %4d: [%s] '%s' → __('%s')",
                                $lineNumber,
                                $patternInfo['context'],
                                substr($text, 0, 50) . (strlen($text) > 50 ? '...' : ''),
                                $key
                            );
                        }
                    }

                    // Do the actual replacement
                    $newContent = preg_replace($patternInfo['pattern'], $patternInfo['replacement'], $content, -1, $count);
                    if ($count > 0 && $newContent !== $content) {
                        $content = $newContent;
                        $replacements += $count;
                    }
                }
            }
        }

        if ($replacements > 0) {
            if (!$this->dryRun) {
                file_put_contents($filePath, $content);
            }
            $this->replacedFiles[] = $filePath;
            $this->totalReplacements += $replacements;

            $relativePath = str_replace(getcwd() . DIRECTORY_SEPARATOR, '', $filePath);
            $relativePath = str_replace('\\', '/', $relativePath);

            echo "\n✓ $relativePath: $replacements replacements\n";
            foreach ($replacementLog as $log) {
                echo $log . "\n";
            }

            // Write to log file
            $this->writeToLogFile($relativePath, $replacementLog);
        }
    }

    /**
     * Process all TSX files in a directory
     */
    public function processTSXDirectory(string $directory): void
    {
        echo "\n=== Processing TSX files in $directory ===\n";

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'tsx') {
                $this->replaceTSXFile($file->getPathname());
            }
        }
    }

    /**
     * Process all PHP files in a directory
     */
    public function processPHPDirectory(string $directory): void
    {
        echo "\n=== Processing PHP files in $directory ===\n";

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                // Skip this replacement script itself
                if ($file->getPathname() === __FILE__) {
                    continue;
                }
                $this->replacePHPFile($file->getPathname());
            }
        }
    }

    /**
     * Show summary
     */
    public function showSummary(): void
    {
        echo "\n=== SUMMARY ===\n";
        echo "Total replacements: {$this->totalReplacements}\n";
        echo "Files modified: " . count($this->replacedFiles) . "\n";

        if ($this->dryRun) {
            echo "\n*** DRY RUN - No files were actually modified ***\n";
        }

        // Write summary to log file
        file_put_contents($this->logFile, "\n=== SUMMARY ===\n", FILE_APPEND);
        file_put_contents($this->logFile, "Total replacements: {$this->totalReplacements}\n", FILE_APPEND);
        file_put_contents($this->logFile, "Files modified: " . count($this->replacedFiles) . "\n", FILE_APPEND);
        file_put_contents($this->logFile, "Completed: " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);

        if ($this->totalReplacements > 0) {
            echo "\n📝 Detailed log written to: {$this->logFile}\n";
        }
    }
}

// Main execution
if (php_sapi_name() === 'cli') {
    echo "Choose mode:\n";
    echo "1. DRY RUN (show what would be changed, don't modify files)\n";
    echo "2. REAL RUN (actually modify files)\n";
    echo "\nChoice (1-2): ";

    $handle = fopen("php://stdin", "r");
    $modeChoice = trim(fgets($handle));

    $dryRun = ($modeChoice === '1');

    $replacer = new TranslationReplacer($dryRun);

    // Load ALL language translations (en, de, fr, es, it)
    $replacer->loadAllTranslations();

    // Ask user what to process
    echo "\nWhat do you want to process?\n";
    echo "1. TSX files only\n";
    echo "2. PHP files only\n";
    echo "3. Both TSX and PHP files\n";
    echo "4. Single file (specify path)\n";
    echo "\nChoice (1-4): ";

    $choice = trim(fgets($handle));

    switch ($choice) {
        case '1':
            $replacer->processTSXDirectory('resources/js');
            break;
        case '2':
            $replacer->processPHPDirectory('app');
            break;
        case '3':
            $replacer->processTSXDirectory('resources/js');
            $replacer->processPHPDirectory('app');
            break;
        case '4':
            echo "Enter file path: ";
            $filePath = trim(fgets($handle));
            if (file_exists($filePath)) {
                $ext = pathinfo($filePath, PATHINFO_EXTENSION);
                if ($ext === 'tsx') {
                    $replacer->replaceTSXFile($filePath);
                } elseif ($ext === 'php') {
                    $replacer->replacePHPFile($filePath);
                } else {
                    echo "Unsupported file type: $ext\n";
                }
            } else {
                echo "File not found: $filePath\n";
            }
            break;
        default:
            echo "Invalid choice!\n";
            exit(1);
    }

    fclose($handle);

    $replacer->showSummary();

} else {
    echo "This script must be run from the command line.\n";
}
