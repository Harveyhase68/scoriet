<?php

namespace App\Support;

/**
 * Resolves the singular / case-variant table-name placeholders (%15–%19) in
 * filenames and output_path.
 *
 * Background: the legacy %-codes only covered the RAW (usually plural) DB table
 * name — `%1` (as-is), `%10` (PascalCase), `%11` (UPPER). Stacks that map a DB
 * table to a SINGULAR class/folder (Spring Boot, .NET, Laravel models, …) need
 * the singular and true case variants in the FILE NAME, not just in the file
 * CONTENT (where `{:filesingular:}` etc. already exist). These codes close that
 * gap and mirror the content constructs exactly, so a file named `%16.java`
 * produces the same identifier as `{:filesingularpascalcase:}` inside it.
 *
 *   %15 -> singular, lowercase, joined   e.g. postal_codes -> postalcode
 *   %16 -> singular PascalCase           e.g. postal_codes -> PostalCode
 *   %17 -> singular camelCase            e.g. postal_codes -> postalCode
 *   %18 -> plural PascalCase             e.g. postal_codes -> PostalCodes
 *   %19 -> plural camelCase              e.g. postal_codes -> postalCodes
 *
 * The singular form is taken from the per-table `singular_name` column when the
 * caller supplies it (via $singular), otherwise auto-guessed from the table
 * name. This is the single source of truth for the English-singular guess —
 * UltimateTemplateController delegates to {@see guessEnglishSingular()} so the
 * filename codes and the gtree content constructs never drift apart.
 *
 * Shared by ProjectFileTreeGenerator (preview tree) and
 * UltimateTemplateController (actual generation) + mirrored in the frontend
 * safety-net (CodeGenerationPanel.tsx).
 */
final class TableNamePlaceholders
{
    /**
     * Replaces every %15–%19 occurrence in $subject.
     *
     * MUST run before the generic `%1` replacement so the two-digit codes are
     * consumed first (otherwise `%1` would match the `%1` prefix of `%15`).
     *
     * @param string      $subject    filename or output_path fragment
     * @param string|null $tableName  raw DB table name (e.g. "postal_codes")
     * @param string|null $singular   resolved singular (e.g. the table's
     *                                 `singular_name`); auto-guessed when null/empty
     */
    public static function apply(string $subject, ?string $tableName, ?string $singular = null): string
    {
        $tableName = $tableName ?? '';
        $singular = ($singular !== null && $singular !== '')
            ? $singular
            : self::guessEnglishSingular($tableName);

        $singularLower = strtolower($singular);
        $singularPascal = str_replace('_', '', ucwords($singularLower, '_'));
        $pluralPascal = str_replace('_', '', ucwords(strtolower($tableName), '_'));

        // Order matters only relative to %1 (handled by the caller); among
        // themselves the five codes are mutually non-overlapping (all 3 chars).
        $map = [
            '%19' => lcfirst($pluralPascal),              // plural camelCase
            '%18' => $pluralPascal,                       // plural PascalCase
            '%17' => lcfirst($singularPascal),            // singular camelCase
            '%16' => $singularPascal,                     // singular PascalCase
            '%15' => str_replace('_', '', $singularLower), // singular, lowercase, joined
        ];

        return str_replace(array_keys($map), array_values($map), $subject);
    }

    /**
     * Guess the English singular form of a table name.
     *
     * Only handles common English patterns — for other languages or irregular
     * plurals, set the per-table `singular_name` column and pass it to
     * {@see apply()} instead of relying on this guess.
     */
    public static function guessEnglishSingular(string $tableName): string
    {
        // Compound names: split by underscore, singularize the LAST part only.
        $parts = explode('_', $tableName);
        $lastPart = array_pop($parts);

        // Common English pluralization rules (reversed).
        if (str_ends_with($lastPart, 'ies') && strlen($lastPart) > 4) {
            $lastPart = substr($lastPart, 0, -3) . 'y'; // categories -> category
        } elseif (str_ends_with($lastPart, 'ses') || str_ends_with($lastPart, 'xes')
            || str_ends_with($lastPart, 'zes') || str_ends_with($lastPart, 'shes')
            || str_ends_with($lastPart, 'ches')) {
            $lastPart = substr($lastPart, 0, -2); // addresses -> address, boxes -> box
        } elseif (str_ends_with($lastPart, 'ves')) {
            $lastPart = substr($lastPart, 0, -3) . 'f'; // wolves -> wolf (approximate)
        } elseif (str_ends_with($lastPart, 's') && !str_ends_with($lastPart, 'ss')
            && !str_ends_with($lastPart, 'us') && !str_ends_with($lastPart, 'is')) {
            $lastPart = substr($lastPart, 0, -1); // products -> product
        }

        $parts[] = $lastPart;
        return implode('_', $parts);
    }
}
