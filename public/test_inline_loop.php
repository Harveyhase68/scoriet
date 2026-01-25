<?php
require __DIR__ . '/../vendor/autoload.php';

header('Content-Type: text/plain');

$gtree = [
    [
        'project' => [
            [
                'projectname' => 'Test',
                'tables' => [
                    [
                        'tablename' => 'users',
                        'nmaxitems' => 3,
                        'fields' => [
                            ['name' => 'id'],
                            ['name' => 'email'],
                            ['name' => 'name']
                        ]
                    ]
                ]
            ]
        ]
    ]
];

$engine = new App\Services\UltimateTemplateEngine($gtree);

$template = '$columns = "{:for nmaxitems:}{:item.name:}{:if item.islast==false:}, {:endif:}{:endfor:}";';

echo "=== INLINE LOOP TEST ===\n\n";
echo "Template:\n$template\n\n";
echo "=== Generated JavaScript ===\n\n";

$result = $engine->processTemplate($template, 'test', 0);

echo $result;

echo "\n\n=== Pattern Test ===\n";
$pattern = '/\{:for\s+(\w+):\}/';
$matchText = '{:for nmaxitems:}';
if (preg_match($pattern, $matchText, $matches)) {
    echo "Pattern MATCHES: " . $matches[1] . "\n";
} else {
    echo "Pattern does NOT match\n";
}

echo "\n=== DELETE THIS FILE AFTER USE ===\n";
