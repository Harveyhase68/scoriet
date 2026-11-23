// Real(er) SML syntax validation - 2026-09-06 follow-up to item g ("das ist
// korrekt, da müssten wir zuerst einen SML Parser bauen und dann können wir
// auch falsch geschriebene Befehle korrigieren").
//
// The previous linter (still in smlLanguage.ts, see smlLinter's own doc
// comment) only checked bracket balance and unterminated strings - genuinely
// useful, but it cannot catch a misspelled STATEMENT keyword (`whille true
// {}`) or a misspelled STANDARD-LIBRARY function (`str.lfet(...)`), which is
// what "falsch geschriebene Befehle" actually means.
//
// This is deliberately a PORT of sml_to_dart.js's own real statement
// classifier (`translateStatements`/`translateBlockHeader`/the structural
// brace/paren scanner), not a second, independently-invented notion of
// "valid SML" - the translator IS the ground truth for what SML this
// project actually understands (anything it can't classify becomes a `//
// TODO: unrecognised SML statement` comment in the generated Dart), so
// reusing its exact same classification rules here means the editor's
// linter can never disagree with what generation actually does. Keep both
// in sync if sml_to_dart.js's own grammar ever changes - cross-references
// are called out throughout.
//
// Three independent checks, all non-blocking (see smlLanguage.ts's own doc
// comment on why @codemirror/lint's diagnostics are underline-only):
//  1. Statement/block STRUCTURE - is this line one of the recognised SML
//     statement forms, and (for a block keyword) does its own header match
//     the shape that keyword requires, and (for elseif/else/case/default/
//     catch/finally) is it actually nested inside the right kind of parent
//     block?
//  2. Namespaced CALLS (`ns.fn(...)`) - does `fn` actually exist in `ns`,
//     per the REAL, extracted registry in smlNamespaceRegistry.ts (see that
//     script's own header comment for why it's generated, not hand-typed).
//  3. A BARE call's own name (`inro("TEST")`) - see closestMatch()'s own
//     doc comment for why this is safe to check ONLY against the small,
//     closed BARE_BUILTINS list (never against arbitrary unknown bare
//     identifiers) - 2026-09-06 second follow-up: check 1 alone stops
//     flagging a misspelled bare builtin call the MOMENT its shape becomes
//     syntactically complete (`inro(` is "Unrecognised", but `inro("TEST")`
//     - end-to-end well-formed - satisfies the bare-call-statement shape
//     just fine, structurally). That's correct as far as check 1 goes -
//     the fix isn't to make check 1 stricter, it's this separate, semantic
//     check on top of it.
//
// Explicitly OUT OF SCOPE: validating an ARBITRARY bare call's own name
// (`MyProcedure(...)`) - unlike a namespaced call, a bare identifier that
// ISN'T suspiciously close to a known builtin could always be a legitimate
// project-defined local/global procedure this generic, project-agnostic
// editor component has no way to know about here; flagging every unknown
// one would produce constant false positives, which is exactly the "nervt
// unendlich" experience this whole feature exists to avoid. Also out of
// scope: expression-level grammar inside a condition/argument list - only
// the STATEMENT's own shape and call names (namespaced or bare-builtin-
// like) are checked.
import { SML_NAMESPACE_FUNCTIONS } from './smlNamespaceRegistry';
import { BARE_BUILTINS } from './smlVocabulary';

export interface SmlDiagnostic {
    from: number;
    to: number;
    severity: 'error' | 'warning';
    message: string;
}

// ===== Structural scanner - ported from sml_to_dart.js (see its own doc
// comments on BLOCK_KEYWORDS/structuralBraceDelta/parenBracketDelta/
// toLogicalLines/findBlockEnd for the authoritative version) =====

const BLOCK_KEYWORDS = new Set([
    'if', 'elseif', 'else', 'switch', 'case', 'default',
    'for', 'foreach', 'while', 'loop', 'try', 'catch', 'finally',
]);

function structuralBraceDelta(line: string): number {
    let delta = 0;
    let inString = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inString) {
            if (ch === '\\') { i++; continue; }
            if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') { inString = true; continue; }
        if (ch === '/' && line[i + 1] === '/') break;
        if (ch === '{') delta++;
        else if (ch === '}') delta--;
    }
    return delta;
}

function parenBracketDelta(line: string): number {
    let delta = 0;
    let inString = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inString) {
            if (ch === '\\') { i++; continue; }
            if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') { inString = true; continue; }
        if (ch === '/' && line[i + 1] === '/') break;
        if (ch === '(' || ch === '[') delta++;
        else if (ch === ')' || ch === ']') delta--;
    }
    return delta;
}

interface LogicalLine {
    // The full logical line's text - may be several physical lines joined
    // with '\n' when a statement wraps across lines inside an unclosed
    // (/[ (ADR-008, same as sml_to_dart.js's toLogicalLines()).
    text: string;
    // Absolute character offset of the FIRST character of this logical
    // line's first physical line, in the ORIGINAL source string - used to
    // anchor diagnostics.
    from: number;
    // True for a `raw ...`/`| ...` passthrough line - never structurally
    // validated (WLanguage/foreign source can contain anything).
    isRaw: boolean;
}

// Splits raw SML source into logical lines, mirroring sml_to_dart.js's
// toLogicalLines() exactly (including the `} elseif/else/catch/finally`
// same-line continuation split), but tracking each logical line's own
// absolute offset into `source` instead of building translated output.
function toLogicalLines(source: string): LogicalLine[] {
    const physical = source.split(/\r\n|\r|\n/);
    // Absolute start offset of each physical line - computed once up
    // front so later offset lookups are O(1).
    const lineStarts: number[] = [];
    {
        let pos = 0;
        for (const p of physical) {
            lineStarts.push(pos);
            pos += p.length + 1; // +1 for the newline this split() consumed
        }
    }

    const logical: LogicalLine[] = [];
    let i = 0;
    let inRaw = false;

    while (i < physical.length) {
        const line = physical[i];
        const trimmed = line.trim();
        const startOffset = lineStarts[i];

        if (inRaw) {
            if (trimmed.startsWith('|')) {
                logical.push({ text: line, from: startOffset, isRaw: true });
                i++;
                continue;
            }
            inRaw = false;
        }

        const firstWord = trimmed.split(/[\s(]/)[0];
        if (firstWord === 'raw') {
            logical.push({ text: line, from: startOffset, isRaw: true });
            inRaw = true;
            i++;
            continue;
        }

        if (trimmed === '' || trimmed.startsWith('//')) {
            logical.push({ text: line, from: startOffset, isRaw: false });
            i++;
            continue;
        }

        let joined = line;
        let depth = parenBracketDelta(line);
        while (depth > 0 && i + 1 < physical.length) {
            i++;
            joined += '\n' + physical[i];
            depth += parenBracketDelta(physical[i]);
        }

        const continuationMatch = /^(\s*)\}\s*(elseif|else|catch|finally)\b(.*)$/.exec(joined);
        if (continuationMatch && !joined.includes('\n')) {
            logical.push({ text: '}', from: startOffset, isRaw: false });
            logical.push({ text: continuationMatch[1] + continuationMatch[2] + continuationMatch[3], from: startOffset, isRaw: false });
        } else {
            logical.push({ text: joined, from: startOffset, isRaw: false });
        }
        i++;
    }

    return logical;
}

function findBlockEnd(lines: LogicalLine[], openIndex: number): number {
    let depth = 0;
    for (let i = openIndex; i < lines.length; i++) {
        if (lines[i].isRaw) continue;
        depth += structuralBraceDelta(lines[i].text);
        if (depth === 0) return i;
    }
    return lines.length - 1;
}

// Mirrors sml_to_dart.js's own bare-call-statement detection exactly: an
// identifier (optionally dotted) immediately followed by `(`, whose
// matching `)` is the last character of the line.
const BARE_CALL_RE = /^[A-Za-z_À-ɏ][A-Za-z0-9_.À-ɏ]*\s*\(/;

function findMatchingParen(text: string, openIndex: number): number {
    let depth = 0;
    let inString = false;
    for (let i = openIndex; i < text.length; i++) {
        const ch = text[i];
        if (inString) {
            if (ch === '\\') { i++; continue; }
            if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') { inString = true; continue; }
        if (ch === '(') depth++;
        else if (ch === ')') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

// Mirrors sml_to_dart.js's findTopLevelEquals(): the index of a genuine
// top-level assignment `=` (never `==`/`!=`/`<=`/`>=`, never inside a
// string/parens/brackets), or -1.
function findTopLevelEquals(s: string): number {
    let depth = 0;
    let inString = false;
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (inString) {
            if (ch === '\\') { i++; continue; }
            if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') { inString = true; continue; }
        if (ch === '(' || ch === '[') { depth++; continue; }
        if (ch === ')' || ch === ']') { depth--; continue; }
        if (depth > 0) continue;
        if (ch === '=' ) {
            const prev = s[i - 1];
            const next = s[i + 1];
            if (prev === '=' || prev === '!' || prev === '<' || prev === '>' || next === '=') continue;
            return i;
        }
    }
    return -1;
}

// Splits a trimmed line into { code, comment } at the first `//` outside a
// string - mirrors sml_to_dart.js's splitTrailingComment().
function splitTrailingComment(line: string): string {
    let inString = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inString) {
            if (ch === '\\') { i++; continue; }
            if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') { inString = true; continue; }
        if (ch === '/' && line[i + 1] === '/') return line.slice(0, i).trim();
    }
    return line;
}

// Validates one block header against the EXACT shape
// sml_to_dart.js's translateBlockHeader() requires for that keyword -
// returns an error message, or null if the header is well-formed.
function validateBlockHeader(trimmed: string, keyword: string): string | null {
    const header = trimmed.endsWith('{') ? trimmed.slice(0, -1).trim() : trimmed;
    const rest = header.slice(keyword.length).trim();

    switch (keyword) {
        case 'if':
        case 'elseif':
        case 'while':
            return rest ? null : `"${keyword}" needs a condition`;
        case 'switch':
            return rest ? null : '"switch" needs an expression';
        case 'else':
        case 'loop':
        case 'try':
        case 'finally':
        case 'default':
            // These take no argument at all - real SML always spells them
            // bare (see translateBlockHeader's own 'else'/'loop'/'try'/
            // 'finally'/'default' cases, none of which read `rest`).
            return rest ? `"${keyword}" doesn't take an argument` : null;
        case 'catch':
            // Optional error-variable name, or bare `catch` - both real
            // (translateBlockHeader defaults to `catch (_)` when empty).
            return null;
        case 'case':
            return rest ? null : '"case" needs at least one value';
        case 'foreach':
            return /^(\w+)\s+in\s+(.+)$/.test(rest) ? null : 'malformed "foreach" - expected: foreach <name> in <expression>';
        case 'for':
            return /^(\w+)\s*=\s*(.+?)\s+to\s+(.+?)(?:\s+step\s+(.+))?$/.test(rest)
                ? null
                : 'malformed "for" - expected: for <name> = <start> to <end> [step <n>]';
        default:
            return null;
    }
}

// Finds every `namespace.function(` call site in `text` (string/comment-
// aware, mirroring smlLanguage.ts's own scanSmlIdentifiers) and returns
// its namespace, function name, and the OFFSET (within `text`) of the
// function-name token - used by validateNamespacedCalls below.
function findNamespacedCalls(text: string): { ns: string; fn: string; fnFrom: number; fnTo: number }[] {
    const results: { ns: string; fn: string; fnFrom: number; fnTo: number }[] = [];
    let i = 0;
    const n = text.length;
    let lastIdent: { from: number; to: number; text: string } | null = null;
    while (i < n) {
        const ch = text[i];
        if (ch === '/' && text[i + 1] === '/') break;
        if (ch === '"') {
            i++;
            let escaped = false;
            while (i < n) {
                const c = text[i]; i++;
                if (c === '"' && !escaped) break;
                escaped = !escaped && c === '\\';
            }
            lastIdent = null;
            continue;
        }
        if (/[A-Za-z_]/.test(ch)) {
            let j = i + 1;
            while (j < n && /[A-Za-z0-9_]/.test(text[j])) j++;
            const ident = { from: i, to: j, text: text.slice(i, j) };
            // `ns.fn(` - the PREVIOUS identifier, a literal `.`, and this
            // one immediately followed (whitespace allowed) by `(`.
            if (lastIdent && text.slice(lastIdent.to, i).replace(/\s/g, '') === '.') {
                let k = j;
                while (k < n && text[k] === ' ') k++;
                if (text[k] === '(') {
                    results.push({ ns: lastIdent.text, fn: ident.text, fnFrom: ident.from, fnTo: ident.to });
                }
            }
            lastIdent = ident;
            i = j;
            continue;
        }
        if (ch !== '.' && ch !== ' ') lastIdent = null;
        i++;
    }
    return results;
}

// Optimal-string-alignment edit distance (insert/delete/substitute, cost 1
// each, PLUS a swap of two adjacent characters also costing 1) - plain
// Levenshtein (substitute-only) treats the single most common real-world
// typo, an adjacent transposition ("opne" for "open", "lfet" for "left"),
// as TWO edits, not one, which pushed it right past a threshold tight
// enough to stay safe against unrelated identifiers. Full space (not the
// 1-row-at-a-time optimisation plain Levenshtein could use) is trivial
// here - these are single-word identifiers, a handful of characters long.
function editDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const d: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            d[i][j] = Math.min(
                d[i - 1][j] + 1,
                d[i][j - 1] + 1,
                d[i - 1][j - 1] + cost,
            );
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
            }
        }
    }
    return d[m][n];
}

/**
 * The closest word in `candidates` to `word`, ONLY if it's suspiciously
 * close (never "the least-bad option among many bad ones") - this is what
 * makes it safe to run against a real user-typed identifier that is very
 * often something else entirely (a project-defined procedure name,
 * completely unrelated to any builtin): a real typo of a 4-8 character
 * builtin name is normally 1-2 characters off, while an unrelated
 * identifier's distance is typically close to its own length. The
 * threshold scales gently with length (a 3-character name allows 1 edit,
 * an 8+ character one allows up to 2) rather than a single fixed number,
 * and additionally requires the candidate not be wildly longer/shorter
 * than the match (a 3-character bare call should never "helpfully"
 * suggest an 11-character function name it happens to share a few letters
 * with).
 */
function closestMatch(word: string, candidates: string[]): string | null {
    let best: string | null = null;
    let bestDistance = Infinity;
    for (const candidate of candidates) {
        if (Math.abs(candidate.length - word.length) > 2) continue;
        const distance = editDistance(word, candidate);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = candidate;
        }
    }
    if (best === null) return null;
    const threshold = best.length <= 4 ? 1 : 2;
    return bestDistance > 0 && bestDistance <= threshold ? best : null;
}

/**
 * Validates every namespaced call (`ns.fn(...)`) in `source` against the
 * real, extracted function registry - flags `fn` when `ns` is a KNOWN
 * namespace with at least one known function (see
 * smlNamespaceRegistry.ts's own doc comment on why a namespace with ZERO
 * extracted functions is skipped entirely rather than flagging every call
 * into it). Suggests the closest REAL function in that same namespace when
 * one is suspiciously close (see closestMatch's own doc comment) - a
 * typo'd function name is only ever compared against the small, closed set
 * of functions THAT namespace actually has, never the full cross-namespace
 * list, so a suggestion is always at least a real, callable option.
 */
function validateNamespacedCalls(source: string): SmlDiagnostic[] {
    const diagnostics: SmlDiagnostic[] = [];
    for (const call of findNamespacedCalls(source)) {
        const known = SML_NAMESPACE_FUNCTIONS[call.ns];
        if (!known || known.size === 0) continue; // unimplemented namespace - see doc comment above
        const fnLower = call.fn.toLowerCase();
        if (known.has(fnLower)) continue;
        const suggestion = closestMatch(fnLower, [...known]);
        diagnostics.push({
            from: call.fnFrom,
            to: call.fnTo,
            severity: 'error',
            message: suggestion
                ? `Unknown function "${call.fn}" in namespace "${call.ns}" - did you mean "${suggestion}"?`
                : `Unknown function "${call.fn}" in namespace "${call.ns}"`,
        });
    }
    return diagnostics;
}

/**
 * Validates statement/block STRUCTURE - ports sml_to_dart.js's own
 * translateStatements() classification (see this file's own header
 * comment for why) into a validator instead of a Dart emitter. Flags:
 *  - a line that doesn't match ANY recognised SML statement form (the
 *    exact same fallback translateStatements() itself hits, there emitted
 *    as a `// TODO: unrecognised SML statement` comment instead of a
 *    diagnostic);
 *  - a block-keyword header whose own shape is malformed (`for`/`foreach`
 *    not matching their required pattern, `if`/`while`/`switch` with no
 *    condition, `else`/`loop`/`try`/`finally`/`default` given an argument
 *    they don't take);
 *  - `elseif`/`else`/`catch`/`finally`/`case`/`default` appearing where
 *    structurally impossible (not immediately following the right kind of
 *    parent block).
 */
function validateStructure(source: string): SmlDiagnostic[] {
    const diagnostics: SmlDiagnostic[] = [];
    const lines = toLogicalLines(source);

    // One frame per currently-open block, tracking what KIND of construct
    // it is so elseif/else/catch/finally/case/default can check they're
    // actually nested where they're allowed - `lastClosedKind` on each
    // frame records the kind of the immediately-preceding SIBLING block
    // that just closed at this same nesting level (so `elseif`/`else`
    // right after an `if` block's `}` is recognised as valid chaining,
    // and a stray `elseif` with no preceding `if` at all is not).
    interface Frame { kind: string; lastClosedKind: string | null }
    const stack: Frame[] = [{ kind: 'root', lastClosedKind: null }];

    function walk(start: number, end: number): void {
        let i = start;
        while (i < end) {
            const logical = lines[i];
            if (logical.isRaw) { i++; continue; }
            const rawTrimmed = logical.text.trim();
            // `logical.from` is the start of the whole PHYSICAL line,
            // including any leading indentation `.trim()` just stripped -
            // every diagnostic below anchors to `codeFrom` (the real start
            // of the code itself) instead, or its underline would sit
            // shifted left by the indentation width and land partly over
            // trailing whitespace from whatever precedes it.
            const codeFrom = logical.from + (logical.text.length - logical.text.trimStart().length);

            // A blank line, comment, or raw/todo passthrough never breaks an
            // elseif/else or catch/finally CHAIN - only an actual statement
            // in between does (matches how every C-like language/formatter
            // treats a comment between `}` and `elseif`/`catch`).
            if (rawTrimmed === '' || rawTrimmed.startsWith('//') || rawTrimmed.startsWith('|')) { i++; continue; }
            const firstWord = rawTrimmed.split(/[\s({]/)[0];
            if (firstWord === 'raw' || firstWord === 'todo') { i++; continue; }

            const parent = stack[stack.length - 1];
            const trimmed = splitTrailingComment(rawTrimmed);

            if (BLOCK_KEYWORDS.has(firstWord)) {
                if (firstWord === 'elseif' || firstWord === 'else') {
                    if (parent.lastClosedKind !== 'if' && parent.lastClosedKind !== 'elseif') {
                        diagnostics.push({
                            from: codeFrom,
                            to: codeFrom + rawTrimmed.length,
                            severity: 'error',
                            message: `"${firstWord}" without a preceding "if"`,
                        });
                    }
                } else if (firstWord === 'catch' || firstWord === 'finally') {
                    if (parent.lastClosedKind !== 'try' && parent.lastClosedKind !== 'catch') {
                        diagnostics.push({
                            from: codeFrom,
                            to: codeFrom + rawTrimmed.length,
                            severity: 'error',
                            message: `"${firstWord}" without a preceding "try"`,
                        });
                    }
                } else if (firstWord === 'case' || firstWord === 'default') {
                    if (parent.kind !== 'switch') {
                        diagnostics.push({
                            from: codeFrom,
                            to: codeFrom + rawTrimmed.length,
                            severity: 'error',
                            message: `"${firstWord}" outside a "switch"`,
                        });
                    }
                }

                const headerError = validateBlockHeader(trimmed, firstWord);
                if (headerError) {
                    diagnostics.push({
                        from: codeFrom,
                        to: codeFrom + rawTrimmed.length,
                        severity: 'error',
                        message: headerError,
                    });
                }

                const blockEnd = findBlockEnd(lines, i);
                stack.push({ kind: firstWord, lastClosedKind: null });
                walk(i + 1, blockEnd);
                stack.pop();
                // `case`/`default` don't chain via lastClosedKind (their own
                // validity check above is `parent.kind === 'switch'`
                // instead) - only if/elseif and try/catch ever consult this,
                // so only recording THOSE two families here would be an
                // equally correct, more minimal option; recording every
                // block kind is simpler and harmless since the two chain
                // checks above only ever compare against 'if'/'elseif' or
                // 'try'/'catch' specifically.
                parent.lastClosedKind = firstWord;
                i = blockEnd + 1;
                continue;
            }

            // Every OTHER recognised statement form (var/set/call/return/
            // break/continue/throw/bare-call/bare-assignment) - and the
            // unrecognised-statement fallback - is a real statement that
            // breaks any elseif/else or catch/finally chain in progress,
            // exactly like in Dart or any other C-like language: `if {}
            // doSomething(); elseif {}` is never valid just because a
            // comment or blank line would have been fine in the same spot.
            parent.lastClosedKind = null;

            if (['var', 'return', 'break', 'continue', 'throw', 'set', 'call'].includes(firstWord)) {
                i++;
                continue;
            }

            const bareCallMatch = BARE_CALL_RE.exec(trimmed);
            if (bareCallMatch && findMatchingParen(trimmed, bareCallMatch[0].length - 1) === trimmed.length - 1) {
                // Structurally this IS a valid call-statement - but a bare
                // (non-dotted) callee suspiciously close to a KNOWN builtin
                // (`inro(...)` vs `info`) is almost certainly that builtin
                // misspelled, not a coincidentally-similar procedure name -
                // see closestMatch()'s own doc comment on why this check
                // stays safe against real custom procedure names. This is
                // exactly the check that keeps "inro(...)" flagged even
                // once its shape is otherwise complete and well-formed,
                // where check 1 alone (this whole branch) would already
                // consider it recognised.
                const callee = bareCallMatch[0].slice(0, -1).trimEnd();
                if (!callee.includes('.')) {
                    const lower = callee.toLowerCase();
                    if (!BARE_BUILTINS.has(lower)) {
                        const suggestion = closestMatch(lower, [...BARE_BUILTINS]);
                        if (suggestion) {
                            diagnostics.push({
                                from: codeFrom,
                                to: codeFrom + callee.length,
                                severity: 'warning',
                                message: `Unknown function "${callee}" - did you mean "${suggestion}"?`,
                            });
                        }
                    }
                }
                i++;
                continue;
            }

            if (findTopLevelEquals(trimmed) !== -1) { i++; continue; }

            diagnostics.push({
                from: codeFrom,
                to: codeFrom + rawTrimmed.length,
                severity: 'warning',
                message: `Unrecognised SML statement: "${trimmed}"`,
            });
            i++;
        }
    }

    walk(0, lines.length);
    return diagnostics;
}

/**
 * Bracket-balance/unterminated-string check - unchanged from the previous
 * linter (see smlLanguage.ts's own former inline version, now delegated
 * to here so every check lives in one place).
 */
function validateBrackets(source: string): SmlDiagnostic[] {
    const diagnostics: SmlDiagnostic[] = [];
    const closingFor: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
    const closers = new Set(Object.values(closingFor));
    const stack: { ch: string; pos: number }[] = [];

    let lineStart = 0;
    for (const rawLine of source.split(/\r\n|\r|\n/)) {
        const text = rawLine;
        let i = 0;
        while (i < text.length) {
            const ch = text[i];
            if (ch === '/' && text[i + 1] === '/') break;
            if (ch === '"') {
                const start = i;
                i++;
                let escaped = false;
                let closed = false;
                while (i < text.length) {
                    const c = text[i]; i++;
                    if (c === '"' && !escaped) { closed = true; break; }
                    escaped = !escaped && c === '\\';
                }
                if (!closed) {
                    diagnostics.push({
                        from: lineStart + start,
                        to: lineStart + text.length,
                        severity: 'error',
                        message: 'Unterminated string literal (missing closing ")',
                    });
                }
                continue;
            }
            if (closingFor[ch]) {
                stack.push({ ch, pos: lineStart + i });
            } else if (closers.has(ch)) {
                const top = stack[stack.length - 1];
                if (!top || closingFor[top.ch] !== ch) {
                    diagnostics.push({
                        from: lineStart + i,
                        to: lineStart + i + 1,
                        severity: 'error',
                        message: top ? `Mismatched "${ch}" - expected "${closingFor[top.ch]}"` : `Unexpected "${ch}"`,
                    });
                    if (top) stack.pop();
                } else {
                    stack.pop();
                }
            }
            i++;
        }
        lineStart += rawLine.length + 1;
    }

    stack.forEach((open) => {
        diagnostics.push({
            from: open.pos,
            to: open.pos + 1,
            severity: 'error',
            message: `Unclosed "${open.ch}" - missing "${closingFor[open.ch]}"`,
        });
    });

    return diagnostics;
}

/**
 * Runs every check and returns their combined diagnostics - the single
 * entry point smlLanguage.ts's CodeMirror-facing linter calls.
 */
export function validateSml(source: string): SmlDiagnostic[] {
    return [
        ...validateBrackets(source),
        ...validateStructure(source),
        ...validateNamespacedCalls(source),
    ];
}
