<?php

namespace App\Support;

/**
 * Generates "<base>_copy" / "<base>_copy_<n>" suggestions for clone flows.
 *
 * The interesting bit is that cloning an already-cloned item — e.g. cloning
 * "report_copy" — should produce "report_copy_1", NOT "report_copy_copy".
 * The detector strips a trailing "_copy" or "_copy_<digits>" so the counter
 * picks up where the previous clone left off:
 *
 *   "report"           → "report_copy"
 *   "report_copy"      → "report_copy_1"
 *   "report_copy_1"    → "report_copy_2"
 *   "report_copy_7"    → "report_copy_8"
 *   "my_report_v2"     → "my_report_v2_copy"   (trailing "_<digits>" alone is
 *                                               not a copy marker)
 *
 * Uniqueness is delegated to the caller via the $exists closure because each
 * clone flow scopes uniqueness differently (per-user / per-project / per-team).
 */
class CopyNameSuggester
{
    /**
     * @param string   $sourceName Name being cloned (raw — may already end in _copy/_copy_<n>).
     * @param callable $exists     fn(string $candidate): bool — true if the candidate is already taken.
     * @param int      $maxLen     Column length cap (defaults to varchar(255)).
     */
    public static function suggest(string $sourceName, callable $exists, int $maxLen = 255): string
    {
        ['base' => $base, 'startCounter' => $startCounter] = self::stripCopySuffix($sourceName);

        // Reserve room for the longest suffix we might append ("_copy_9999").
        $reserve = 10;
        $base = mb_substr($base, 0, max(1, $maxLen - $reserve));

        // First-time clones try plain "_copy"; reclones jump straight to the
        // numbered variant so we never end up with "<x>_copy_copy".
        if ($startCounter === null) {
            $first = $base . '_copy';
            if (!$exists($first)) {
                return $first;
            }
            $startCounter = 1;
        }

        for ($i = $startCounter; $i <= 9999; $i++) {
            $candidate = $base . '_copy_' . $i;
            if (!$exists($candidate)) {
                return $candidate;
            }
        }

        // Pathological: caller has 9999+ clones already. Fall back to a
        // time-suffixed name so the insert still succeeds.
        return $base . '_copy_' . time();
    }

    /**
     * Detect whether $name already ends in "_copy" or "_copy_<digits>" and
     * return the underlying base plus the counter we should resume from.
     *
     *  - "x"          → base="x",  startCounter=null  (try "_copy" first)
     *  - "x_copy"     → base="x",  startCounter=1
     *  - "x_copy_3"   → base="x",  startCounter=4
     *  - "x_v2"       → base="x_v2", startCounter=null
     *
     * Manual character walking instead of regex to match the project's no-regex
     * preference for non-trivial parsing — and because PCRE on multi-byte names
     * has historically been a source of subtle off-by-ones here.
     *
     * @return array{base: string, startCounter: int|null}
     */
    private static function stripCopySuffix(string $name): array
    {
        $name = trim($name);

        // Walk back over any trailing digits.
        $len = strlen($name);
        $i = $len;
        while ($i > 0 && $name[$i - 1] >= '0' && $name[$i - 1] <= '9') {
            $i--;
        }

        // Pattern "_copy_<digits>": the digits we just walked must be
        // preceded by literal "_copy_".
        if ($i < $len) {
            $beforeDigits = substr($name, 0, $i);
            if (str_ends_with($beforeDigits, '_copy_')) {
                $digits = (int) substr($name, $i);
                $base = substr($beforeDigits, 0, -strlen('_copy_'));
                return ['base' => $base, 'startCounter' => $digits + 1];
            }
        }

        // Pattern "_copy" (no number).
        if (str_ends_with($name, '_copy')) {
            $base = substr($name, 0, -strlen('_copy'));
            return ['base' => $base, 'startCounter' => 1];
        }

        return ['base' => $name, 'startCounter' => null];
    }
}
