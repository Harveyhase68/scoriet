<?php

namespace App\Support;

/**
 * Resolves the `%9` filename placeholder with optional format suffix.
 *
 * Placeholder grammar in filenames and output_path:
 *   %9      -> project name as-is                  e.g. "csharp_postgresql"
 *   %9[u]   -> UPPERCASE                          e.g. "CSHARP_POSTGRESQL"
 *   %9[l]   -> lowercase                          e.g. "csharp_postgresql"
 *   %9[c]   -> camelCase                          e.g. "csharpPostgresql"
 *   %9[p]   -> PascalCase                         e.g. "CsharpPostgresql"
 *   %9[n]   -> Nice print (spaces, title-case)    e.g. "Csharp Postgresql"
 *
 * The `%14` placeholder carries the Project DB Version (previously meaning of %9;
 * kept here as a constant for callers that want a single place to fetch the key).
 *
 * Shared by both ProjectFileTreeGenerator (preview tree) and
 * UltimateTemplateController (actual generation), so format logic stays in one place.
 */
final class ProjectNamePlaceholder
{
    /**
     * Rewrites every `%9` / `%9[x]` occurrence in $subject using $projectName.
     *
     * If $projectName is empty, `%9` and `%9[x]` are stripped (yields empty string),
     * matching how the other project-context placeholders (%1 for table, etc.)
     * behave when their context is absent.
     */
    public static function resolve(string $subject, string $projectName): string
    {
        // One regex covers both bare %9 and %9[x]. The [x] group is optional.
        // Allowed suffix letters: u, l, c, p, n. Anything else falls through unchanged.
        return preg_replace_callback(
            '/%9(?:\[([ulcpn])\])?/',
            function (array $m) use ($projectName): string {
                if ($projectName === '') {
                    return '';
                }
                $format = $m[1] ?? '';
                return self::format($projectName, $format);
            },
            $subject
        ) ?? $subject;
    }

    /**
     * Applies one of the supported format suffixes to a project name.
     * Unknown format -> return name unchanged.
     */
    public static function format(string $name, string $format): string
    {
        if ($name === '') {
            return '';
        }
        switch ($format) {
            case 'u': return strtoupper($name);
            case 'l': return strtolower($name);
            case 'c': return self::toCamelCase($name);
            case 'p': return self::toPascalCase($name);
            case 'n': return self::toNiceCase($name);
            default:  return $name;
        }
    }

    /** Word separators: underscore, dash, space. */
    private static function splitWords(string $s): array
    {
        $s = str_replace(['-', ' '], '_', $s);
        $parts = explode('_', $s);
        $out = [];
        foreach ($parts as $p) {
            if ($p !== '') {
                $out[] = $p;
            }
        }
        return $out;
    }

    private static function toCamelCase(string $s): string
    {
        $words = self::splitWords($s);
        if ($words === []) {
            return '';
        }
        $first = strtolower(array_shift($words));
        $rest = '';
        foreach ($words as $w) {
            $rest .= ucfirst(strtolower($w));
        }
        return $first . $rest;
    }

    private static function toPascalCase(string $s): string
    {
        $out = '';
        foreach (self::splitWords($s) as $w) {
            $out .= ucfirst(strtolower($w));
        }
        return $out;
    }

    private static function toNiceCase(string $s): string
    {
        $words = self::splitWords($s);
        $capitalized = [];
        foreach ($words as $w) {
            $capitalized[] = ucfirst(strtolower($w));
        }
        return implode(' ', $capitalized);
    }
}
