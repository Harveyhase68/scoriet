<?php
/**
 * Find duplicate translation values across all i18n keys.
 * Only reports duplicates where the value is identical in ALL languages.
 *
 * Usage: php find_duplicate_translations.php
 */

$baseDir = __DIR__;

$localeFiles = [
    'de' => $baseDir . '/resources/js/i18n/locales/de.ts',
    'en' => $baseDir . '/resources/js/i18n/locales/en.ts',
    'es' => $baseDir . '/resources/js/i18n/locales/es.ts',
    'fr' => $baseDir . '/resources/js/i18n/locales/fr.ts',
    'it' => $baseDir . '/resources/js/i18n/locales/it.ts',
];

/**
 * Parse a .ts locale file and return key => value pairs.
 */
function parseLocaleFile(string $filePath): array
{
    $lines = file($filePath);
    $result = [];

    foreach ($lines as $line) {
        $trimmed = trim($line);

        // Match: keyname: 'value', or keyname: "value",
        $colonPos = strpos($trimmed, ':');
        if ($colonPos === false) continue;

        $key = trim(substr($trimmed, 0, $colonPos));
        if ($key === '' || strpos($key, ' ') !== false) continue;
        if (strpos($key, 'export') !== false || strpos($key, 'import') !== false) continue;
        if (strpos($key, '{') !== false || strpos($key, '}') !== false) continue;

        $rest = trim(substr($trimmed, $colonPos + 1));

        // Extract string value between quotes
        $value = null;
        if (strlen($rest) > 0) {
            $quote = $rest[0];
            if ($quote === "'" || $quote === '"') {
                // Find the closing quote (handle escaped quotes)
                $endPos = false;
                $searchFrom = 1;
                while ($searchFrom < strlen($rest)) {
                    $pos = strpos($rest, $quote, $searchFrom);
                    if ($pos === false) break;
                    // Check if escaped
                    if ($pos > 0 && $rest[$pos - 1] === '\\') {
                        $searchFrom = $pos + 1;
                        continue;
                    }
                    $endPos = $pos;
                    break;
                }
                if ($endPos !== false) {
                    $value = substr($rest, 1, $endPos - 1);
                }
            }
        }

        if ($value !== null && $key !== '') {
            $result[$key] = $value;
        }
    }

    return $result;
}

// --- Step 1: Parse all locale files ---
echo "Parsing locale files...\n";
$locales = [];
foreach ($localeFiles as $lang => $path) {
    $locales[$lang] = parseLocaleFile($path);
    echo "  $lang: " . count($locales[$lang]) . " keys\n";
}

// Use German as the base
$baseLocale = $locales['de'];
echo "\n";

// --- Step 2: Build a "fingerprint" for each key (all languages combined) ---
echo "Building fingerprints...\n";
$fingerprints = []; // fingerprint => [key1, key2, ...]

foreach ($baseLocale as $key => $deValue) {
    // Build fingerprint from ALL languages
    $parts = [];
    foreach ($localeFiles as $lang => $path) {
        $val = $locales[$lang][$key] ?? '<<MISSING>>';
        $parts[] = $lang . '=' . $val;
    }
    $fingerprint = implode('|', $parts);
    $fingerprints[$fingerprint][] = $key;
}

// --- Step 3: Find groups with 2+ keys (= duplicates) ---
$duplicateGroups = [];
foreach ($fingerprints as $fp => $keys) {
    if (count($keys) >= 2) {
        $duplicateGroups[] = $keys;
    }
}

// Sort by group size (largest first)
usort($duplicateGroups, function ($a, $b) {
    return count($b) - count($a);
});

// --- Step 4: Output ---
echo "\n=== RESULTS ===\n\n";

$totalDuplicateKeys = 0;
$savableKeys = 0;

foreach ($duplicateGroups as $group) {
    $totalDuplicateKeys += count($group);
    $savableKeys += count($group) - 1; // Keep one, remove the rest
}

echo "Duplicate groups:  " . count($duplicateGroups) . "\n";
echo "Keys involved:     $totalDuplicateKeys\n";
echo "Savable keys:      $savableKeys (keep 1 per group, remove rest)\n\n";

// Show top duplicates
echo "--- TOP DUPLICATE GROUPS ---\n\n";

$shown = 0;
foreach ($duplicateGroups as $group) {
    if ($shown >= 50) break; // Show max 50 groups

    $firstKey = $group[0];
    $deValue = $baseLocale[$firstKey] ?? '?';
    $displayValue = strlen($deValue) > 60 ? substr($deValue, 0, 57) . '...' : $deValue;

    echo "  [" . count($group) . "x] DE: \"$displayValue\"\n";
    foreach ($group as $key) {
        echo "       - $key\n";
    }
    echo "\n";
    $shown++;
}

if (count($duplicateGroups) > 50) {
    echo "  ... and " . (count($duplicateGroups) - 50) . " more groups.\n\n";
}

// Save full report
$reportFile = $baseDir . '/duplicate_translations.txt';
$report = "DUPLICATE TRANSLATION REPORT\n";
$report .= "============================\n\n";
$report .= "Duplicate groups: " . count($duplicateGroups) . "\n";
$report .= "Savable keys: $savableKeys\n\n";

foreach ($duplicateGroups as $group) {
    $firstKey = $group[0];
    $deValue = $baseLocale[$firstKey] ?? '?';
    $report .= "[" . count($group) . "x] DE: \"$deValue\"\n";
    foreach ($localeFiles as $lang => $path) {
        if ($lang === 'de') continue;
        $val = $locales[$lang][$firstKey] ?? '?';
        if ($val !== $deValue) {
            $report .= "     $lang: \"$val\"\n";
        }
    }
    foreach ($group as $key) {
        $report .= "  - $key\n";
    }
    $report .= "\n";
}

file_put_contents($reportFile, $report);
echo "Full report saved to: duplicate_translations.txt\n";
