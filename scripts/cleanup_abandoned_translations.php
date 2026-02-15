<?php
/**
 * Remove abandoned translation keys from all i18n files.
 * Reads the abandoned_translations.txt list and removes matching lines.
 *
 * Usage: php cleanup_abandoned_translations.php
 */

$startTime = microtime(true);
$baseDir = __DIR__;

$abandonedFile = $baseDir . '/abandoned_translations.txt';
if (!file_exists($abandonedFile)) {
    die("Error: abandoned_translations.txt not found. Run find_abandoned_translations.php first.\n");
}

// Load abandoned keys
$abandonedKeys = array_filter(array_map('trim', file($abandonedFile)));
echo "Loaded " . count($abandonedKeys) . " abandoned keys.\n\n";

// Build a fast lookup set
$abandonedSet = [];
foreach ($abandonedKeys as $key) {
    $abandonedSet[$key] = true;
}

// Files to clean
$files = [
    'resources/js/i18n/types.ts',
    'resources/js/i18n/locales/de.ts',
    'resources/js/i18n/locales/en.ts',
    'resources/js/i18n/locales/es.ts',
    'resources/js/i18n/locales/fr.ts',
    'resources/js/i18n/locales/it.ts',
];

$totalRemoved = 0;

foreach ($files as $relPath) {
    $filePath = $baseDir . '/' . $relPath;
    if (!file_exists($filePath)) {
        echo "SKIP: $relPath (not found)\n";
        continue;
    }

    $lines = file($filePath);
    $originalCount = count($lines);
    $newLines = [];
    $removedCount = 0;

    foreach ($lines as $line) {
        $trimmed = trim($line);

        // Extract the key from this line
        $colonPos = strpos($trimmed, ':');
        $shouldRemove = false;

        if ($colonPos !== false) {
            $key = trim(substr($trimmed, 0, $colonPos));
            if (isset($abandonedSet[$key])) {
                $shouldRemove = true;
            }
        }

        if ($shouldRemove) {
            $removedCount++;
        } else {
            $newLines[] = $line;
        }
    }

    if ($removedCount > 0) {
        file_put_contents($filePath, implode('', $newLines));
        $newCount = count($newLines);
        echo "CLEANED: $relPath - removed $removedCount lines ($originalCount -> $newCount)\n";
        $totalRemoved += $removedCount;
    } else {
        echo "OK:      $relPath - no abandoned keys found\n";
    }
}

$elapsed = round(microtime(true) - $startTime, 2);

echo "\n=== DONE ===\n";
echo "Total lines removed: $totalRemoved\n";
echo "Time: {$elapsed}s\n";
