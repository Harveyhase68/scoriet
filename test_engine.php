<?php
require 'vendor/autoload.php';

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

echo "Template: $template\n\n";

$result = $engine->processTemplate($template, 'test', 0);

echo "Result:\n$result\n";
