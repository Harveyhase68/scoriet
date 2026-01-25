<?php
header('Content-Type: text/plain');

$line = '$columns = "{:for nmaxitems:}{:item.name:}{:if item.islast==false:}, {:endif:}{:endfor:}";';

echo "Line: $line\n\n";

// Test hasMixedContent patterns
$standalonePattern = '/^\s*\{:(for|endfor|if|endif|switch|endswitch|case|default|\/\w+)\s*.*?:\}\s*$/';
$pattern1 = '/\{:(for\s+.*?|endfor|if\s+.*?|endif):\}/';
$pattern2 = '/\{:for\s+\{:[^:]+:\}:\}/';

echo "Is standalone? " . (preg_match($standalonePattern, $line) ? 'YES (would skip)' : 'NO') . "\n";
echo "Pattern 1 match? " . (preg_match($pattern1, $line) ? 'YES' : 'NO') . "\n";
echo "Pattern 2 match? " . (preg_match($pattern2, $line) ? 'YES' : 'NO') . "\n";

// Combined hasMixedContent logic
$trimmedLine = trim($line);
$isStandalone = preg_match($standalonePattern, $line);
$hasMixed = !$isStandalone && (preg_match($pattern1, $line) || preg_match($pattern2, $line));

echo "\nhasMixedContent would return: " . ($hasMixed ? 'TRUE' : 'FALSE') . "\n";

// Test the new processMixedContentLine pattern
$inlinePattern = '/\{:for\s+\{:[^:]+:\}:\}|\{:for\s+\w+:\}|\{:if\s+[^:]+:\}|\{:endif:\}|\{:endfor:\}/';
echo "\nNew inline pattern matches:\n";
preg_match_all($inlinePattern, $line, $matches);
foreach ($matches[0] as $match) {
    echo "  - '$match'\n";
}

echo "\n=== DELETE THIS FILE AFTER USE ===\n";
