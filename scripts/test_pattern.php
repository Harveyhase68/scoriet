<?php
$line = '$columns = "{:for nmaxitems:}{:item.name:}{:if item.islast==false:}, {:endif:}{:endfor:}";';

$pattern1 = '/\{:(for\s+.*?|endfor|if\s+.*?|endif):\}/';
$pattern2 = '/\{:for\s+\{:[^:]+:\}:\}/';
$standalonePattern = '/^\s*\{:(for|endfor|if|endif|switch|endswitch|case|default|\/\w+)\s*.*?:\}\s*$/';

echo "Line: $line\n";
echo "Pattern 1 (hasMixedContent) match: " . (preg_match($pattern1, $line) ? 'YES' : 'NO') . "\n";
echo "Pattern 2 (nested for) match: " . (preg_match($pattern2, $line) ? 'YES' : 'NO') . "\n";
echo "Standalone pattern match: " . (preg_match($standalonePattern, $line) ? 'YES' : 'NO') . "\n";

// Test the new processMixedContentLine pattern
$newPattern = '/\{:for\s+\{:[^:]+:\}:\}|\{:for\s+\w+:\}|\{:if\s+[^:]+:\}|\{:endif:\}|\{:endfor:\}/';
echo "New inline pattern match: " . (preg_match($newPattern, $line) ? 'YES' : 'NO') . "\n";

// Show all matches
preg_match_all($newPattern, $line, $matches);
echo "All matches: " . print_r($matches[0], true) . "\n";
