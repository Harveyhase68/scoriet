<?php

/**
 * Setup i18n in all TSX files
 *
 * 1. Scans all .tsx files
 * 2. Checks if i18n is already imported
 * 3. If not, adds the import and setup
 */

class I18nSetup
{
    private array $tsxFiles = [];
    private array $filesWithI18n = [];
    private array $filesNeedingI18n = [];
    private bool $dryRun = false;
    private string $logFile = 'i18n_setup.log';

    public function __construct(bool $dryRun = false)
    {
        $this->dryRun = $dryRun;
        echo "=== i18n Setup for TSX Files ===\n";
        if ($dryRun) {
            echo "*** DRY RUN MODE - No files will be modified ***\n";
        }
        echo "\n";

        // Clear log file
        file_put_contents($this->logFile, "=== i18n Setup Log ===\n");
        file_put_contents($this->logFile, "Started: " . date('Y-m-d H:i:s') . "\n\n", FILE_APPEND);
    }

    /**
     * Find all TSX files
     */
    public function findAllTSXFiles(): void
    {
        echo "Searching for TSX files...\n";

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator('resources/js', RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'tsx') {
                $this->tsxFiles[] = $file->getPathname();
            }
        }

        echo "Found " . count($this->tsxFiles) . " TSX files.\n\n";
    }

    /**
     * Check if file already has i18n setup
     */
    public function analyzeFiles(): void
    {
        echo "Analyzing TSX files for i18n setup...\n\n";

        foreach ($this->tsxFiles as $file) {
            $content = file_get_contents($file);
            $relativePath = str_replace(getcwd() . DIRECTORY_SEPARATOR, '', $file);
            $relativePath = str_replace('\\', '/', $relativePath);

            $hasI18nImport = $this->hasI18nImport($content);
            $hasUseTranslation = $this->hasUseTranslationCall($content);

            if ($hasI18nImport && $hasUseTranslation) {
                $this->filesWithI18n[] = $file;
                echo "✓ $relativePath - Already has i18n\n";
                $this->writeLog("✓ $relativePath - Already has i18n");
            } else {
                $this->filesNeedingI18n[] = $file;
                echo "⚠ $relativePath - Needs i18n setup\n";
                $this->writeLog("⚠ $relativePath - Needs i18n setup");

                if (!$hasI18nImport) {
                    echo "    - Missing import\n";
                    $this->writeLog("    - Missing import");
                }
                if (!$hasUseTranslation) {
                    echo "    - Missing useTranslation call\n";
                    $this->writeLog("    - Missing useTranslation call");
                }
            }
        }

        echo "\n=== Analysis Summary ===\n";
        echo "Total TSX files: " . count($this->tsxFiles) . "\n";
        echo "Already have i18n: " . count($this->filesWithI18n) . "\n";
        echo "Need i18n setup: " . count($this->filesNeedingI18n) . "\n\n";

        $this->writeLog("\n=== Analysis Summary ===");
        $this->writeLog("Total TSX files: " . count($this->tsxFiles));
        $this->writeLog("Already have i18n: " . count($this->filesWithI18n));
        $this->writeLog("Need i18n setup: " . count($this->filesNeedingI18n));
    }

    /**
     * Check if file has i18n import
     */
    private function hasI18nImport(string $content): bool
    {
        return preg_match("/import.*from\s+['\"]@\/i18n['\"]/", $content) === 1;
    }

    /**
     * Check if file has useTranslation call
     */
    private function hasUseTranslationCall(string $content): bool
    {
        return preg_match("/useTranslation\s*\(/", $content) === 1;
    }

    /**
     * Setup i18n in files that need it
     */
    public function setupI18nInFiles(): void
    {
        if (empty($this->filesNeedingI18n)) {
            echo "No files need i18n setup!\n";
            return;
        }

        echo "\n=== Setting up i18n in " . count($this->filesNeedingI18n) . " files ===\n\n";

        foreach ($this->filesNeedingI18n as $file) {
            $this->setupI18nInFile($file);
        }
    }

    /**
     * Setup i18n in a single file
     */
    private function setupI18nInFile(string $filePath): void
    {
        $content = file_get_contents($filePath);
        $relativePath = str_replace(getcwd() . DIRECTORY_SEPARATOR, '', $filePath);
        $relativePath = str_replace('\\', '/', $relativePath);

        $modified = false;

        // Step 1: Add import if missing
        if (!$this->hasI18nImport($content)) {
            $content = $this->addI18nImport($content);
            $modified = true;
            echo "  ✓ Added import to $relativePath\n";
            $this->writeLog("  ✓ Added import to $relativePath");
        }

        // Step 2: Add useState import if missing (needed for currentLanguage)
        if (!preg_match("/import.*useState.*from\s+['\"]react['\"]/", $content)) {
            $content = $this->addUseStateImport($content);
            $modified = true;
        }

        // Step 3: Add useTranslation setup if missing
        if (!$this->hasUseTranslationCall($content)) {
            $content = $this->addUseTranslationSetup($content);
            $modified = true;
            echo "  ✓ Added useTranslation setup to $relativePath\n";
            $this->writeLog("  ✓ Added useTranslation setup to $relativePath");
        }

        if ($modified) {
            if (!$this->dryRun) {
                file_put_contents($filePath, $content);
            }
            echo "✓ Updated $relativePath\n\n";
        }
    }

    /**
     * Add i18n import to file
     */
    private function addI18nImport(string $content): string
    {
        // Find the last import statement
        $lines = explode("\n", $content);
        $lastImportLine = 0;

        foreach ($lines as $index => $line) {
            if (preg_match("/^import\s+/", trim($line))) {
                $lastImportLine = $index;
            }
        }

        // Insert after last import
        $import = "import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';";
        array_splice($lines, $lastImportLine + 1, 0, $import);

        return implode("\n", $lines);
    }

    /**
     * Add useState to existing React import or create new import
     */
    private function addUseStateImport(string $content): string
    {
        // Check if there's already a React import
        if (preg_match("/^import\s+React/m", $content)) {
            // Add useState to existing React import
            $content = preg_replace_callback(
                "/^(import\s+React(?:,\s*\{[^}]*\})?)\s+from\s+['\"]react['\"]/m",
                function($matches) {
                    if (strpos($matches[1], '{') !== false) {
                        // Already has named imports, add useState to them
                        return preg_replace('/\{([^}]*)\}/', '{ useState, $1 }', $matches[1]) . " from 'react'";
                    } else {
                        // No named imports yet
                        return $matches[1] . ", { useState } from 'react'";
                    }
                },
                $content
            );
        } else {
            // No React import, add one at the top
            $lines = explode("\n", $content);
            array_unshift($lines, "import React, { useState } from 'react';");
            $content = implode("\n", $lines);
        }

        return $content;
    }

    /**
     * Add useTranslation setup after component declaration
     */
    private function addUseTranslationSetup(string $content): string
    {
        // Find the component function/export default function
        $patterns = [
            // export default function ComponentName
            '/^(export\s+default\s+function\s+\w+[^{]*\{)$/m',
            // function ComponentName
            '/^(function\s+\w+[^{]*\{)$/m',
            // const ComponentName = () => {
            '/^((?:export\s+)?const\s+\w+[^=]*=\s*\([^)]*\)\s*=>\s*\{)$/m',
        ];

        $setup = <<<'SETUP'

  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
SETUP;

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $content)) {
                $content = preg_replace($pattern, "$1" . $setup, $content, 1);
                break;
            }
        }

        return $content;
    }

    /**
     * Write to log file
     */
    private function writeLog(string $message): void
    {
        file_put_contents($this->logFile, $message . "\n", FILE_APPEND);
    }

    /**
     * Show final summary
     */
    public function showSummary(): void
    {
        echo "\n=== FINAL SUMMARY ===\n";
        echo "Total TSX files processed: " . count($this->tsxFiles) . "\n";
        echo "Files already with i18n: " . count($this->filesWithI18n) . "\n";
        echo "Files updated: " . count($this->filesNeedingI18n) . "\n";

        if ($this->dryRun) {
            echo "\n*** DRY RUN - No files were actually modified ***\n";
        }

        echo "\n📝 Detailed log written to: {$this->logFile}\n";

        $this->writeLog("\n=== FINAL SUMMARY ===");
        $this->writeLog("Total TSX files processed: " . count($this->tsxFiles));
        $this->writeLog("Files already with i18n: " . count($this->filesWithI18n));
        $this->writeLog("Files updated: " . count($this->filesNeedingI18n));
        $this->writeLog("Completed: " . date('Y-m-d H:i:s'));
    }
}

// Main execution
if (php_sapi_name() === 'cli') {
    // Check for command line arguments
    $mode = $argv[1] ?? null;
    $autoConfirm = ($argv[2] ?? null) === '-y';

    if ($mode === '--dry-run' || $mode === '-d') {
        $dryRun = true;
        $choice = '1';
    } elseif ($mode === '--real' || $mode === '-r') {
        $dryRun = false;
        $choice = '2';
    } else {
        echo "Choose mode:\n";
        echo "1. DRY RUN (analyze only, don't modify files)\n";
        echo "2. REAL RUN (analyze and modify files)\n";
        echo "\nChoice (1-2): ";

        $handle = fopen("php://stdin", "r");
        $choice = trim(fgets($handle));
        fclose($handle);

        $dryRun = ($choice === '1');
    }

    $setup = new I18nSetup($dryRun);

    // Step 1: Find all TSX files
    $setup->findAllTSXFiles();

    // Step 2: Analyze which files need i18n
    $setup->analyzeFiles();

    // Step 3: Setup i18n in files that need it
    if ($choice === '2') {
        if ($autoConfirm) {
            $confirm = 'y';
        } else {
            echo "\nProceed with setting up i18n in files that need it? (y/n): ";
            $handle = fopen("php://stdin", "r");
            $confirm = trim(fgets($handle));
            fclose($handle);
        }

        if (strtolower($confirm) === 'y') {
            $setup->setupI18nInFiles();
        } else {
            echo "Cancelled.\n";
        }
    }

    // Step 4: Show summary
    $setup->showSummary();

} else {
    echo "This script must be run from the command line.\n";
}
