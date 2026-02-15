<?php
/**
 * Find abandoned translation keys.
 *
 * Scans all translation keys from types.ts and checks if they are used
 * in any .tsx or .php file outside the i18n directory.
 * Keys only found in types.ts + locale files are considered "abandoned".
 *
 * Usage: php find_abandoned_translations.php
 */

$startTime = microtime(true);

$baseDir = __DIR__;
$typesFile = $baseDir . '/resources/js/i18n/types.ts';

// Files to exclude from "usage" search (these are the i18n definition files)
$i18nFiles = [
    'resources/js/i18n/types.ts',
    'resources/js/i18n/locales/de.ts',
    'resources/js/i18n/locales/en.ts',
    'resources/js/i18n/locales/es.ts',
    'resources/js/i18n/locales/fr.ts',
    'resources/js/i18n/locales/it.ts',
];

// --- Step 1: Extract all keys from types.ts ---
echo "Step 1: Reading translation keys from types.ts...\n";

$typesContent = file_get_contents($typesFile);
$lines = explode("\n", $typesContent);
$allKeys = [];

foreach ($lines as $line) {
    $trimmed = trim($line);
    // Match lines like "  keyname: string;"
    $colonPos = strpos($trimmed, ':');
    if ($colonPos !== false) {
        $key = trim(substr($trimmed, 0, $colonPos));
        // Valid keys: alphanumeric + underscore, no spaces, not empty
        if ($key !== '' && strpos($key, ' ') === false && strpos($key, '{') === false
            && strpos($key, '}') === false && strpos($key, '/') === false
            && $key !== 'export interface TranslationKeys') {
            // Check if the rest is ": string;" pattern
            $rest = trim(substr($trimmed, $colonPos + 1));
            if ($rest === 'string;' || $rest === 'string') {
                $allKeys[] = $key;
            }
        }
    }
}

echo "  Found " . count($allKeys) . " translation keys.\n\n";

// --- Step 2: Collect all .tsx and .php file contents (excluding i18n files) ---
echo "Step 2: Scanning project files for key usage...\n";

$searchDirs = [
    $baseDir . '/resources/js',
    $baseDir . '/app',
    $baseDir . '/routes',
];

$filesToSearch = [];

foreach ($searchDirs as $dir) {
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS)
    );

    foreach ($iterator as $file) {
        if (!$file->isFile()) continue;

        $ext = strtolower($file->getExtension());
        if ($ext !== 'tsx' && $ext !== 'ts' && $ext !== 'php') continue;

        // Get relative path
        $relativePath = str_replace('\\', '/', substr($file->getPathname(), strlen($baseDir) + 1));

        // Skip i18n definition files
        $isI18n = false;
        foreach ($i18nFiles as $i18nFile) {
            if ($relativePath === $i18nFile) {
                $isI18n = true;
                break;
            }
        }
        if ($isI18n) continue;

        // Also skip the i18n index.ts (contains tpl function, not translations)
        if (strpos($relativePath, 'resources/js/i18n/') === 0) continue;

        $filesToSearch[] = $file->getPathname();
    }
}

echo "  Scanning " . count($filesToSearch) . " files...\n";

// Read all file contents into one big string for fast searching
$allContent = '';
foreach ($filesToSearch as $filepath) {
    $allContent .= file_get_contents($filepath) . "\n";
}

echo "  Total content size: " . number_format(strlen($allContent) / 1024, 0) . " KB\n\n";

// --- Step 3: Check each key ---
echo "Step 3: Checking keys for usage...\n\n";

$abandonedKeys = [];
$usedCount = 0;

foreach ($allKeys as $key) {
    if (strpos($allContent, $key) !== false) {
        $usedCount++;
    } else {
        $abandonedKeys[] = $key;
    }
}

// --- Step 4: Output results ---
$elapsed = round(microtime(true) - $startTime, 2);

echo "=== RESULTS ===\n\n";
echo "Total keys:     " . count($allKeys) . "\n";
echo "Used keys:      " . $usedCount . "\n";
echo "Abandoned keys: " . count($abandonedKeys) . "\n";
echo "Time:           {$elapsed}s\n\n";

if (count($abandonedKeys) > 0) {
    echo "--- ABANDONED KEYS (safe to remove) ---\n\n";
    foreach ($abandonedKeys as $key) {
        echo "  $key\n";
    }

    // Also save to file for easy processing
    $outputFile = $baseDir . '/abandoned_translations.txt';
    file_put_contents($outputFile, implode("\n", $abandonedKeys) . "\n");
    echo "\n  List saved to: abandoned_translations.txt (" . count($abandonedKeys) . " keys)\n";
} else {
    echo "No abandoned keys found! All translations are in use.\n";
}

echo "\n";
