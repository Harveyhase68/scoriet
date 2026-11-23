<?php

namespace App\Services;

/**
 * Parses .sml (Scoriet Meta Language) source files - as produced by the
 * external WinDev-to-SML converter - into per-target event code, ready to
 * be upserted into ui_window_events.
 *
 * This is a structural scanner, not a full SML parser: it only needs to
 * find `on window <event> { ... }`, `on control "<name>" <event> { ... }`,
 * `on block "<name>" <event> { ... }` and `globals { ... }` block
 * boundaries and slice out their body text verbatim. Everything else
 * (ui {}, requires, proc, comments, statement bodies) is opaque payload as
 * far as this class is concerned.
 *
 * Block boundaries are found by counting `{`/`}` characters - which is
 * exactly why SML uses braces (see ADR-008 in the SML spec) - but a naive
 * per-character count breaks the moment a brace occurs inside a string or
 * a `raw ... | ...` passthrough line (WLanguage source captured verbatim
 * can and does contain literal braces, e.g. `<- {sTabControlName, indControl}`
 * seen in real customer exports). So this scanner tracks string/comment/
 * raw-line context and only counts braces that are structurally real.
 */
class SmlEventImporter
{
    /**
     * @return SmlUnit[]
     */
    public function parse(string $text): array
    {
        $lines = preg_split('/\r\n|\r|\n/', $text);

        $depth = 0;
        $inRaw = false;
        /** @var SmlFrame[] $stack */
        $stack = [];
        /** @var SmlUnit[] $units */
        $units = [];
        $currentUnit = null;

        $lineCount = count($lines);
        for ($i = 0; $i < $lineCount; $i++) {
            $line = $lines[$i];
            $trimmed = trim($line);

            if ($inRaw) {
                if (str_starts_with($trimmed, '|')) {
                    continue; // raw passthrough content - never brace-scanned
                }
                $inRaw = false;
                // fall through - this line is processed normally below
            }

            if ($trimmed === '') {
                continue;
            }

            $firstWord = strtok($trimmed, " \t");

            if ($firstWord === 'raw') {
                $inRaw = true;
                continue; // header line itself carries no braces
            }

            $delta = $this->structuralBraceDelta($line);

            // Recognize block-opening headers (single line, ends with the
            // opening brace) before applying the generic depth change, so
            // we know which frame we're pushing.
            if ($delta > 0 && str_ends_with($trimmed, '{')) {
                $header = substr($trimmed, 0, -1);
                $header = rtrim($header);

                if ($firstWord === 'unit') {
                    [$kind, $name] = $this->parseUnitHeader($header);
                    $currentUnit = new SmlUnit($kind, $name);
                    $units[] = $currentUnit;
                    $stack[] = new SmlFrame('unit', null, null, $depth);
                } elseif ($firstWord === 'on' && $currentUnit !== null) {
                    [$target, $name, $event, $params] = $this->parseOnHeader($header);
                    if ($target === 'window') {
                        $stack[] = new SmlFrame('on_window', null, $event, $depth, $i, $params);
                    } elseif ($target === 'control') {
                        $stack[] = new SmlFrame('on_control', $name, $event, $depth, $i, $params);
                    } elseif ($target === 'block') {
                        $stack[] = new SmlFrame('on_block', $name, $event, $depth, $i, $params);
                    } elseif ($target === 'project') {
                        $stack[] = new SmlFrame('on_project', null, $event, $depth, $i, $params);
                    } else {
                        $stack[] = new SmlFrame('other', null, null, $depth);
                    }
                } elseif ($firstWord === 'globals' && $currentUnit !== null) {
                    $stack[] = new SmlFrame('globals', null, null, $depth, $i);
                } elseif ($firstWord === 'constants' && $currentUnit !== null) {
                    $stack[] = new SmlFrame('constants', null, null, $depth, $i);
                } elseif ($firstWord === 'struct' && $currentUnit !== null) {
                    $structName = $this->extractQuoted($header) ?? '';
                    $stack[] = new SmlFrame('struct', $structName, null, $depth, $i);
                } elseif ($firstWord === 'proc' && $currentUnit !== null) {
                    $proc = $this->parseProcHeader($header);
                    $frame = new SmlFrame('proc', $proc['name'], null, $depth, $i, $proc['params']);
                    $frame->procReturnType = $proc['returnType'];
                    $frame->procIsPrivate = $proc['isPrivate'];
                    $stack[] = $frame;
                } else {
                    // ui {}, requires-less blocks, if/for/switch/etc. inside
                    // a body we don't otherwise track, class/report units -
                    // still needs a frame so depth bookkeeping stays correct.
                    $stack[] = new SmlFrame('other', null, null, $depth);
                }
            }

            $depth += $delta;

            while (!empty($stack) && $depth <= end($stack)->depthBeforeOpen) {
                $frame = array_pop($stack);

                if ($currentUnit !== null && $frame->startLine !== null) {
                    $body = $this->sliceBody($lines, $frame->startLine, $i);

                    if (in_array($frame->kind, ['on_window', 'on_control', 'on_block', 'on_project'], true)) {
                        // `on window declarations(gnID: int = 0, ...)` / a
                        // control's event can carry a WinDev-style parameter
                        // list this scanner otherwise has nowhere to put -
                        // preserved verbatim as a leading comment rather than
                        // silently dropped (there is no dedicated schema slot
                        // for "this window/control opens with these params").
                        if ($frame->params !== null) {
                            $comment = '// event parameters: ' . $frame->params;
                            $body = $body === '' ? $comment : ($comment . "\n" . $body);
                        }

                        if ($frame->kind === 'on_window') {
                            $currentUnit->windowEvents[$frame->event] = $body;
                        } elseif ($frame->kind === 'on_control') {
                            $currentUnit->controlEvents[$frame->name][$frame->event] = $body;
                        } elseif ($frame->kind === 'on_block') {
                            $currentUnit->blockEvents[$frame->name][$frame->event] = $body;
                        } elseif ($frame->kind === 'on_project') {
                            $currentUnit->projectEvents[$frame->event] = $body;
                        }
                    } elseif ($frame->kind === 'globals') {
                        if ($currentUnit->kind === 'project') {
                            $currentUnit->globalVariables = $this->parseGlobalVarDecls($body);
                        } else {
                            $currentUnit->globalsBody = $body;
                        }
                    } elseif ($frame->kind === 'proc') {
                        $currentUnit->procedures[] = [
                            'name' => $frame->name,
                            'params' => $frame->params,
                            'return_type' => $frame->procReturnType,
                            'is_private' => $frame->procIsPrivate,
                            'code' => $body,
                        ];
                    } elseif ($frame->kind === 'struct') {
                        $currentUnit->structs[] = [
                            'name' => $frame->name,
                            'fields' => $this->parseGlobalVarDecls($body),
                        ];
                    } elseif ($frame->kind === 'constants') {
                        $currentUnit->constants = array_merge($currentUnit->constants, $this->parseConstDecls($body));
                    }
                }

                if ($frame->kind === 'unit') {
                    $currentUnit = null;
                }
            }
        }

        return $units;
    }

    /**
     * Net {}-delta for one line, ignoring braces inside double-quoted
     * strings (backslash-escape aware) and inside `//` line comments -
     * a `//` only starts a comment when it occurs outside a string, so
     * `"http://"` is not mistaken for a comment start.
     */
    private function structuralBraceDelta(string $line): int
    {
        $delta = 0;
        $inString = false;
        $len = strlen($line);

        for ($i = 0; $i < $len; $i++) {
            $ch = $line[$i];

            if ($inString) {
                if ($ch === '\\') {
                    $i++; // skip the escaped character
                    continue;
                }
                if ($ch === '"') {
                    $inString = false;
                }
                continue;
            }

            if ($ch === '"') {
                $inString = true;
                continue;
            }

            if ($ch === '/' && $i + 1 < $len && $line[$i + 1] === '/') {
                break; // rest of the line is a comment
            }

            if ($ch === '{') {
                $delta++;
            } elseif ($ch === '}') {
                $delta--;
            }
        }

        return $delta;
    }

    /**
     * `unit window "Name"` -> ['window', 'Name']
     */
    private function parseUnitHeader(string $header): array
    {
        $rest = trim(substr($header, strlen('unit')));
        $space = strpos($rest, ' ');
        $kind = $space !== false ? substr($rest, 0, $space) : $rest;
        $name = $this->extractQuoted(substr($rest, $space === false ? strlen($rest) : $space));
        return [$kind, $name ?? ''];
    }

    /**
     * `on window <event>[(<params>)]` -> ['window', null, '<event>', <params>|null]
     * `on project <event>[(<params>)]` -> ['project', null, '<event>', <params>|null]
     * `on control "Name" <event>[(<params>)]` -> ['control', 'Name', '<event>', <params>|null]
     * `on block "Name" <event>[(<params>)]` -> ['block', 'Name', '<event>', <params>|null]
     */
    private function parseOnHeader(string $header): array
    {
        $rest = trim(substr($header, strlen('on')));
        $space = strpos($rest, ' ');
        if ($space === false) {
            return ['other', null, null, null];
        }
        $target = substr($rest, 0, $space);
        $remainder = trim(substr($rest, $space));

        if ($target === 'window' || $target === 'project') {
            [$event, $params] = $this->splitEventAndParams($remainder);
            return [$target, null, $event, $params];
        }

        if ($target === 'control' || $target === 'block') {
            $name = $this->extractQuoted($remainder);
            if ($name === null) {
                return ['other', null, null, null];
            }
            $afterQuote = trim(substr($remainder, strpos($remainder, '"', 1 + strpos($remainder, '"')) + 1));
            [$event, $params] = $this->splitEventAndParams($afterQuote);
            return [$target, $name, $event, $params];
        }

        return ['other', null, null, null];
    }

    /**
     * `declarations(gnID: int = 0, OpeningMode: any = "Modif")` ->
     * ['declarations', 'gnID: int = 0, OpeningMode: any = "Modif"']
     * `click` -> ['click', null]
     */
    private function splitEventAndParams(string $eventPart): array
    {
        $paren = strpos($eventPart, '(');
        if ($paren === false) {
            return [$eventPart, null];
        }
        $name = trim(substr($eventPart, 0, $paren));
        $paramsRaw = trim(substr($eventPart, $paren));
        // Strip the outer parentheses themselves for the comment - the '('/')'
        // are re-added implicitly by presenting it as a param list.
        $paramsRaw = trim($paramsRaw, '()');
        return [$name, $paramsRaw];
    }

    /**
     * `proc "Name"(params) -> ReturnType` -> ['name'=>'Name','params'=>'params'|null,'returnType'=>'ReturnType','isPrivate'=>bool]
     * `proc private "Name"(params) -> ReturnType` -> isPrivate=true
     */
    private function parseProcHeader(string $header): array
    {
        $rest = trim(substr($header, strlen('proc')));
        $isPrivate = false;
        if (str_starts_with($rest, 'private ')) {
            $isPrivate = true;
            $rest = trim(substr($rest, strlen('private')));
        }

        $name = $this->extractQuoted($rest);
        if ($name === null) {
            return ['name' => '', 'params' => null, 'returnType' => null, 'isPrivate' => $isPrivate];
        }

        $firstQuote = strpos($rest, '"');
        $afterName = trim(substr($rest, strpos($rest, '"', $firstQuote + 1) + 1));

        // Paren-depth aware split so a default value expression containing
        // its own parens (e.g. a nested call) can't confuse the boundary.
        $params = null;
        $returnType = null;
        if (str_starts_with($afterName, '(')) {
            $depth = 0;
            $len = strlen($afterName);
            for ($i = 0; $i < $len; $i++) {
                if ($afterName[$i] === '(') {
                    $depth++;
                } elseif ($afterName[$i] === ')') {
                    $depth--;
                    if ($depth === 0) {
                        $params = trim(substr($afterName, 1, $i - 1));
                        $remainder = trim(substr($afterName, $i + 1));
                        if (str_starts_with($remainder, '->')) {
                            $returnType = trim(substr($remainder, 2));
                        }
                        break;
                    }
                }
            }
        }

        return [
            'name' => $name,
            'params' => $params === '' ? null : $params,
            'returnType' => $returnType,
            'isPrivate' => $isPrivate,
        ];
    }

    /**
     * A project's `globals { }` block - and a `struct { }` block's field
     * list, same shape - is a flat list of typed variable declarations
     * (unlike a window's `globals`, which stays opaque code merged into
     * `declarations`) - structured here so the UI can render an actual
     * name/type/default editor instead of a code blob.
     * `var gsServer: string = loadParameter("SERVERIP", "")` ->
     * ['name'=>'gsServer','type'=>'string','default'=>'loadParameter(...)']
     *
     * @return array<int, array{name: string, type: string, default: ?string}>
     */
    private function parseGlobalVarDecls(string $body): array
    {
        $result = [];
        foreach (explode("\n", $body) as $line) {
            $line = trim($line);
            if (!str_starts_with($line, 'var ')) {
                continue; // comments / blank lines - never fabricate a declaration
            }
            $rest = trim(substr($line, strlen('var')));
            $colon = strpos($rest, ':');
            if ($colon === false) {
                continue;
            }
            $name = trim(substr($rest, 0, $colon));
            $typeAndDefault = trim(substr($rest, $colon + 1));

            $eq = strpos($typeAndDefault, '=');
            if ($eq !== false) {
                $type = trim(substr($typeAndDefault, 0, $eq));
                $default = trim(substr($typeAndDefault, $eq + 1));
            } else {
                $type = $typeAndDefault;
                $default = null;
            }

            if ($name !== '' && $type !== '') {
                $result[] = ['name' => $name, 'type' => $type, 'default' => $default];
            }
        }
        return $result;
    }

    /**
     * `const SRCCOPY = 13369376` -> ['name'=>'SRCCOPY','value'=>'13369376']
     * (constants carry no type in SML, unlike `var`)
     *
     * @return array<int, array{name: string, value: string}>
     */
    private function parseConstDecls(string $body): array
    {
        $result = [];
        foreach (explode("\n", $body) as $line) {
            $line = trim($line);
            if (!str_starts_with($line, 'const ')) {
                continue;
            }
            $rest = trim(substr($line, strlen('const')));
            $eq = strpos($rest, '=');
            if ($eq === false) {
                continue;
            }
            $name = trim(substr($rest, 0, $eq));
            $value = trim(substr($rest, $eq + 1));
            if ($name !== '') {
                $result[] = ['name' => $name, 'value' => $value];
            }
        }
        return $result;
    }

    private function extractQuoted(string $text): ?string
    {
        $start = strpos($text, '"');
        if ($start === false) {
            return null;
        }
        $end = strpos($text, '"', $start + 1);
        if ($end === false) {
            return null;
        }
        return substr($text, $start + 1, $end - $start - 1);
    }

    private function sliceBody(array $lines, int $headerLineIndex, int $closeLineIndex): string
    {
        if ($closeLineIndex <= $headerLineIndex + 1) {
            return '';
        }
        $bodyLines = array_slice($lines, $headerLineIndex + 1, $closeLineIndex - $headerLineIndex - 1);
        // Trailing \r already stripped by preg_split; rtrim each line's
        // trailing whitespace only (never leading, that's the code's own
        // indentation) so re-displaying in the editor doesn't show
        // dangling spaces the writer emitted.
        return implode("\n", array_map('rtrim', $bodyLines));
    }
}

class SmlUnit
{
    public string $kind;
    public string $name;
    /** @var array<string, string> event_name => code */
    public array $windowEvents = [];
    /** @var array<string, array<string, string>> control_name => [event_name => code] */
    public array $controlEvents = [];
    /** @var array<string, array<string, string>> block_name => [event_name => code] */
    public array $blockEvents = [];
    // Window units only - raw code, merged into the 'declarations' event.
    public ?string $globalsBody = null;
    // 'project' unit only - structured, see SmlEventImporter::parseGlobalVarDecls().
    /** @var array<int, array{name: string, type: string, default: ?string}> */
    public array $globalVariables = [];
    /** @var array<int, array{name: string, params: ?string, return_type: ?string, is_private: bool, code: string}> */
    public array $procedures = [];
    // 'project' unit only - `on project <event> { }` (e.g. the startup code).
    /** @var array<string, string> event_name => code */
    public array $projectEvents = [];
    // Found in any unit (window or project) - always imported project-wide,
    // since a generated Dart/PHP struct type is global regardless of where
    // WinDev happened to declare it.
    /** @var array<int, array{name: string, fields: array<int, array{name: string, type: string, default: ?string}>}> */
    public array $structs = [];
    /** @var array<int, array{name: string, value: string}> */
    public array $constants = [];

    public function __construct(string $kind, string $name)
    {
        $this->kind = $kind;
        $this->name = $name;
    }
}

class SmlFrame
{
    public string $kind;
    public ?string $name;
    public ?string $event;
    public int $depthBeforeOpen;
    public ?int $startLine;
    public ?string $params;
    // 'proc' frames only
    public ?string $procReturnType = null;
    public bool $procIsPrivate = false;

    public function __construct(string $kind, ?string $name, ?string $event, int $depthBeforeOpen, ?int $startLine = null, ?string $params = null)
    {
        $this->kind = $kind;
        $this->name = $name;
        $this->event = $event;
        $this->depthBeforeOpen = $depthBeforeOpen;
        $this->startLine = $startLine;
        $this->params = $params;
    }
}
