// sml_to_dart.js — translates SML ("Scoriet Meta Language") statement/
// expression source into Dart source text.
//
// This file is NEVER part of the generated Flutter project — it is a
// GENERATOR-TIME helper, spliced via {:include:} into whichever {:code:}
// block needs to call translateSmlToDart(). {:include:} is a pure text
// splice that runs BEFORE the template engine compiles the surrounding
// {:code:}...{:codeend:} block into JS (see UltimateTemplateEngine.php /
// TemplateIncludeResolver.php), so this file's functions land in the same
// isolated Node process the block runs in - one canonical implementation,
// never duplicated by hand across template files.
//
// SCOPE: SML is already a normalised, target-neutral language by the time
// it reaches here (the WinDev->SML converter already resolved WinDev's `..`
// property sugar to plain ui.get/ui.set calls, `~=`/`~~` to str.equals_ci/
// str.equals_loose calls, and array indices to 0-based - see the SML spec's
// ADR-004/ADR-008). This translator's job is much narrower: SML's own
// statement/expression grammar -> idiomatic Dart text. It is a structural,
// line-oriented transpiler (matching SML's own "one statement per line,
// brace-delimited blocks" design), not a full expression-precedence parser -
// expressions are translated by substitution (operators/literals mostly
// pass through unchanged, dotted calls get namespace-mapped), never
// re-derived from scratch.
//
// NEVER GUESSED: anything this translator cannot confidently translate
// (a `raw` passthrough block, a call to a namespace function this file
// doesn't know about) becomes a clearly marked `// TODO:` Dart comment
// carrying the original SML text - never a fabricated or silently-wrong
// translation. This mirrors the same "never silently drop" rule already
// used throughout the SML import pipeline (see SmlEventImporter.php).

// ===========================================================================
// 1. Namespace -> Dart class mapping
// ===========================================================================
//
// Every SML namespace (see supported.md) maps to one static Dart class
// generated in lib/core/sml_runtime/lib_<namespace>.dart. `str.left(...)`
// becomes `SmlStr.left(...)`; `db.read_first(...)` becomes `SmlDb.readFirst(...)`.
// Namespaces marked WINDOW_SCOPED need a live SmlWindowContext (a control
// registry + BuildContext) instead of being plain static calls - see
// sml_window_context.dart. snake_case SML function names become camelCase
// Dart method names (WinDev/SML convention vs. Dart convention).

const SML_NAMESPACE_TO_DART_CLASS = {
    arr: 'SmlArr', crypt: 'SmlCrypt', db: 'SmlDb', dlg: 'SmlDlg', draw: 'SmlDraw',
    dt: 'SmlDt', file: 'SmlFile', ftp: 'SmlFtp', http: 'SmlHttp', json: 'SmlJson',
    log: 'SmlLog', num: 'SmlNum', rpt: 'SmlRpt', sock: 'SmlSock', sql: 'SmlSql',
    str: 'SmlStr', sys: 'SmlSys', timer: 'SmlTimer', ui: null, win: null,
    // Not in the original 20 (supported.md predates it) but real and
    // documented (07_REAL_PROJECT_FINDINGS.md): WinDev's embedded
    // multilingual string resources (`<§id¤lang¤text¤...¤>`) become
    // `i18n.text(id, lang1, text1, lang2, text2, ...)` / `i18n.resource(id)`.
    i18n: 'SmlI18n',
};

// ui/win/dlg/rpt/timer functions take an implicit SmlWindowContext (`ctx` in
// generated code - see sml_window_context.dart) rather than being static
// calls, because every one of their functions is tied to a live window (a
// control name and/or a BuildContext). `ui.get("EDT_Name","Value")` becomes
// `ctx.ui.get("EDT_Name","Value")`, `win.open("WIN_X")` becomes
// `ctx.win.open("WIN_X")`, etc.
const WINDOW_SCOPED_NAMESPACES = { ui: 'ui', win: 'win', dlg: 'dlg', rpt: 'rpt', timer: 'timer' };

// Functions whose Dart implementation genuinely awaits something (real I/O,
// a dialog waiting on the user, an OS window opening) - the translator
// prefixes `await ` at the call site and marks the containing Dart method
// `async`. Anything NOT in this list is treated as synchronous. This is a
// deliberately explicit, hand-maintained list (never guessed from the
// namespace alone - e.g. most `file.*`/`db.*` calls below are real but
// synchronous, using dart:io's sync API / the sqlite3 package's synchronous
// FFI binding respectively).
const ASYNC_FUNCTIONS = new Set([
    'http.request', 'http.send', 'http.send_form', 'http.create_form', 'http.add_file',
    'dlg.info', 'dlg.error', 'dlg.warning', 'dlg.confirm', 'dlg.yes_no', 'dlg.ok_cancel',
    'dlg.custom', 'dlg.toast',
    'win.open', 'win.open_child', 'win.open_sibling', 'win.close', 'win.end_program',
    'sys.load_setting', 'sys.save_setting', 'sys.delete_setting', 'sys.sleep', 'sys.yield', 'sys.run',
    'sys.open_with_default_app',
    'ftp.connect', 'ftp.download', 'ftp.upload', 'ftp.list', 'ftp.delete', 'ftp.rename', 'ftp.make_directory',
    'sock.connect', 'sock.listen', 'sock.accept',
    // `db.*`/`sql.*` - real network round-trips now that SmlDb connects to
    // the project's own configured database (MySQL, over mysql1 - see
    // lib_db.dart) rather than only a local synchronous SQLite file.
    // Deliberately NOT every db.* function - current/found/out_of_range/
    // record_number/reset/error_code/error_info/error_duplicate/
    // change_key/filter/clear_filter/cross stay plain, synchronous, pure
    // in-memory reads with no I/O of their own (see lib_db.dart).
    'db.connect', 'db.disconnect', 'db.read_first', 'db.read_last', 'db.read_next', 'db.read_previous',
    'db.read', 'db.seek', 'db.seek_first', 'db.seek_last', 'db.add', 'db.modify', 'db.delete',
    'db.record_count', 'db.begin', 'db.commit', 'db.rollback', 'db.version',
    'sql.execute', 'sql.execute_sql',
]);

function isKnownNamespace(ns) {
    return Object.prototype.hasOwnProperty.call(SML_NAMESPACE_TO_DART_CLASS, ns);
}

// `namespace.CONSTANT` bare-value idioms (never called with `(...)`) that
// map onto a real sml_constants.dart constant - see translateExpr()'s
// bare-identifier handling. `ui.SELF` is NOT here - it resolves dynamically
// per-snippet (env.selfControlName), not to one fixed Dart identifier.
const DOTTED_CONSTANT_MAP = {
    'ui.WINDOW': 'uiWindow',
    'str.EOT': 'strEot',
};

/**
 * Heuristic for "this bare identifier is an unmapped WinDev built-in
 * constant, not a variable/control/procedure" - see translateExpr()'s
 * bare-identifier fallback. This codebase's own real naming conventions
 * never produce a name matching this shape for anything else: locals are
 * Hungarian-notation lowercase-first (sName, gnPos), procedures are
 * PascalCase with no underscore (RADSave, CheckErrorLog), and every real
 * control/looper name is already resolved earlier via env.controlNames
 * before this check ever runs.
 */
const WINDEV_CONSTANT_RE = /^[A-Z][A-Za-z0-9]*(_[A-Za-z0-9]+)+$/;

/**
 * EVERY real top-level `const` sml_constants.dart declares - two separate
 * jobs share this one list, both because a name here is a real, already-
 * resolvable Dart identifier that must never be second-guessed elsewhere:
 *   1. The underscore-shaped ones (`HA_MD5_128`) must be exempted from the
 *      null/TODO fallback below (which would otherwise flatten ANY
 *      underscore-shaped bare name to `null`, real or not).
 *   2. ALL of them (including non-underscore-shaped ones like `Grayed`/
 *      `Active`/`White`) must be exempted from collectImplicitLocals()'s
 *      bare-read scan - confirmed a REAL, live bug this list fixes: before
 *      it existed, `Check_Verzeichnis()`'s own `Grayed`/`White` reads (both
 *      genuinely resolvable constants) were getting SHADOWED by a bogus
 *      `dynamic Grayed;`/`dynamic White;` local defaulting to `null` -
 *      compiling, but silently breaking the real constant lookup.
 *
 * MAINTENANCE: whenever a new constant is added to sml_constants.dart, add
 * its name here too - this is the EXACT same "two hand-maintained mappings
 * drift out of sync" trap already documented for processVariable() vs.
 * isKnownVariable() in UltimateTemplateController.php; there is no
 * mechanical link between the two files enforcing agreement.
 */
const KNOWN_BARE_CONSTANTS = new Set([
    'cryptNone', 'cryptFast', 'encodeBASE64', 'httpResult', 'uiWindow', 'strEot',
    'asLinear', 'psdMinified', 'Grayed', 'Active', 'errMessage', 'errFullDetails', 'errCode',
    'taCurrentSelection', 'taCurrentFirst', 'trtClick', 'trtChange', 'trtProcedure', 'inMemory',
    'HA_MD5_128', 'IgnoreCase',
    'Transparent', 'White', 'Black', 'LightGray', 'DarkGray', 'LightRed', 'DarkRed',
    'LightGreen', 'DarkGreen', 'LightBlue', 'DarkBlue', 'LightCyan', 'DarkCyan',
    'LightYellow', 'DarkYellow', 'YellowToolhelp', 'LightMagenta', 'DarkMagenta',
    'wlVariantArray', 'wlVariantObject', 'wlInt', 'wlInt_1', 'wlInt_2', 'wlInt_4', 'wlInt_8',
    'wlReal', 'wlBoolean', 'wlCurrency', 'wlNumeric', 'wlCharacter', 'wlDate', 'wlDateTime',
    'wlTime', 'wlSQLQuery', 'wlUUID', 'wlUUID_128', 'wlUUID_256', 'wlEmpty',
]);

// A handful of SML function names collide with a Dart reserved word once
// camelCased (`log.assert` -> `assert`, which cannot be a method name and
// would parse as the assert STATEMENT) - the runtime library spells these
// differently (see lib_log.dart's `assertLog`), so the translator must
// know to call THAT name instead of the mechanical camelCase one.
const DART_KEYWORD_OVERRIDES = { assert: 'assertLog', yield: 'yield_', rethrow: 'rethrow_' };

// snake_case -> camelCase, e.g. "read_first" -> "readFirst". SML function
// names are always snake_case (supported.md); this is a pure mechanical
// rename, never a semantic decision - except the reserved-word overrides above.
function toCamelCase(snake) {
    if (Object.prototype.hasOwnProperty.call(DART_KEYWORD_OVERRIDES, snake)) {
        return DART_KEYWORD_OVERRIDES[snake];
    }
    return snake.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

// ===========================================================================
// 2. Structural scanner - ports SmlEventImporter.php's proven brace/string/
//    comment/raw-line-aware algorithm to JS. Operates on a STATEMENT BODY
//    (the inside of one event/procedure), not a whole .sml file, so it never
//    needs to recognise unit/on/proc/globals/constants/struct headers -
//    only the block-opening control-flow keywords listed in BLOCK_KEYWORDS.
// ===========================================================================

const BLOCK_KEYWORDS = new Set(['if', 'elseif', 'else', 'switch', 'case', 'default', 'for', 'foreach', 'while', 'loop', 'try', 'catch', 'finally']);

/**
 * Net {}-delta for one line, ignoring braces inside double-quoted strings
 * (backslash-escape aware) and `//` line comments - identical rules to
 * SmlEventImporter::structuralBraceDelta(), reimplemented here since this
 * runs inside the Node generation step, not the PHP import step.
 */
function structuralBraceDelta(line) {
    let delta = 0;
    let inString = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inString) {
            if (ch === '\\') { i++; continue; }
            if (ch === '"') { inString = false; }
            continue;
        }
        if (ch === '"') { inString = true; continue; }
        if (ch === '/' && line[i + 1] === '/') { break; }
        if (ch === '{') { delta++; }
        else if (ch === '}') { delta--; }
    }
    return delta;
}

/**
 * Splits raw SML source into LOGICAL lines: physical lines joined back
 * together whenever a statement wraps across lines with an unclosed `(`/`[`
 * (ADR-008 - "a newline ends a statement, except inside an unclosed ( or
 * ["), while leaving `raw ... | ...` passthrough lines completely alone
 * (never joined, never brace/paren-scanned - they can contain anything).
 * Blank lines and comments are preserved as their own logical lines so
 * translateStatements() can pass them through verbatim.
 */
function toLogicalLines(smlCode) {
    const physical = smlCode.split(/\r\n|\r|\n/);
    const logical = [];
    let i = 0;
    let inRaw = false;

    while (i < physical.length) {
        const line = physical[i];
        const trimmed = line.trim();

        if (inRaw) {
            if (trimmed.startsWith('|')) {
                logical.push(line);
                i++;
                continue;
            }
            inRaw = false; // fall through - this line is processed normally below
        }

        const firstWord = trimmed.split(/[\s(]/)[0];
        if (firstWord === 'raw') {
            logical.push(line);
            inRaw = true;
            i++;
            continue;
        }

        if (trimmed === '' || trimmed.startsWith('//')) {
            logical.push(line);
            i++;
            continue;
        }

        // Join continuation lines while an unclosed (/[ remains open, same
        // string/comment-aware scanning as structuralBraceDelta() but
        // tracking ()/[] depth instead of {}.
        let joined = line;
        let depth = parenBracketDelta(line);
        while (depth > 0 && i + 1 < physical.length) {
            i++;
            joined += '\n' + physical[i];
            depth += parenBracketDelta(physical[i]);
        }

        // `} elseif cond {` / `} else {` / `} catch name {` / `} finally {`
        // close the PREVIOUS block and open a SIBLING one on the very same
        // line (confirmed real SML formatting - see real-corpus grep of
        // `} else {`/`} elseif ... {`). Net brace delta is 0, which would
        // otherwise make findBlockEnd() think the previous block is still
        // open and fold the new block's body straight into it. Splitting
        // into two logical lines (a bare `}` and the continuation header)
        // makes every later pass treat this exactly like any other
        // close-then-open boundary.
        const continuationMatch = /^(\s*)\}\s*(elseif|else|catch|finally)\b(.*)$/.exec(joined);
        if (continuationMatch && !joined.includes('\n')) {
            logical.push('}');
            logical.push(continuationMatch[1] + continuationMatch[2] + continuationMatch[3]);
        } else {
            logical.push(joined);
        }
        i++;
    }

    return logical;
}

function parenBracketDelta(line) {
    let delta = 0;
    let inString = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inString) {
            if (ch === '\\') { i++; continue; }
            if (ch === '"') { inString = false; }
            continue;
        }
        if (ch === '"') { inString = true; continue; }
        if (ch === '/' && line[i + 1] === '/') { break; }
        if (ch === '(' || ch === '[') { delta++; }
        else if (ch === ')' || ch === ']') { delta--; }
    }
    return delta;
}

/**
 * Finds the logical-line index of the `}` that closes the block opened by
 * logicalLines[openIndex] (whose own structural delta is +1), scanning
 * forward with the same brace-depth counting SmlEventImporter.php uses for
 * import. Never miscounts a brace inside a string/comment/raw line, for the
 * same reason ADR-008 exists (real customer SML/WLanguage-derived text can
 * contain literal braces in a raw passthrough).
 */
function findBlockEnd(logicalLines, openIndex) {
    let depth = 0;
    for (let i = openIndex; i < logicalLines.length; i++) {
        const line = logicalLines[i];
        if (line.trim().startsWith('|')) { continue; } // raw passthrough content
        depth += structuralBraceDelta(line);
        if (depth === 0) { return i; }
    }
    return logicalLines.length - 1; // malformed input - never loop forever
}

// ===========================================================================
// 3. Async-call detection (see ASYNC_FUNCTIONS above) + transitive
//    propagation across local/global procedure calls, computed once from
//    the full gtree (every {:code:} invocation gets the WHOLE gtree, not
//    just the current window - see UltimateTemplateController::
//    executeJavaScript()) so a procedure that calls another async procedure
//    is correctly marked async too, not just direct library calls.
// ===========================================================================

/**
 * Does this SML code directly call a known-async namespace function?
 * Plain substring scan (namespace.function), same style as
 * UltimateTemplateController::requiredSmlLibraries() on the PHP side -
 * good enough since SML function names never legitimately appear as a
 * substring of an unrelated identifier (they're always namespace-qualified).
 */
// Bare `Info(...)` (see translateExpr's own 'info' bare-call bridge, which
// delegates to the SAME `dlg.info` that's in ASYNC_FUNCTIONS below) used as
// a standalone WinDev-spelled call - confirmed real from a hand-written
// test window. The plain dotted-substring scan below can never see this
// (the raw SML text never contains "dlg." for it), so it needs its own
// check. The negative lookbehind excludes a real `dlg.info(` (already
// caught by the dotted scan) and a longer identifier merely containing
// "info(" (e.g. a hypothetical `myinfo(`) - only a truly BARE `info(` call
// counts.
const BARE_INFO_ASYNC_RE = /(?<![.\w])info\s*\(/i;

// Same reasoning/shape as BARE_INFO_ASYNC_RE above, for translateExpr's
// 'open'/'openchild' bare-call bridges (-> win.open/win.open_child, both in
// ASYNC_FUNCTIONS) - confirmed real (`Open("win_test")`). Any FUTURE bare
// builtin that bridges to an ASYNC_FUNCTIONS entry needs the identical
// treatment here, or a procedure using ONLY that bare spelling (nothing
// else needing async) gets generated as non-`async` while its own
// translated body still contains a real `await` - a genuine compile error,
// not just a style nit.
const BARE_OPEN_ASYNC_RE = /(?<![.\w])open\s*\(/i;
const BARE_OPENCHILD_ASYNC_RE = /(?<![.\w])openchild\s*\(/i;

function directlyCallsAsyncFunction(code) {
    if (!code) return false;
    if (BARE_INFO_ASYNC_RE.test(code)) { return true; }
    if (BARE_OPEN_ASYNC_RE.test(code)) { return true; }
    if (BARE_OPENCHILD_ASYNC_RE.test(code)) { return true; }
    for (const fn of ASYNC_FUNCTIONS) {
        if (code.includes(fn + '(')) { return true; }
    }
    return false;
}

/**
 * Bare (non-namespaced) call targets found in this code - candidates for
 * "calls a local/global procedure", used by the async fixed-point below.
 * A namespaced call (contains '.') is never a candidate; a bare call is
 * always either a project-defined procedure or an as-yet-unmapped WinDev
 * builtin (supported.md: "A WinDev name the registry does not know is not
 * an error - it stays a bare call"), and this scan does not need to tell
 * the two apart - the fixed point below only ever matches names that are
 * ACTUAL known procedures.
 */
function bareCallTargets(code) {
    const targets = new Set();
    const re = /\bcall\s+([A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*)\s*\(/g;
    let m;
    while ((m = re.exec(code)) !== null) {
        targets.add(m[1]);
    }
    return targets;
}

/**
 * Does this SML code directly call a window-scoped namespace function
 * (ui./win./dlg./rpt./timer.)? Same substring-scan style as
 * directlyCallsAsyncFunction() above - used by computeWindowContextMap()
 * below to decide which GLOBAL procedures need an explicit leading
 * `SmlWindowContext ctx` parameter (see WINDOW_SCOPED_NAMESPACES) - a
 * window's own LOCAL procedures never need this (they're State methods,
 * `ctx` is already in scope), so this is only ever consulted for
 * `globalprocedure.needs_window_context`, never `procedure.*`.
 */
const WINDOW_SCOPED_CALL_RE = /\b(ui|win|dlg|rpt|timer)\./;
function directlyUsesWindowScopedNamespace(code) {
    return !!code && WINDOW_SCOPED_CALL_RE.test(code);
}

/**
 * Builds { procedureName: flagValue } for every procedure the gtree knows
 * about (window-local + project-global) via fixed-point propagation: a
 * procedure gets the flag if its own body satisfies `directCheckFn`, OR it
 * calls another procedure that already has the flag. Bounded by the number
 * of procedures (a real call cycle can only take that many passes to
 * converge) so this can never loop forever even on malformed/cyclic input.
 * Shared by computeAsyncProcedureMap() (is this call chain async?) and
 * computeWindowContextMap() (does this call chain need a live window?) -
 * same propagation shape, different base-case check.
 */
/**
 * [windowIndex] scopes which WINDOW-LOCAL procedures are considered,
 * alongside every global procedure (project-wide, name genuinely unique,
 * always included regardless). Without this, a flat name-keyed flag/calls
 * map built from EVERY window's local procedures at once silently
 * COLLIDES: confirmed real and not rare - `RADDisplay`/`RADSave`/
 * `CheckModification`/... are the SAME RAD-generated procedure name
 * repeated once per table's own copy of the window (~50 real windows).
 * Whichever window's OWN same-named procedure happened to set the flag
 * `true` last (e.g. some OTHER window's RADDisplay genuinely calling
 * something async) would leak that `true` into EVERY OTHER window's
 * unrelated, purely-synchronous RADDisplay - the call site then emits
 * `await RADDisplay()` against a plain non-async `void RADDisplay() {...}`
 * declaration, a real "type of void" Dart compile error. A window-local
 * procedure can only ever be called from within its OWN window (WLanguage
 * has no cross-window local-procedure calls - same fact
 * inferMissingProcedureParams() already relies on), so restricting the
 * candidate set to (globals + THIS window's own) is both correct and
 * sufficient - no cross-window ambiguity is even possible to model.
 * `windowIndex` omitted/undefined (global procedures, project init) means
 * "globals only" - a global procedure can't call a window-local one either.
 */
function computeTransitiveProcedureFlag(gtree, directCheckFn, windowIndex) {
    const project = gtree[0].project[0];
    const procedures = [];
    (project.globalprocedures || []).forEach(p => procedures.push(p));
    if (windowIndex !== undefined && windowIndex !== null) {
        const window = (project.uiwindows || [])[windowIndex];
        (window && window.procedures || []).forEach(p => procedures.push(p));
    }

    const flag = {};
    const calls = {};
    for (const p of procedures) {
        flag[p.name] = directCheckFn(p.code);
        calls[p.name] = bareCallTargets(p.code || '');
    }

    let changed = true;
    let iterations = 0;
    while (changed && iterations <= procedures.length) {
        changed = false;
        iterations++;
        for (const p of procedures) {
            if (flag[p.name]) continue;
            for (const target of calls[p.name]) {
                if (flag[target]) {
                    flag[p.name] = true;
                    changed = true;
                    break;
                }
            }
        }
    }
    return flag;
}

function computeAsyncProcedureMap(gtree, windowIndex) {
    return computeTransitiveProcedureFlag(gtree, directlyCallsAsyncFunction, windowIndex);
}

function computeWindowContextMap(gtree, windowIndex) {
    return computeTransitiveProcedureFlag(gtree, directlyUsesWindowScopedNamespace, windowIndex);
}

// ===========================================================================
// 4. Expression translation
// ===========================================================================
//
// SML expressions are already C-family (see 02_SML_SPECIFICATION.md) -
// operators, string literals, numeric literals and parenthesisation all
// pass through unchanged. The only real work is finding and rewriting
// function calls: `ns.func(args)` -> `SmlNs.func(args)` (or
// `ctx.ns.func(args)` / `await ctx.ns.func(args)` for a window-scoped or
// async namespace), and a bare `LocalProc(args)` stays a plain Dart call
// (possibly `await`-ed, see the async map above) since a window's local
// procedures become State methods and global ones become top-level
// functions with the exact same name.
//
// This is a single left-to-right scan collecting an identifier followed by
// '(' as a call site, translating its argument list recursively (so nested
// calls translate correctly), and passing every other character through
// unchanged - not a full expression-precedence parser, because none is
// needed: operators/literals never need rewriting, only call sites do.

/**
 * Does `out` (everything translateExpr() has emitted SO FAR) end with a
 * string literal's closing `"` immediately followed by a top-level `+`
 * (ignoring whitespace)? Used to detect WinDev's implicit numeric-to-string
 * coercion in concatenation (`"prefix" + intValue`) - Dart's `String`
 * class only defines `+` for another `String`, so a bare numeric
 * identifier immediately after a string-literal `+` needs an explicit
 * `.toString()` the ORIGINAL WLanguage source never needed to write.
 * Deliberately narrow (a string LITERAL, not a string-typed VARIABLE - no
 * confirmed real case of the latter yet) so this can never misfire on
 * ordinary numeric arithmetic (`nA + nB`), which never has a literal
 * `"..."` immediately before the `+`.
 */
function isPrecededByStringConcat(out) {
    let end = out.length;
    while (end > 0 && out[end - 1] === ' ') { end--; }
    if (out[end - 1] !== '+') { return false; }
    end--;
    while (end > 0 && out[end - 1] === ' ') { end--; }
    return out[end - 1] === '"';
}

/** Same idea as isPrecededByStringConcat() but looking FORWARD - the
 * `intValue + "suffix"` half of the same real idiom. */
function isFollowedByStringConcat(expr, fromIndex) {
    let i = fromIndex;
    while (i < expr.length && expr[i] === ' ') { i++; }
    if (expr[i] !== '+') { return false; }
    i++;
    while (i < expr.length && expr[i] === ' ') { i++; }
    return expr[i] === '"';
}

function translateExpr(expr, env) {
    let out = '';
    let i = 0;
    const len = expr.length;

    while (i < len) {
        const ch = expr[i];

        if (ch === '"') {
            // String literal - SML's escapes (\\ \" \n \r \t \u{XXXX}) are
            // valid Dart double-quoted-string escapes too, so the content
            // passes through byte-for-byte, INCLUDING the surrounding
            // quotes - with one exception: a bare `$` (confirmed real -
            // `i18n.resource("$0000")`, a WinDev resource-ID literal) has no
            // special meaning in SML but starts string interpolation in
            // Dart, which fails to compile unless it's followed by an
            // identifier or `{...}`. Every unescaped `$` is rewritten to
            // `\$` here - already-escaped sequences (`\\`, `\"`, ...) are
            // copied through untouched by the `j += 2` skip below, so a
            // real `\$` some future SML source might contain is never
            // double-escaped.
            let j = i + 1;
            let literal = '"';
            while (j < len) {
                if (expr[j] === '\\') { literal += expr.slice(j, j + 2); j += 2; continue; }
                if (expr[j] === '"') { literal += '"'; j++; break; }
                if (expr[j] === '$') { literal += '\\$'; j++; continue; }
                literal += expr[j];
                j++;
            }
            out += literal;
            i = j;
            continue;
        }

        if (/[A-Za-z_À-ɏ]/.test(ch)) {
            let j = i;
            // À-ɏ (U+00C0-U+024F, Latin-1 Supplement + Latin Extended-A/B) -
            // confirmed real: `call Procédure()` in a French customer's real
            // SML (RAD-generated error-handling boilerplate, never actually
            // declared anywhere - see the bare-call "unmapped WinDev
            // function" fallback below). Without this, the scanner split
            // "Procédure" at the "é" into "Proc" (a separate, unrelated bare
            // identifier) + a raw copied "é" character + "dure(...)" (a
            // second, bogus call) - not a guess at what accented
            // identifiers COULD look like, a fix for one confirmed real
            // one. Never needs to become a legal DART identifier itself
            // (accented WLanguage names seen so far are ALWAYS references
            // to something never actually declared, so they always end up
            // in the anonymous TODO-closure fallback, which has no name
            // requirements at all) - only the SCANNING needs to treat the
            // whole word as one token.
            while (j < len && /[A-Za-z0-9_.À-ɏ]/.test(expr[j])) { j++; }
            const ident = expr.slice(i, j);

            // Is this identifier immediately followed by '(' (allowing
            // whitespace) -> it's a call site, not a bare value reference.
            let k = j;
            while (k < len && expr[k] === ' ') { k++; }
            const isCall = expr[k] === '(';

            if (isCall) {
                const argsEnd = findMatchingParen(expr, k);
                const rawArgs = expr.slice(k + 1, argsEnd);
                const translatedArgs = translateArgList(rawArgs, env);

                const dotIndex = ident.indexOf('.');
                if (dotIndex > 0) {
                    const ns = ident.slice(0, dotIndex);
                    const fnName = ident.slice(dotIndex + 1);
                    if (ns === 'timer' && fnName === 'start') {
                        out += translateTimerStart(rawArgs, env);
                    } else if (ns === 'arr' && fnName === 'find') {
                        out += translateArrFind(rawArgs, env) || translateNamespacedCall(ns, fnName, translatedArgs);
                    } else if (ns === 'arr' && fnName === 'add') {
                        out += translateArrAdd(rawArgs, env) || translateNamespacedCall(ns, fnName, translatedArgs);
                    } else {
                        out += translateNamespacedCall(ns, fnName, translatedArgs);
                    }
                } else if (ident.toLowerCase() === 'message') {
                    // `Message(text)` - WinDev's bare (non-namespaced)
                    // STATUS BAR output, confirmed real (`call message
                    // ("Einstellungen ok!")`, `call Message("Einstellungen
                    // fehlerhaft = ROT!")`) - and confirmed DISTINCT from
                    // `Info()`/`dlg.info` (an earlier round of this same
                    // translator wrongly treated the two as equivalent):
                    // `Message()` writes text into the window's own status
                    // bar, it never pops up a dialog. Maps to
                    // [SmlWindowContext.message] - a plain synchronous call
                    // (no `await` - updating a `ValueNotifier` has no
                    // dialog to wait on). Like `Info`/`Error`/`Warning`/
                    // `YesNo`/`OkCancel`, this really belongs normalised to
                    // a real SML namespace (`win.message`?) by the WinDev->
                    // SML converter's own mapping table rather than special-
                    // cased here bare - handled here as an immediate,
                    // working bridge so already-imported SML works today.
                    out += `ctx.message(${translatedArgs})`;
                } else if (ident.toLowerCase() === 'progressbar') {
                    // `ProgressBar(nCurrent, nMax, sCaption, color)` -
                    // WinDev's bare (non-namespaced) status-bar mini
                    // progress indicator, confirmed real (`call ProgressBar
                    // (100, 100, "Ja wir sind wirklich fertig!",
                    // LightGreen)`) - same non-modal status bar family as
                    // `Message()` right above (this ALSO sets the shown
                    // caption text, plus a fill fraction and colour drawn
                    // to its left - see SmlWindowContext.progressBar's own
                    // doc comment). Same "bare builtin, not yet normalised
                    // by the WinDev->SML converter's own mapping table"
                    // situation as Message() - handled here as an
                    // immediate, working bridge.
                    out += `ctx.progressBar(${translatedArgs})`;
                } else if (ident.toLowerCase() === 'iniread') {
                    // `INIRead(section, key, [default], [iniFile])` -
                    // WinDev's bare (non-namespaced) real .ini-file reader,
                    // confirmed real (`INIRead("Einstellungen",
                    // "DB_ServerIP", "", gsIni)` - argument order verified
                    // against that exact call: section, key, default,
                    // filename). Maps DIRECTLY to the static [SmlIni.read] -
                    // NOT `ctx.iniRead(...)` (an earlier round routed it
                    // through `ctx` purely to match Message()/ProgressBar()'s
                    // shape, but confirmed a real bug: PROJECT-level code
                    // (init/globals-init in main.dart, global procedures)
                    // has no `ctx`/live window at all, and INIRead/INIWrite
                    // are genuinely pure/stateless - they never needed one).
                    out += `SmlIni.read(${translatedArgs})`;
                } else if (ident.toLowerCase() === 'iniwrite') {
                    // `INIWrite(section, key, value, [iniFile])` - same
                    // argument order/bridge situation as `INIRead` above,
                    // confirmed real (`INIWrite("Einstellungen",
                    // "DB_ServerIP", "localhost:4900", gsIni)`). Maps
                    // directly to the static [SmlIni.write] - see INIRead's
                    // own comment above for why not `ctx.iniWrite(...)`.
                    out += `SmlIni.write(${translatedArgs})`;
                } else if (ident.toLowerCase() === 'val') {
                    // `Val(s)` - WinDev's own real (non-namespaced) string-
                    // to-number conversion, confirmed real
                    // (`Val(INIRead("Einstellungen", "DB_CS", "", gsIni))`
                    // assigned to an int-typed global). Delegates to the
                    // SAME `num.parse` a real SML `num.parse(...)` call
                    // would (SmlNum.parse returns `num`), so the EXISTING
                    // num->int/double narrowing cast in translateSet()
                    // (`.toInt()`/`.toDouble()` appended when the assignment
                    // target is int/double-typed) applies automatically -
                    // exactly the same "delegate to the real namespaced
                    // implementation, don't hand-roll" approach as `info`
                    // below. requiredSmlLibraries() (PHP) has a matching
                    // textual check that forces 'num' into a window's/
                    // project's required libraries whenever a bare `Val(`
                    // appears, since this rewrite happens AFTER that PHP-side
                    // scan already ran on the raw (still `Val`-spelled) SML
                    // text - keep both in sync if this ever changes.
                    out += translateNamespacedCall('num', 'parse', translatedArgs);
                } else if (ident.toLowerCase() === 'info') {
                    // `Info(text, ...)` - WinDev's own real (non-namespaced)
                    // name for the modal "OK" dialog, confirmed real from a
                    // hand-written test window (`info("Vielen Dank fürs
                    // clicken!")`) that used the bare WinDev spelling
                    // instead of this codebase's own `dlg.info` SML
                    // convention. Delegates to the SAME translateNamespacedCall
                    // a real `dlg.info(...)` call goes through - not a
                    // hand-rolled `ctx.dlg.info(...)` string - so `await`
                    // and every other namespaced-call detail (ASYNC_FUNCTIONS,
                    // camelCasing, ...) stays in exactly one place.
                    out += translateNamespacedCall('dlg', 'info', translatedArgs);
                } else if (ident.toLowerCase() === 'open') {
                    // `Open(windowName, ...)` - WinDev's own bare name for
                    // opening a window, confirmed real (`Open("win_test")`).
                    // Delegates to `win.open` - see SmlWinContext.open()'s
                    // own doc comment for the current, deliberate scope
                    // limit: it opens the window (a real, separate,
                    // independent OS window via desktop_multi_window) but
                    // does NOT yet block the caller until the opened window
                    // closes the way a true WinDev modal `Open()` would -
                    // that needs a cross-window "I closed" signal that
                    // doesn't exist yet (a real, larger follow-up, not
                    // something to fake here).
                    out += translateNamespacedCall('win', 'open', translatedArgs);
                } else if (ident.toLowerCase() === 'openchild') {
                    // `OpenChild(windowName, ...)` - WinDev's own bare name
                    // for opening an independent, equal-standing window
                    // (confirmed real, same shape as `Open` above).
                    // Delegates to `win.open_child`.
                    out += translateNamespacedCall('win', 'open_child', translatedArgs);
                } else {
                    // Bare call: a project-defined local/global procedure
                    // (or an as-yet-unmapped WinDev builtin passed through
                    // verbatim - supported.md's own documented behaviour). A
                    // GLOBAL procedure that needs a live window (env.ctxMap -
                    // see computeWindowContextMap()) takes `ctx` as its own
                    // leading Dart parameter (see global_procedures.dart) -
                    // every call site prepends the CALLER's own `ctx`, which
                    // is always in scope here: a window event/local
                    // procedure has it as a State field, and another
                    // ctx-needing global procedure has it as ITS OWN
                    // parameter (same transitive propagation as async).
                    // Gated on env.globalProcedureNames too - a WINDOW-LOCAL
                    // procedure is a State method with `ctx` already
                    // accessible by name, so it NEVER takes an explicit ctx
                    // parameter (see %1_page.dart's procedure loop) even
                    // though computeWindowContextMap() computes the same
                    // flag for it - without this gate, calling a local
                    // procedure like `RADSave()` would wrongly become
                    // `RADSave(ctx)`, an argument-count mismatch.
                    // Case-insensitive procedure lookup FIRST (env.
                    // procedureNameMap - same WLanguage case-insensitivity
                    // already applied to controls/globals, confirmed real
                    // here too: `call display()` naming a window's own real
                    // `Display` procedure). Resolving to the CANONICAL name
                    // before the async/ctx map lookups matters - those maps
                    // are keyed by the procedure's real declared casing.
                    const resolvedIdent = (env.procedureNameMap && env.procedureNameMap.get(ident.toLowerCase())) || ident;
                    const isKnownProcedure = env.asyncMap && Object.prototype.hasOwnProperty.call(env.asyncMap, resolvedIdent);

                    if (isKnownProcedure) {
                        const needsAwait = env.asyncMap[resolvedIdent];
                        const needsCtx = env.ctxMap && env.ctxMap[resolvedIdent]
                            && env.globalProcedureNames && env.globalProcedureNames.has(resolvedIdent);
                        const finalArgs = needsCtx
                            ? (translatedArgs ? 'ctx, ' + translatedArgs : 'ctx')
                            : translatedArgs;
                        out += (needsAwait ? 'await ' : '') + resolvedIdent + '(' + finalArgs + ')';
                    } else {
                        // Neither a local nor a global SML procedure this
                        // project defines (case-insensitively) - either an
                        // as-yet-unmapped WinDev builtin (`StringToHex`), or
                        // - confirmed real - a procedure the ORIGINAL WinDev
                        // project itself never implemented for this specific
                        // window (`RADCheckValues` called from a window that
                        // has no RADCheckValues of its own - other windows
                        // do; genuinely absent, not a translation bug).
                        // Never guessed and never left as a raw call to an
                        // undefined name (a hard compile error) - an
                        // immediately-invoked closure that does nothing and
                        // evaluates to `null` compiles in EVERY expression
                        // context (a bare statement, an assignment RHS, a
                        // condition, ...) while staying clearly flagged for
                        // whoever investigates next. Original arguments are
                        // intentionally not evaluated - there is nothing
                        // real to pass them to.
                        // `as dynamic` - without it, Dart infers this
                        // closure's return type as the narrow `Null` (its
                        // only `return` statement returns the literal
                        // `null`), which breaks whenever the call result
                        // lands somewhere that type-checks against it - e.g.
                        // a `switch` statement over this value requires the
                        // Dart 3 compiler to exhaustively match `Null`
                        // (confirmed real: `switch (Input(...))` over an
                        // unmapped `Input()` builtin), and `stringVar +
                        // thisCall()` needs the RESULT to be `String`-
                        // assignable, not `Null` (confirmed real:
                        // `sResult + MakePHPAssociative(...)`). `dynamic`
                        // carries no such exhaustiveness/type requirement,
                        // matching every other "unmapped, compiles, inert
                        // until real" stub in this file. Wrapped in its OWN
                        // parens - `as` binds LOOSER than `+` in Dart (it
                        // sits at the same precedence level as `<`/`is`,
                        // below additive), so an unparenthesized `str + x()
                        // as dynamic` parses as `(str + x()) as dynamic` -
                        // the `+` is evaluated FIRST, against the closure's
                        // real `Null`-typed result, before the cast ever
                        // gets a chance to help. Parenthesizing forces the
                        // cast to bind to the closure call alone.
                        out += `((() { /* TODO: unmapped WinDev function '${ident}(${rawArgs})' */ return null; })() as dynamic)`;
                    }
                }
                i = argsEnd + 1;
                continue;
            }

            // Not a call.
            //
            // `ui.WINDOW`/`ui.SELF`/`str.EOT` - WLanguage self-reference/
            // constant idioms used as bare VALUES, not calls (confirmed
            // real and common: `ui.set(ui.WINDOW, "modified", false)` alone
            // appears 65 times in one real project - the standard "track
            // whether this modal window's record changed" idiom). These are
            // dotted, so they would otherwise fall straight through
            // unchanged to case 3 below and reference a non-existent `ui`/
            // `str` Dart identifier. `ui.WINDOW`/`str.EOT` map to real
            // sml_constants.dart constants (see DOTTED_CONSTANT_MAP); `ui.
            // SELF` is resolved HERE, at translate time, to the actual
            // control's own name as a quoted string literal - env.
            // selfControlName is only ever set when translating THAT
            // control's own event code (see attachDartTranslations()), so
            // there is never any ambiguity about which control "self" means.
            if (Object.prototype.hasOwnProperty.call(DOTTED_CONSTANT_MAP, ident)) {
                out += DOTTED_CONSTANT_MAP[ident];
                i = j;
                continue;
            }
            if (ident === 'ui.SELF') {
                out += JSON.stringify(env.selfControlName || '');
                i = j;
                continue;
            }

            const precededByDot = out.endsWith('.');

            // `ControlName.ColumnName` (a DOT, not a bracket index) -
            // WinDev's "current row, named column" idiom for a Table/Looper
            // control, distinct from `LooperName[i].SubControl` (a bracket -
            // a SPECIFIC row, not necessarily the selected one): confirmed
            // real - `nID = Table.cash_register` reads the CURRENTLY
            // SELECTED row's `cash_register` column value. `ident` already
            // includes the dot (the identifier scan above treats `.` as
            // part of one token), so this only ever fires for EXACTLY one
            // dot, with the part before it a known/WinDev-shaped control
            // name - anything else (a struct/local field access like
            // `vRecord.field`) has no such owner and falls through
            // unaffected. Resolves to the same `ctx.ui.row(...)[...]` map
            // slot as the bracket form, indexed by `ui.table_selected(name)`
            // (WinDev's own 1-based row-selection index, matching the `- 1`
            // every real bracket-indexed use already applies explicitly) -
            // needs no prior registration to compile, same as the bracket
            // form.
            const dotParts = ident.indexOf('.') > 0 && ident.indexOf('.') === ident.lastIndexOf('.')
                ? ident.split('.')
                : null;
            if (dotParts && !precededByDot) {
                const [ownerName, columnName] = dotParts;
                const ownerMatch = (env.controlNames && env.controlNames.get(ownerName.toLowerCase()))
                    || (WINDEV_CONSTANT_RE.test(ownerName) ? ownerName : null);
                if (ownerMatch) {
                    const ownerLit = JSON.stringify(ownerMatch);
                    out += `ctx.ui.row(${ownerLit}, ctx.ui.tableSelected(${ownerLit}) - 1)[${JSON.stringify(columnName)}]`;
                    i = j;
                    continue;
                }

                // `TableName.FieldName` - WinDev's HFSQL "current record"
                // implicit-binding sugar (see lib_db.dart's own long-
                // standing doc comment: "NOT YET MODELED ... until real
                // data exists") - confirmed real now: `accounts.acct_id`,
                // `companies.name`, etc, in every "Form" window of a real
                // project that displays/edits one linked data file (363
                // occurrences, one real project). Only matches when
                // `ownerName` is a REAL project table (env.tableNames,
                // case-insensitive) - anything else with exactly one dot
                // (a struct-typed local's own field, `vRecord.field`) has
                // no entry there and falls through unaffected. Resolves to
                // [SmlDb.current]'s already-existing map slot - a read-only
                // snapshot of whichever row read_first/read_next/read/
                // seek/... last positioned onto, exactly matching HFSQL's
                // own "current record" semantics. `?[...]` (not `[...]`)
                // because [current] returns null before any read has
                // happened yet - an honest null rather than a crash,
                // mirroring how a fresh HFSQL cursor with no current
                // record behaves in WinDev itself.
                const tableMatch = env.tableNames && env.tableNames.get(ownerName.toLowerCase());
                if (tableMatch) {
                    out += `SmlDb.current(${JSON.stringify(tableMatch)})?[${JSON.stringify(columnName)}]`;
                    i = j;
                    continue;
                }
            }

            // Not one of those either. Two remaining cases:
            //
            // 1. A BARE control name (no dot in `ident`, and not itself the
            //    property of a preceding `.` - i.e. `out` doesn't already
            //    end in '.', which would make this a record-field access
            //    instead, e.g. `vRecord[0].bluecode_merchantid`). WinDev's
            //    RAD-generated code freely reads/writes a control's default
            //    property by using its bare name as if it were a variable
            //    (`set EDT_IPURL = EDT_IPURL + "/"`,
            //    `str.right(EDT_IPURL, 1)`) - confirmed extremely common in
            //    the real corpus (RADSave/RADDisplay procedures assign
            //    dozens of controls this way). This is a READ (a WRITE, when
            //    this identifier is the lvalue of `set`, is intercepted
            //    earlier in translateSet() before reaching here) -> becomes
            //    `ctx.ui.get("Name", "Value")`. Only meaningful where `ctx`
            //    is in scope (window events, control/element events, local
            //    procedures - all generated as SmlWindowContext-owning State
            //    methods) - env.controlNames is empty for global procedures/
            //    project init, where this never fires (verified empty by
            //    scanning the real corpus - see attachDartTranslations()).
            //    Matched case-INsensitively (env.controlNames maps
            //    lowercase -> the control's real declared casing) - WLanguage
            //    identifiers are case-insensitive, and the real corpus
            //    confirms it: `Table`'s own click code refers back to itself
            //    as `TABLE`/`table` in different places.
            // 2. Same idea for a project global (also case-insensitive in
            //    the real corpus - `garrSubscriber` vs `garrsubscriber`) - a
            //    plain Dart static field, reachable from anywhere (unlike
            //    controls, never needs `ctx`).
            // 3. Anything else - a local variable, a record field access, or
            //    a project constant - all valid Dart identifiers as-is (SML
            //    already resolved WinDev's `..` sugar to explicit ui.get/
            //    ui.set calls for every case OTHER than this bare-name
            //    shorthand).
            const controlMatch = !precededByDot && ident.indexOf('.') === -1 && env.controlNames
                ? env.controlNames.get(ident.toLowerCase())
                : undefined;

            // Row-indexed Table/Looper access: `Name[indexExpr].Field` -
            // WinDev's standard idiom for one row's one field, confirmed
            // real for BOTH control kinds, but with TWO DIFFERENT meanings
            // that must not be confused:
            //   - `TableName[i].ColumnName` - plain ROW DATA (a Table has no
            //     row-template sub-controls in this data model) ->
            //     `ctx.ui.row(...)["Column"]`, a live, mutable map slot -
            //     composes correctly as both a read and a write (translateSet()'s
            //     generic lvalue path just calls translateExpr() on the
            //     lvalue and appends ` = rhs`).
            //   - `LooperName[i].SubControl` - a CONTROL REFERENCE, when
            //     SubControl matches one of THAT looper's own row-template
            //     sub-controls (env.looperRowControls - confirmed real:
            //     `ui.set(LOOP_Main[n-1].FavButton, "caption", ...)` passes
            //     it as ui.set's controlName argument, not a data value) ->
            //     a synthesized per-row-instance control name string,
            //     `"LooperName[i].SubControl"` (index interpolated at
            //     runtime) - resolves to nothing in the control registry
            //     until real per-row rendering exists (same honest "compiles,
            //     inert until a real data source" pattern as the rest of
            //     Table/Looper support), never a compile error.
            // Only fires when a `.field` follows the closing `]` - a bare
            // `Name[expr]` with nothing after it has no confirmed real
            // usage, so it falls through to the ordinary bare-control-value
            // handling below instead of being guessed at.
            //
            // rowAccessName also fires for a name the Window Designer never
            // imported at all (confirmed real: `LOOP_SUB[n-1].FavButton`
            // referencing a second looper on the same window that simply
            // isn't in the database - a genuine import gap, not something
            // this translator can fix), as long as it LOOKS like a WinDev
            // name (WINDEV_CONSTANT_RE) - ctx.ui.row() needs no prior
            // registration (SmlWindowContext.rowsFor() lazily creates an
            // empty store for ANY string key), so this compiles and behaves
            // as an honest "no real data source" TODO instead of a hard
            // compile error, without ever risking the SmlUiContext.set()
            // control-reference form (env.looperRowControls has no entry
            // for an unregistered name either, so it can never be
            // mistaken for a real per-row sub-control reference).
            const rowAccessName = controlMatch || (!precededByDot && WINDEV_CONSTANT_RE.test(ident) ? ident : undefined);
            if (rowAccessName) {
                let k2 = j;
                while (k2 < len && expr[k2] === ' ') { k2++; }
                if (expr[k2] === '[') {
                    const bracketEnd = findMatchingBracket(expr, k2);
                    const indexExpr = expr.slice(k2 + 1, bracketEnd);
                    const fieldMatch = /^\s*\.\s*([A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*)/.exec(expr.slice(bracketEnd + 1));
                    if (fieldMatch) {
                        const translatedIndex = translateExpr(indexExpr, env);
                        const looperSubControls = env.looperRowControls && env.looperRowControls.get(rowAccessName.toLowerCase());
                        const isSubControlRef = looperSubControls && looperSubControls.has(fieldMatch[1].toLowerCase());
                        if (isSubControlRef) {
                            // Plain concatenation, not Dart string
                            // interpolation (`"...${expr}..."`) - the index
                            // expression can itself contain double-quoted
                            // string literals (e.g. a Table/Looper index
                            // derived from `ui.table_selected("Name")`),
                            // which would otherwise nest inside the SAME
                            // quote character as this outer string.
                            out += `${JSON.stringify(rowAccessName + '[')} + (${translatedIndex}).toString() + ${JSON.stringify('].' + fieldMatch[1])}`;
                        } else {
                            out += `ctx.ui.row(${JSON.stringify(rowAccessName)}, ${translatedIndex})[${JSON.stringify(fieldMatch[1])}]`;
                        }
                        i = bracketEnd + 1 + fieldMatch[0].length;
                        continue;
                    }
                }
            }

            const globalMatch = !controlMatch && !precededByDot && ident.indexOf('.') === -1 && env.globalNames
                ? env.globalNames.get(ident.toLowerCase())
                : undefined;
            // A window's own declarations-scoped name (a `var` line or an
            // `// event parameters:` entry - see toDeclarationNameMap()) -
            // checked after control/global (a control/global name always
            // wins on a genuine collision, matching the priority order
            // already established between those two) but before the
            // struct-field/local-variable/WinDev-constant fallbacks below.
            // A plain bare identifier (`this.field` never applies here -
            // declarations fields are always referenced bare, exactly like
            // a control or global) - emits the CANONICAL declared casing,
            // no `ctx`/`AppGlobals.` wrapper (it's a plain field on the
            // SAME State class this code already runs on).
            const declMatch = !controlMatch && !globalMatch && !precededByDot && ident.indexOf('.') === -1 && env.declarationNames
                ? env.declarationNames.get(ident.toLowerCase())
                : undefined;
            // A struct-field access (anything after a dot that isn't one of
            // the more specific cases above) - see
            // buildStructFieldCasingMap()'s doc comment for why a
            // project-wide, case-insensitive union is the right fix here.
            const structFieldMatch = precededByDot && env.structFieldCasing
                ? env.structFieldCasing.get(ident.toLowerCase())
                : undefined;
            // WinDev's `+` auto-converts a non-string operand to text
            // (confirmed real: `"WIN_Form_users;" + AppGlobals.gnUserID`,
            // `"...Automaten " + n + " löschen?"`) - Dart's `String.+`
            // does not. Only global/declarations/local names carry a
            // statically-known non-String Dart type here (a control read
            // is `dynamic` via ctx.ui.get, already safe for concatenation
            // without help) - see isPrecededByStringConcat()'s doc comment
            // for why this only ever fires next to an actual string
            // LITERAL, never a guess about a string-typed variable.
            const numericType = (globalMatch && globalMatch.dart_type)
                || (declMatch && declMatch.dart_type)
                || (!controlMatch && !globalMatch && !declMatch && !structFieldMatch && ident.indexOf('.') === -1 && env.localTypes
                    ? env.localTypes.get(ident)
                    : undefined);
            // Only when `ident` is the WHOLE operand, never when a `[index]`
            // or `.field` chain follows it (confirmed real and broken
            // without this guard: `arrIdent[i - 1].sName` - `arrIdent` alone
            // resolves to a `List<...>` local type, which satisfied the
            // "non-String, next to a string literal" check below even
            // though the ACTUAL value being concatenated is the FIELD read
            // several tokens later, not `arrIdent` itself - wrongly emitted
            // `arrIdent.toString()[i - 1].sName`). A trailing `[`/`.`
            // means there is more to this expression than the bare
            // identifier, so its own type says nothing about what the
            // concatenation actually sees.
            let lookaheadK = j;
            while (lookaheadK < len && expr[lookaheadK] === ' ') { lookaheadK++; }
            const isBareOperand = expr[lookaheadK] !== '[' && expr[lookaheadK] !== '.';
            const needsToString = !!numericType && numericType !== 'String' && numericType !== 'dynamic' && isBareOperand
                && (isPrecededByStringConcat(out) || isFollowedByStringConcat(expr, j));
            if (controlMatch) {
                out += `ctx.ui.get(${JSON.stringify(controlMatch)}, "Value")`;
            } else if (globalMatch) {
                out += needsToString ? `AppGlobals.${globalMatch.name}.toString()` : `AppGlobals.${globalMatch.name}`;
            } else if (declMatch) {
                out += needsToString ? `${declMatch.name}.toString()` : declMatch.name;
            } else if (structFieldMatch) {
                out += structFieldMatch;
            } else if (!precededByDot && expr[j] !== '[' && !KNOWN_BARE_CONSTANTS.has(ident) && WINDEV_CONSTANT_RE.test(ident)) {
                // Excludes a bracket-indexed name (`Name[...]`) - a real
                // constant is never indexed, only a control/looper/array is,
                // so this is instead an OUT-OF-SCOPE bracket-indexed name
                // (e.g. a nested-control looper never imported - see the
                // separate, already-documented LOOP_SUB gap) - leaving it as
                // a bare (still-broken) reference is more honest than
                // silently swallowing it into `null[...]`, which wouldn't
                // even compile anyway (`[]` isn't defined on `Null`).
                //
                // An unmapped WinDev built-in constant (confirmed real:
                // `IMG_LINK`/`IMG_NEXT`/... image-resource constants) - this
                // codebase's own naming conventions never produce a
                // Capitalized_With_Underscores bare identifier for anything
                // else (locals are Hungarian-notation lowercase, procedures
                // are PascalCase with no underscore, controls/loopers are
                // already resolved above via controlMatch) - the one
                // exception being a NESTED control's bare name (out of this
                // round's scope regardless - see %1_page.dart's class doc
                // comment - so it was already going to be functionally
                // wrong here either way). `null` compiles in every
                // expression context a bare identifier can appear in.
                out += `null /* TODO: unmapped WinDev constant '${ident}' */`;
            } else {
                out += needsToString ? `${ident}.toString()` : ident;
            }
            i = j;
            continue;
        }

        out += ch;
        i++;
    }

    return out;
}

/** Index of the ')' matching the '(' at openIndex, string-aware. */
function findMatchingParen(s, openIndex) {
    let depth = 0;
    for (let i = openIndex; i < s.length; i++) {
        const ch = s[i];
        if (ch === '"') {
            i++;
            while (i < s.length) {
                if (s[i] === '\\') { i += 2; continue; }
                if (s[i] === '"') { break; }
                i++;
            }
            continue;
        }
        if (ch === '(') { depth++; }
        else if (ch === ')') { depth--; if (depth === 0) { return i; } }
    }
    return s.length - 1; // malformed - never loop forever
}

/** Same as findMatchingParen() but for `[`/`]` - see the row-indexed
 * Table/Looper access handling in translateExpr() (`Name[index].Field`). */
function findMatchingBracket(s, openIndex) {
    let depth = 0;
    for (let i = openIndex; i < s.length; i++) {
        const ch = s[i];
        if (ch === '"') {
            i++;
            while (i < s.length) {
                if (s[i] === '\\') { i += 2; continue; }
                if (s[i] === '"') { break; }
                i++;
            }
            continue;
        }
        if (ch === '[') { depth++; }
        else if (ch === ']') { depth--; if (depth === 0) { return i; } }
    }
    return s.length - 1; // malformed - never loop forever
}

/** Splits a call's raw argument text on top-level commas and translates each. */
function translateArgList(rawArgs, env) {
    if (rawArgs.trim() === '') return '';
    return splitTopLevelCommas(rawArgs).map(a => translateExpr(a.trim(), env)).join(', ');
}

function splitTopLevelCommas(s) {
    const parts = [];
    let depth = 0;
    let current = '';
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === '"') {
            current += ch;
            i++;
            while (i < s.length) {
                current += s[i];
                if (s[i] === '\\' && i + 1 < s.length) { i++; current += s[i]; i++; continue; }
                if (s[i] === '"') { i++; break; }
                i++;
            }
            i--;
            continue;
        }
        if (ch === '(' || ch === '[') { depth++; current += ch; continue; }
        if (ch === ')' || ch === ']') { depth--; current += ch; continue; }
        if (ch === ',' && depth === 0) { parts.push(current); current = ''; continue; }
        current += ch;
    }
    if (current.trim() !== '') parts.push(current);
    return parts;
}

/**
 * `ns.func(args)` -> the right Dart call form for that namespace:
 *   - unknown namespace (not in supported.md) -> left as a bare call,
 *     wrapped in a TODO comment rather than guessed (never seen in a real
 *     SML file today, since the WinDev->SML converter only ever emits the
 *     20 catalogued namespaces, but a hand-written/future SML file could).
 *   - window-scoped (ui/win/dlg/rpt/timer) -> `ctx.ns.camelFn(args)`
 *   - stateless -> `SmlNs.camelFn(args)`
 *   - async (see ASYNC_FUNCTIONS) -> `await ` prefix on either form above
 */
function translateNamespacedCall(ns, fnName, translatedArgs) {
    const dotted = ns + '.' + fnName;
    const camelFn = toCamelCase(fnName);
    const needsAwait = ASYNC_FUNCTIONS.has(dotted);
    const awaitPrefix = needsAwait ? 'await ' : '';

    if (!isKnownNamespace(ns)) {
        return `/* TODO: unknown SML namespace '${ns}' */ ${ns}.${fnName}(${translatedArgs})`;
    }

    if (WINDOW_SCOPED_NAMESPACES[ns]) {
        return `${awaitPrefix}ctx.${ns}.${camelFn}(${translatedArgs})`;
    }

    const dartClass = SML_NAMESPACE_TO_DART_CLASS[ns];
    return `${awaitPrefix}${dartClass}.${camelFn}(${translatedArgs})`;
}

/**
 * `timer.start(target, delayMs[, repeatFlag])` needs its OWN handling,
 * separate from translateNamespacedCall() - real corpus usage has `target`
 * as either a BARE PROCEDURE REFERENCE (`timer.start(CheckErrorLog, 500)`)
 * or a STRING NAME matching WinDev's own `Timer(name, delay)` idiom, where
 * the timer's name is the name of the procedure it calls each tick
 * (`timer.start("CountDown", 100, 1)` - "CountDown" is a real procedure).
 * Dart has no runtime call-by-string-name without reflection, so a string
 * target is resolved to its real procedure reference HERE, at translate
 * time (env.procedureNameMap knows every local+global procedure name) -
 * never guessed, and never left as a literal string SmlTimerContext.start()
 * couldn't do anything with. An unresolvable target - no matching procedure
 * either way - becomes a visible TODO, same "never silently guess" policy
 * as an unmapped bare call. The optional third argument (a WinDev repeat/
 * interval count, only ever seen as a small integer) is treated as an
 * honest, documented approximation: non-zero -> `repeat: true` (Dart's
 * `Timer.periodic`, no precise N-times bookkeeping) rather than a guessed
 * exact translation of WinDev's own repeat-count semantics.
 */
function translateTimerStart(rawArgs, env) {
    const rawParts = splitTopLevelCommas(rawArgs).map(a => a.trim());
    if (rawParts.length < 2) {
        return `/* TODO: malformed timer.start call: timer.start(${rawArgs}) */ ctx.timer.start(() {}, 0)`;
    }
    const [rawTarget, rawDelay, rawRepeat] = rawParts;
    const delayExpr = translateExpr(rawDelay, env);
    const repeatArg = rawParts.length >= 3 ? `, repeat: (${translateExpr(rawRepeat, env)}) != 0` : '';

    const bareMatch = /^([A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*)$/.exec(rawTarget);
    const stringMatch = /^"((?:[^"\\]|\\.)*)"$/.exec(rawTarget);
    const targetName = bareMatch ? bareMatch[1] : (stringMatch ? stringMatch[1] : null);
    const procName = targetName && env.procedureNameMap ? env.procedureNameMap.get(targetName.toLowerCase()) : undefined;

    if (!procName) {
        return `/* TODO: timer.start target '${rawTarget}' does not match a known procedure */ ctx.timer.start(() {}, ${delayExpr}${repeatArg})`;
    }

    // A GLOBAL procedure needing a live window (env.ctxMap - see
    // computeWindowContextMap()) can't be referenced bare as a zero-arg
    // callback (its real signature takes a leading `ctx` parameter - see
    // global_procedures.dart) - wrap it in a closure that supplies the
    // CALLER's own `ctx`, same as any other call site. A window-local
    // procedure is already a proper `Future<T> Function()` State-method
    // tear-off when referenced bare, so it needs no wrapping.
    const needsCtx = env.ctxMap && env.ctxMap[procName]
        && env.globalProcedureNames && env.globalProcedureNames.has(procName);
    const callbackExpr = needsCtx ? `() => ${procName}(ctx)` : procName;
    return `ctx.timer.start(${callbackExpr}, ${delayExpr}${repeatArg})`;
}

/**
 * `arr.find(array, asLinear, "FieldName", value)` - WinDev's search-an-
 * array-of-structs-by-named-field form, confirmed real (searching for a
 * subscriber/cash register/log entry by its own id-like field). Distinct
 * from the ordinary 2-arg `arr.find(array, value)` (plain element search,
 * handled by translateNamespacedCall() as SmlArr.find) - this is a totally
 * different Dart call (SmlArr.findByField, see lib_arr.dart) needing a
 * generated selector closure, so it must be recognised here, on the RAW
 * (untranslated) argument text, before the generic dispatch ever runs.
 * Returns null (meaning "not this form, use the ordinary path instead")
 * when the shape doesn't match - not exactly 4 arguments, or the field-name
 * argument isn't a literal string (the search mode argument itself,
 * `asLinear` et al, is read but never used - a plain Dart List has no other
 * way to search anyway).
 */
function translateArrFind(rawArgs, env) {
    const parts = splitTopLevelCommas(rawArgs).map(a => a.trim());
    if (parts.length !== 4) {
        return null;
    }
    const [rawList, , rawFieldName, rawValue] = parts;
    const fieldMatch = /^"((?:[^"\\]|\\.)*)"$/.exec(rawFieldName);
    if (!fieldMatch) {
        return null;
    }
    const listExpr = translateExpr(rawList, env);
    const valueExpr = translateExpr(rawValue, env);
    // `(dynamic _item) => ...`, not a bare `(_item) => ...` - when [rawList]'s
    // own static type is unresolvable (confirmed real: `garrLogFile` is a
    // project global never actually imported - see translateArrAdd()'s own
    // doc comment for the same root cause), Dart's generic-type inference
    // for `findByField<T, F>`'s `T` falls back to `Object?` rather than
    // `dynamic`, making `_item.${fieldName}` a compile error (`Object?`
    // has no such member) even though the field access is perfectly valid
    // at runtime once real data exists. An explicit `dynamic` annotation
    // sidesteps that inference entirely - harmless when the list IS a real
    // known type too (`dynamic` unifies with any `F Function(T)` slot).
    return `SmlArr.findByField(${listExpr}, (dynamic _item) => _item.${fieldMatch[1]}, ${valueExpr})`;
}

/**
 * A `List<X>` expression's element type name `X`, if known - two shapes:
 *   - a BARE identifier - a project global (env.globalNames) or a local
 *     variable/procedure parameter declared earlier in this same snippet
 *     (env.localTypes - see translateVarDecl()'s doc comment and
 *     translateSmlToDart()'s parameter-seeding).
 *   - `Owner[index].field` - a struct array NESTED inside another struct
 *     array's element (confirmed real: `arr.add(garrLogFile[n].arrRecords)`
 *     - `garrLogFile` is `List<stLogFileName>`, whose `arrRecords` field is
 *     itself `List<stLogRecord>`) - resolved by recursing on `Owner` for
 *     its OWN element struct type, then looking up `field`'s declared type
 *     on THAT struct via env.structsByName. `index`'s own text is never
 *     inspected (only used to confirm the bracket shape) - it plays no
 *     part in a TYPE, only in the runtime index value translateArrAdd()
 *     translates separately.
 * Returns null for anything else (a deeper/different-shaped expression, an
 * unresolvable name) - never guessed.
 */
function resolveListElementType(rawExpr, env) {
    const trimmed = rawExpr.trim();

    const bareMatch = /^([A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*)$/.exec(trimmed);
    if (bareMatch) {
        const name = bareMatch[1];
        const globalMatch = env.globalNames && env.globalNames.get(name.toLowerCase());
        const dartType = globalMatch ? globalMatch.dart_type : (env.localTypes && env.localTypes.get(name));
        const listMatch = dartType && /^List<(.+)>$/.exec(dartType);
        return listMatch ? listMatch[1] : null;
    }

    const pathMatch = /^([A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*)\[.+\]\.([A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*)$/.exec(trimmed);
    if (pathMatch) {
        const [, ownerName, fieldName] = pathMatch;
        const ownerElementType = resolveListElementType(ownerName, env);
        if (!ownerElementType) { return null; }
        const structFields = env.structsByName && env.structsByName.get(ownerElementType.toLowerCase());
        const field = structFields && structFields.get(fieldName.toLowerCase());
        const listMatch = field && field.dart_type && /^List<(.+)>$/.exec(field.dart_type);
        return listMatch ? listMatch[1] : null;
    }

    return null;
}

/**
 * `arr.add(array)` (1 argument only) - WinDev's "append a fresh empty
 * record" idiom for a struct array (confirmed real: `set n = arr.add
 * (garrLogFile)` then filling in `garrLogFile[n].field = ...` afterward) -
 * distinct from the ordinary 2-arg `arr.add(array, value)` (append a GIVEN
 * value, handled by translateNamespacedCall() as SmlArr.add). `SmlArr.add`
 * is generic (`add<T>(List<T> list, T value)`) and Dart generics can't
 * construct a bare `T()` without knowing T concretely, so this resolves the
 * array's element type at TRANSLATE time (resolveListElementType()) and
 * supplies a real `ElementType()` as the value - every generated struct
 * class has a real no-arg constructor (see app_structs.dart), so this
 * always produces a valid, fully-populated-with-defaults fresh row. Returns
 * null (meaning "not resolvable this way, use the ordinary path instead")
 * when there isn't exactly 1 argument or its element type isn't known - the
 * ordinary 2-arg SmlArr.add dispatch will then report a clear arg-count
 * error for a genuinely unresolvable case (e.g. a struct-field-access
 * array like `garrLogFile[n].arrRecords`) rather than silently guessing.
 */
function translateArrAdd(rawArgs, env) {
    const parts = splitTopLevelCommas(rawArgs).map(a => a.trim());
    if (parts.length !== 1) {
        return null;
    }
    let elementType = resolveListElementType(parts[0], env);
    // A bare name resolveListElementType() couldn't type at ALL (not a
    // global, not a declared local, not a control/declarations field) -
    // an genuine SML-import gap (confirmed real: `garrCashRegisters` never
    // made it into `ui_project_globals` for this project, despite the
    // procedure's own `SmlArr.clear(garrCashRegisters)` call clearly
    // expecting a real persistent array) rather than a translator
    // question. `collectImplicitLocals()` already synthesizes a bare
    // `dynamic name;` field for exactly this case - treated the SAME as
    // the `record<X>`-not-found `dynamic` fallback right below: still
    // compiles (every `name[n].field = ...` afterward is an unchecked
    // dynamic access), not fully functional until the real global is
    // actually imported - a separate, documented follow-up. Distinct from
    // a genuinely WRONG-shaped known type (e.g. a real `List<String>`
    // global) - resolveListElementType() returning null. for a KNOWN
    // non-List type is left alone, falling through to the ordinary 2-arg
    // dispatch's own honest arity error, since that reflects a real bug in
    // the SOURCE SML this translator has no business papering over.
    const bareName = /^[A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*$/.test(parts[0]);
    if (!elementType && bareName) {
        const lower = parts[0].toLowerCase();
        const isControlGlobalOrDecl = (env.globalNames && env.globalNames.has(lower))
            || (env.declarationNames && env.declarationNames.has(lower))
            || (env.controlNames && env.controlNames.has(lower));
        // env.localTypes ALREADY holds 'dynamic' for this exact name by the
        // time this runs, for a genuinely undeclared implicit local -
        // translateSmlToDart() pre-seeds every collectImplicitLocals() name
        // into env.localTypes as 'dynamic' BEFORE translateStatements() (and
        // so this function) ever executes, specifically so bare reads
        // elsewhere in the same snippet resolve cleanly. That means a plain
        // `env.localTypes.has(name)` check can never distinguish "genuinely
        // unknown" from "known" here - it's ALWAYS true for exactly the
        // implicit-local case this is meant to catch. Only a CONCRETE,
        // non-dynamic type (a real declared `List<String>`, `int`, ...)
        // should block the fallback - that's a genuinely wrong-shaped real
        // declaration, not a missing one.
        const localType = env.localTypes && env.localTypes.get(parts[0]);
        const isConcreteOtherType = localType !== undefined && localType !== 'dynamic';
        if (!isControlGlobalOrDecl && !isConcreteOtherType) {
            elementType = 'dynamic';
        }
    }
    // Same idea, one level deeper: `Owner[index].field` (a struct array
    // NESTED inside another struct array's element - see
    // resolveListElementType()'s own doc comment for the real, confirmed
    // shape: `arr.add(garrLogFile[n].arrRecords)`) where `Owner` ITSELF is
    // the unresolvable-import-gap name (`garrLogFile` never made it into
    // `ui_project_globals` either - same root cause as `garrCashRegisters`
    // above, just one level removed). resolveListElementType() already
    // returns null here (it can't recurse into an unknown owner's fields),
    // so this only needs to confirm the SHAPE matches and the owner is
    // genuinely unresolvable (not a real, differently-shaped known type)
    // before applying the identical `dynamic`/`null` treatment.
    if (!elementType) {
        const pathMatch = /^([A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*)\[.+\]\.([A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*)$/.exec(parts[0]);
        if (pathMatch) {
            const ownerName = pathMatch[1];
            const ownerLower = ownerName.toLowerCase();
            const ownerIsControlGlobalOrDecl = (env.globalNames && env.globalNames.has(ownerLower))
                || (env.declarationNames && env.declarationNames.has(ownerLower))
                || (env.controlNames && env.controlNames.has(ownerLower));
            const ownerLocalType = env.localTypes && env.localTypes.get(ownerName);
            const ownerIsConcreteOtherType = ownerLocalType !== undefined && ownerLocalType !== 'dynamic';
            if (!ownerIsControlGlobalOrDecl && !ownerIsConcreteOtherType) {
                elementType = 'dynamic';
            }
        }
    }
    if (!elementType) {
        return null;
    }
    const listExpr = translateExpr(parts[0], env);
    // `dynamic` isn't a constructible type (`dynamic()` is a syntax error) -
    // this happens for real when the array's declared element is a
    // `record<X>` struct that was never actually imported into this
    // project (see UltimateTemplateController.php's own `knownStructNames`
    // fallback, which resolves an unknown struct to `dynamic` so field
    // access - `arrIdent[n].sName = ...` right after this call - still
    // compiles). `null` is the honest placeholder here: the array itself
    // still gets a new slot (matching WinDev's own "append a fresh empty
    // record" semantics as closely as a genuinely-missing struct type
    // allows), field access on it won't fully work at RUNTIME until the
    // real struct is imported - a documented, separate follow-up, not
    // something this translator can fabricate a type for.
    const newValue = elementType === 'dynamic' ? 'null' : `${elementType}()`;
    return `SmlArr.add(${listExpr}, ${newValue})`;
}

// ===========================================================================
// 5. Statement translation
// ===========================================================================

/**
 * Emits a `call`/bare-call statement's final Dart text. Ordinarily just
 * `translatedExpr + ';'` - but when `env.deferCtxCalls` is set (ONLY ever
 * true while translating the PROJECT's own init code - see
 * ProjectInitQueue's own doc comment for the full "why") AND this
 * particular call genuinely reaches through a live window (its own
 * translated text contains `ctx.` - true for `ctx.dlg.info(...)`,
 * `ctx.message(...)`, `ctx.ui.set(...)`, ... and false for a ctx-free call
 * like `SmlIni.read(...)`/a bare procedure call), the call is queued
 * instead of run immediately: there is no live window/BuildContext yet at
 * the point project init runs (`main()`, before `runApp()`). A leading
 * `await ` is stripped before wrapping - the queued closure's OWN `async`
 * arrow body re-adds it, so keeping both would double up.
 */
function emitCallStatement(translatedExpr, env) {
    if (env.deferCtxCalls && translatedExpr.includes('ctx.')) {
        const withoutAwait = translatedExpr.startsWith('await ') ? translatedExpr.slice(6) : translatedExpr;
        return `ProjectInitQueue.add((ctx) async => ${withoutAwait});`;
    }
    return translatedExpr + ';';
}

/**
 * Translates logicalLines[start..end) (a straight-line sequence of SML
 * statements, no surrounding braces) into indented Dart source text.
 */
function translateStatements(logicalLines, start, end, indent, env) {
    const pad = '  '.repeat(indent);
    let out = '';
    let i = start;

    while (i < end) {
        const line = logicalLines[i];
        let trimmed = line.trim();

        if (trimmed === '') { out += '\n'; i++; continue; }

        if (trimmed.startsWith('//')) {
            out += pad + trimmed + '\n';
            i++;
            continue;
        }

        if (trimmed.startsWith('|')) {
            // Stray raw-continuation line reached outside its own `raw`
            // header (shouldn't happen given toLogicalLines() keeps them
            // together, but never silently drop it if it does).
            out += pad + '// ' + trimmed + '\n';
            i++;
            continue;
        }

        const firstWord = trimmed.split(/[\s({]/)[0];

        if (firstWord === 'raw') {
            // `raw <lang> at <line>` header + its `| ...` continuation
            // lines, all folded into ONE logical line by toLogicalLines()
            // only when truly needed - here it's still the SEVERAL physical
            // lines joined with '\n', so split them back apart for the
            // comment body.
            const rawLines = line.split('\n');
            out += pad + '// TODO: untranslated source - ' + rawLines[0].trim() + '\n';
            for (let r = 1; r < rawLines.length; r++) {
                out += pad + '//   ' + rawLines[r].trim() + '\n';
            }
            i++;
            continue;
        }

        if (firstWord === 'todo') {
            const msg = extractQuoted(trimmed) || '';
            out += pad + '// TODO: ' + msg + '\n';
            i++;
            continue;
        }

        // A trailing inline `// comment` (string-aware, so a URL like
        // "http://x" inside a string literal is never mistaken for one) is
        // split off BEFORE translating the code portion of this line, and
        // re-appended after whatever this branch appends (`;`, a closing
        // `{`, a cast's closing paren, ...). Without this, real SML code
        // like `set gnPos = gnPos + 1  // skip past "["` would have its own
        // trailing comment swallow everything appended after it on the same
        // output line - the terminating `;` included - corrupting the
        // statement. Confirmed real: this exact pattern appears throughout
        // the corpus (German inline comments are this codebase's house
        // style). `trimmed` is reassigned to the code-only portion so every
        // branch below keeps working exactly as before.
        const { code: trimmedCode, comment: trailingComment } = splitTrailingComment(trimmed);
        trimmed = trimmedCode;
        const suffix = trailingComment ? '  ' + trailingComment : '';

        if (firstWord === 'var') {
            out += pad + translateVarDecl(trimmed, env) + suffix + '\n';
            i++;
            continue;
        }

        if (firstWord === 'set') {
            out += pad + translateSet(trimmed.slice(3).trim(), env) + ';' + suffix + '\n';
            i++;
            continue;
        }

        if (firstWord === 'call') {
            out += pad + emitCallStatement(translateExpr(trimmed.slice(4).trim(), env), env) + suffix + '\n';
            i++;
            continue;
        }

        if (firstWord === 'return') {
            const rest = trimmed.slice(6).trim();
            out += pad + 'return' + (rest ? ' ' + translateExpr(rest, env) : '') + ';' + suffix + '\n';
            i++;
            continue;
        }

        if (firstWord === 'break') { out += pad + 'break;' + suffix + '\n'; i++; continue; }
        if (firstWord === 'continue') { out += pad + 'continue;' + suffix + '\n'; i++; continue; }

        if (firstWord === 'throw') {
            const rest = trimmed.slice(5).trim();
            // A bare `throw` (no expression) is WLanguage's "re-raise the
            // exception this catch block just caught" idiom - confirmed
            // real, always inside a `catch error { ... throw }` block.
            // Dart's own bare `throw;` (no operand) is a SYNTAX ERROR
            // ("Missing expression after 'throw'") - `rethrow` is the
            // actual Dart statement for this, and (like WLanguage's own
            // bare throw) is ITSELF only legal inside a catch clause, so
            // translating unconditionally here carries no more risk than
            // WLanguage's own bare `throw` already does.
            out += rest
                ? pad + 'throw ' + translateExpr(rest, env) + ';' + suffix + '\n'
                : pad + 'rethrow;' + suffix + '\n';
            i++;
            continue;
        }

        if (BLOCK_KEYWORDS.has(firstWord)) {
            const blockEnd = findBlockEnd(logicalLines, i);
            // translateBlockHeader() can return multiple newline-joined
            // lines for a comma-list `case` label (one Dart `case x:` per
            // value) - re-indent every line, not just the first, to `pad`.
            const headerText = translateBlockHeader(trimmed, firstWord, env)
                .split('\n').join('\n' + pad);
            out += pad + headerText + ' {' + suffix + '\n';
            out += translateStatements(logicalLines, i + 1, blockEnd, indent + 1, env);
            out += pad + '}\n';
            i = blockEnd + 1;
            continue;
        }

        // A bare call-statement with no `call` keyword (`ProgressBar(100,
        // 100, "...", LightRed)`, `Message("Fertig!")`, `info("...")` used
        // as a standalone statement, all confirmed real from a project
        // whose WinDev->SML conversion this round happened to drop `call`
        // in front of them) - WLanguage itself never requires "call" for a
        // statement-level function call; the `call` branch above is simply
        // how this SML dialect NORMALLY spells it, and every confirmed real
        // case up to now always had it. Detected structurally, not by
        // name, so it covers every present and future bare builtin/
        // procedure the same way `call` does: an identifier (optionally
        // dotted, e.g. `dlg.info`) immediately followed by `(`, whose
        // matching `)` is the LAST character of the line (nothing trails
        // it - `foo(1) + 1` or `foo(1).bar` are real EXPRESSIONS, not bare
        // call-statements, and must keep falling through to the TODO
        // fallback below instead of being misread as one).
        const bareCallMatch = /^[A-Za-z_À-ɏ][A-Za-z0-9_.À-ɏ]*\s*\(/.exec(trimmed);
        if (bareCallMatch && findMatchingParen(trimmed, bareCallMatch[0].length - 1) === trimmed.length - 1) {
            out += pad + emitCallStatement(translateExpr(trimmed, env), env) + suffix + '\n';
            i++;
            continue;
        }

        // A bare assignment with no `set` keyword (`EDT_ServerIP =
        // gsDB_IP`, `EDT_ServerIP = "TEST"`) - same "call is optional"
        // reasoning as the bare-call-statement branch above (confirmed
        // real from a hand-written test window that consistently dropped
        // `set` everywhere): real WLanguage has no `set` keyword at all,
        // `X = Y` IS the complete, correct assignment statement - `set` is
        // purely this SML dialect's own spelling, not something WLanguage
        // requires. findTopLevelEquals() (the SAME helper translateSet()
        // itself uses) already correctly ignores `==`/`!=`/`<=`/`>=` and
        // anything inside a string/parens/brackets, so a real top-level
        // `=` reaching this point (past every block-keyword/`if`/`while`/
        // `for`/... branch above, which would have already consumed a
        // condition's own `==`) can only be a genuine assignment missing
        // its `set`. translateSet() itself doesn't care whether its input
        // came with or without a leading "set " - it only ever looks at
        // the "lvalue = rvalue" text - so the ENTIRE line is handed to it
        // unchanged, no `.slice()` needed here.
        if (findTopLevelEquals(trimmed) !== -1) {
            out += pad + translateSet(trimmed, env) + ';' + suffix + '\n';
            i++;
            continue;
        }

        // Anything else (a bare expression statement, or a construct this
        // translator doesn't recognise) - never silently dropped.
        out += pad + '// TODO: unrecognised SML statement: ' + trimmed + suffix + '\n';
        i++;
    }

    return out;
}

/**
 * Splits a trimmed SML line into { code, comment } at the first `//` that
 * is NOT inside a double-quoted string (so `"http://x"` is never mistaken
 * for a comment start) - `comment` includes the `//` itself and is empty
 * when the line has no trailing comment.
 */
function splitTrailingComment(line) {
    let inString = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inString) {
            if (ch === '\\') { i++; continue; }
            if (ch === '"') { inString = false; }
            continue;
        }
        if (ch === '"') { inString = true; continue; }
        if (ch === '/' && line[i + 1] === '/') {
            return { code: line.slice(0, i).trim(), comment: line.slice(i) };
        }
    }
    return { code: line.trim(), comment: '' };
}

function extractQuoted(text) {
    const start = text.indexOf('"');
    if (start === -1) return null;
    const end = text.indexOf('"', start + 1);
    if (end === -1) return null;
    return text.slice(start + 1, end);
}

/**
 * `var name: type [= expr]` -> `DartType name = expr;`. WinDev/SML has no
 * concept of an "uninitialized" local variable - a declared `var` always
 * starts at its type's zero value (0, "", false, an empty list, ...), the
 * exact same semantics already used for struct fields and project globals
 * (see defaultDartValue() below, a JS mirror of
 * UltimateTemplateController::defaultDartValue()) - so a `var` with NO SML
 * initializer gets that same real zero-value default, NEVER a nullable
 * `Type? name;` (confirmed a real, not hypothetical, need: plain `int`/
 * `string` locals declared without an initializer are later used in
 * unconditional arithmetic/concatenation - e.g. `n = n + 1` - which a
 * nullable declaration would make a Dart compile error). `date`/`time`/
 * `datetime` (`DateTime`) is the one exception, same as struct fields -
 * WinDev has no real "empty date" value honest enough to fabricate, so it
 * stays genuinely nullable. An expression initializer gets the same
 * `num` -> `int`/`double` narrowing cast as AppGlobals' own writes (see
 * translateSet()) - `var n: int = num.parse(...)` hits the identical
 * num/int mismatch a global's default_value does.
 */
function translateVarDecl(trimmed, env) {
    const rest = trimmed.slice(3).trim(); // strip 'var'
    const colon = rest.indexOf(':');
    if (colon === -1) {
        return '// TODO: malformed var declaration: ' + trimmed;
    }
    const name = rest.slice(0, colon).trim();
    const afterColon = rest.slice(colon + 1).trim();
    const eq = findTopLevelEquals(afterColon);

    if (eq === -1) {
        const dartType = smlTypeToDart(afterColon.trim(), env);
        if (env.localTypes) { env.localTypes.set(name, dartType); }
        if (dartTypeIsNullableByDefault(dartType)) {
            return `${dartType}? ${name};`;
        }
        return `${dartType} ${name} = ${defaultDartValue(dartType)};`;
    }

    const smlType = afterColon.slice(0, eq).trim();
    const initExpr = afterColon.slice(eq + 1).trim();
    const dartType = smlTypeToDart(smlType, env);
    if (env.localTypes) { env.localTypes.set(name, dartType); }
    let translated = translateExpr(initExpr, env);
    if (dartType === 'int') {
        translated = `(${translated}).toInt()`;
    } else if (dartType === 'double') {
        translated = `(${translated}).toDouble()`;
    }
    return `${dartType} ${name} = ${translated};`;
}

/**
 * JS mirror of UltimateTemplateController::defaultDartValue() - kept in
 * sync deliberately (see smlTypeToDart() above for the same "PHP needs it
 * for gtree pre-resolution, JS needs it for local `var` declarations"
 * rationale). A struct type (anything not matched below) gets its own
 * no-arg constructor call - every generated struct class has one (all
 * fields carry their own default), so this is valid for any nesting depth.
 */
function defaultDartValue(dartType) {
    if (dartType === 'String') return "''";
    if (dartType === 'int') return '0';
    if (dartType === 'double') return '0.0';
    if (dartType === 'bool') return 'false';
    if (dartType === 'dynamic') return 'null';
    if (dartType === 'DateTime') return 'null';
    if (dartType === 'Uint8List') return 'Uint8List(0)';
    if (dartType.startsWith('List<')) return '[]';
    if (dartType.startsWith('Map<')) return '{}';
    return `${dartType}()`;
}

/** JS mirror of UltimateTemplateController::dartTypeIsNullableByDefault(). */
function dartTypeIsNullableByDefault(dartType) {
    return dartType === 'DateTime';
}

/**
 * `lvalue = expr` (the text after `set `) -> `lvalue = expr` (both sides
 * translated independently - the lvalue can be a plain name, an array
 * index, a record field, or a chain of these, all valid as a Dart
 * assignment target unchanged) - UNLESS the lvalue is an EXACT bare name
 * matching one of this window's own controls (env.controlNames), in which
 * case it is WinDev's implicit default-property assignment shorthand
 * (`set EDT_IPURL = expr` really means "set this control's Value") and
 * becomes `ctx.ui.set("Name", "Value", expr)` instead - the write-side
 * counterpart of the bare-control-read handling in translateExpr(). Same
 * treatment for an EXACT bare project-global name (env.globalNames) ->
 * `AppGlobals.name = expr` (no `ctx` needed, a global is a plain static
 * field). Only an EXACT bare identifier qualifies for either case (never
 * `record[0].ControlName`/`record[0].globalName`) - real corpus usage only
 * ever bare-assigns a plain name, never a computed/indexed one.
 */
function translateSet(afterSet, env) {
    const eq = findTopLevelEquals(afterSet);
    if (eq === -1) {
        return '// TODO: malformed set statement: set ' + afterSet;
    }
    const lvalue = afterSet.slice(0, eq).trim();
    const rvalue = afterSet.slice(eq + 1).trim();

    if (/^[A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*$/.test(lvalue)) {
        // Case-insensitive, same rationale as translateExpr()'s bare-read
        // handling - WLanguage identifiers are case-insensitive, and both
        // controls and globals are matched back to their canonical declared
        // casing.
        const controlMatch = env.controlNames && env.controlNames.get(lvalue.toLowerCase());
        if (controlMatch) {
            return `ctx.ui.set(${JSON.stringify(controlMatch)}, "Value", ${translateExpr(rvalue, env)})`;
        }
        const globalMatch = env.globalNames && env.globalNames.get(lvalue.toLowerCase());
        if (globalMatch) {
            // A `num`-returning expression (e.g. `num.parse(...)`) assigned
            // to an `int`/`double`-typed global needs an explicit narrowing
            // cast - Dart's `num` is not assignable to either subtype.
            // Always safe to append: `.toInt()`/`.toDouble()` are defined on
            // `num` itself, so they work identically whether the expression
            // was already the target type or genuinely `num`-typed.
            let translated = translateExpr(rvalue, env);
            if (globalMatch.dart_type === 'int') {
                translated = `(${translated}).toInt()`;
            } else if (globalMatch.dart_type === 'double') {
                translated = `(${translated}).toDouble()`;
            }
            return `AppGlobals.${globalMatch.name} = ${translated}`;
        }
        // A window's own declarations-scoped field (see
        // toDeclarationNameMap()) - same num -> int/double narrowing cast
        // as a global's write above, and same case-insensitive resolution
        // as its own read side in translateExpr().
        const declMatch = env.declarationNames && env.declarationNames.get(lvalue.toLowerCase());
        if (declMatch) {
            let translated = translateExpr(rvalue, env);
            if (declMatch.dart_type === 'int') {
                translated = `(${translated}).toInt()`;
            } else if (declMatch.dart_type === 'double') {
                translated = `(${translated}).toDouble()`;
            }
            return `${declMatch.name} = ${translated}`;
        }
        // Same num -> int/double narrowing cast as globals above, for a
        // plain LOCAL variable declared earlier in this same snippet (see
        // env.localTypes - populated by translateVarDecl()).
        const localType = env.localTypes && env.localTypes.get(lvalue);
        if (localType === 'int' || localType === 'double') {
            const translated = translateExpr(rvalue, env);
            return `${lvalue} = (${translated}).to${localType === 'int' ? 'Int' : 'Double'}()`;
        }
        // A WinDev-shaped bare name that matched none of the above - a
        // GLOBAL PROCEDURE calling this same control's default property
        // from OUTSIDE the window that owns it (env.controlNames is
        // correctly empty there, unlike a window's own local code), so the
        // ordinary controlMatch case above can never fire - confirmed real
        // (`set Projekt_Fortschritt = "..."` inside a global procedure that
        // already calls `ctx.ui.row("Projekt_Fortschritt", ...)` earlier in
        // the SAME snippet, i.e. `ctx` is already guaranteed present here).
        // Same fallback idea as translateExpr()'s own generic row-access
        // handling for an unregistered name - `ctx.ui.set` needs no prior
        // control registration to compile.
        if (WINDEV_CONSTANT_RE.test(lvalue)) {
            return `ctx.ui.set(${JSON.stringify(lvalue)}, "Value", ${translateExpr(rvalue, env)})`;
        }
    }

    return `${translateExpr(lvalue, env)} = ${translateExpr(rvalue, env)}`;
}

/** First top-level '=' (not part of ==, !=, <=, >=) - string/paren aware. */
function findTopLevelEquals(s) {
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === '"') {
            i++;
            while (i < s.length) {
                if (s[i] === '\\') { i += 2; continue; }
                if (s[i] === '"') break;
                i++;
            }
            continue;
        }
        if (ch === '(' || ch === '[') { depth++; continue; }
        if (ch === ')' || ch === ']') { depth--; continue; }
        if (ch === '=' && depth === 0) {
            const prev = s[i - 1];
            const next = s[i + 1];
            if (prev === '=' || prev === '!' || prev === '<' || prev === '>' || next === '=') continue;
            return i;
        }
    }
    return -1;
}

/**
 * Translates a block-opening header line (`if EXPR {`, `elseif EXPR {`,
 * `else {`, `for name = a to b [step c] {`, `foreach name in EXPR {`,
 * `while EXPR {`, `loop {`, `switch EXPR {`, `case v1, v2 {` / `case a to b {`,
 * `default {`, `try {`, `catch name {`, `finally {`) into its Dart
 * equivalent, WITHOUT the trailing ` {` (the caller appends that).
 * Dart's own `else if`/`switch`/`try`/`catch`/`finally` syntax already
 * matches SML's shape closely - a `case`/`default` line generated here
 * becomes a Dart `case`/`default:` LABEL text (see translateStatements()'s
 * BLOCK_KEYWORDS handling, which wraps it in `{ ... }` the same as every
 * other block for a uniform brace-matching pass, valid Dart since a
 * switch-case body may be its own block).
 */
/**
 * `if`/`elseif`/`while` condition -> a genuine Dart `bool`. WLanguage lets
 * ANY numeric value stand in for a condition (0/nonzero, exactly C's own
 * truthiness rule) - confirmed real: `gbDB_CS` is declared `int` (not
 * `boolean` - its own `gb` Hungarian-notation prefix is misleading here,
 * verified against the real `ui_project_globals` row) and later used bare
 * as `if gbDB_CS { ... }`. Dart's `if` requires an actual `bool`, so a
 * bare int/double-typed condition gets `!= 0` appended.
 *
 * Deliberately narrow: only fires when `rest` (the UNTRANSLATED condition
 * text) is an EXACT bare identifier (no operators/calls/negation) that
 * resolves to a known int/double dart_type via globalNames/declarationNames/
 * localTypes - anything else (`a == b`, `a && b`, `!a`, a function call, ...)
 * already produces a real `bool` in Dart and must not be touched, or `!= 0`
 * would be appended to an expression that is not itself numeric.
 */
function translateCondition(rest, env) {
    const translated = translateExpr(rest, env);
    const bareMatch = /^[A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*$/.test(rest.trim());
    if (!bareMatch) { return translated; }
    const lower = rest.trim().toLowerCase();
    const dartType = (env.globalNames && env.globalNames.get(lower)?.dart_type)
        || (env.declarationNames && env.declarationNames.get(lower)?.dart_type)
        || (env.localTypes && env.localTypes.get(rest.trim()));
    if (dartType === 'int' || dartType === 'double') {
        return `${translated} != 0`;
    }
    return translated;
}

function translateBlockHeader(trimmed, keyword, env) {
    const header = trimmed.endsWith('{') ? trimmed.slice(0, -1).trim() : trimmed;
    const rest = header.slice(keyword.length).trim();

    switch (keyword) {
        case 'if':
            return `if (${translateCondition(rest, env)})`;
        case 'elseif':
            return `else if (${translateCondition(rest, env)})`;
        case 'else':
            return 'else';
        case 'while':
            return `while (${translateCondition(rest, env)})`;
        case 'loop':
            return 'while (true)';
        case 'try':
            return 'try';
        case 'finally':
            return 'finally';
        case 'catch': {
            const name = rest.trim();
            return name ? `catch (${name})` : 'catch (_)';
        }
        case 'switch':
            return `switch (${translateExpr(rest, env)})`;
        case 'default':
            return 'default:';
        case 'case':
            return translateCaseLabel(rest, env);
        case 'foreach': {
            // `foreach name in EXPR`
            const m = /^(\w+)\s+in\s+(.+)$/.exec(rest);
            if (!m) return `// TODO: malformed foreach: ${trimmed}`;
            return `for (final ${m[1]} in ${translateExpr(m[2], env)})`;
        }
        case 'for': {
            // `name = a to b [step c]`
            const m = /^(\w+)\s*=\s*(.+?)\s+to\s+(.+?)(?:\s+step\s+(.+))?$/.exec(rest);
            if (!m) return `// TODO: malformed for: ${trimmed}`;
            const [, name, fromExpr, toExpr, stepExpr] = m;
            const step = stepExpr ? translateExpr(stepExpr, env) : '1';
            return `for (var ${name} = ${translateExpr(fromExpr, env)}; ${name} <= ${translateExpr(toExpr, env)}; ${name} += ${step})`;
        }
        default:
            return `// TODO: unrecognised block header: ${trimmed}`;
    }
}

/**
 * `case v1, v2` -> stacked Dart case labels (`case v1: case v2:`) - Dart's
 * empty-case-falls-through-to-next-case-label is exactly the WinDev/SML
 * comma-list semantics. `case a to b` (a range) has no direct Dart case-
 * label equivalent (Dart case labels are discrete values, not ranges), so
 * it becomes a `case` guarded by a `when` clause (Dart 3 pattern matching) -
 * `case var v when v >= a && v <= b:`.
 */
/**
 * Is this already-translated Dart text a compile-time constant (a plain
 * string/number/bool literal, or a bare identifier - a project constant or
 * an enum-like SML constant such as `wlVariantArray`, both plain top-level
 * `const`s)? Dart's classic `case VALUE:` label requires one; anything else
 * (a function call like `SmlStr.fromCode(34)`, a property/array access) is
 * NOT a compile-time constant and must use the guard-pattern form below.
 */
const CASE_CONSTANT_RE = /^(-?\d+(\.\d+)?|"(?:[^"\\]|\\.)*"|true|false|[A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*)$/;
function isCaseConstant(dartExpr) {
    return CASE_CONSTANT_RE.test(dartExpr.trim());
}

/**
 * `case v1, v2, a to b, v3, c to d` - a top-level comma-list where EACH
 * element independently is either a plain value or its own `to`-range
 * (confirmed real: `case 32 to 33, 35 to 38, 40 to 91, 93 to 126` - a
 * character-code allow-list built from several disjoint ranges plus, in
 * other real cases, standalone values mixed in). Splitting on commas FIRST
 * and checking each part for its own range independently (rather than
 * matching `to` against the whole un-split `rest` text) is what makes the
 * mixed form work - matching `to` first would swallow every comma after the
 * first range's own bound into that range's "to" expression, producing
 * garbage (confirmed this was exactly the previous bug: a single `to` match
 * against the WHOLE comma list emitted the remaining ranges as raw,
 * unparsed expression text). Each part becomes its own stacked Dart case
 * label - Dart's empty-case-falls-through-to-shared-body semantics apply
 * whether the stacked labels are plain `case V:` or guarded `case var _
 * when ...:` (both are ordinary switch cases as far as fallthrough/sharing
 * a body goes), so a mix of ranges and plain values in one comma-list all
 * still share the ONE body that follows.
 */
function translateCaseLabel(rest, env) {
    const parts = splitTopLevelCommas(rest).map(p => p.trim());
    return parts.map(part => {
        const rangeMatch = /^(.+?)\s+to\s+(.+)$/.exec(part);
        if (rangeMatch) {
            const from = translateExpr(rangeMatch[1].trim(), env);
            const to = translateExpr(rangeMatch[2].trim(), env);
            return `case var _smlCaseValue when _smlCaseValue >= ${from} && _smlCaseValue <= ${to}:`;
        }
        // A plain literal/bare-identifier value uses Dart's classic `case
        // VALUE:` label; anything else (e.g. `case Chr(34):` -> `SmlStr.
        // fromCode(34)`, a real function call - confirmed real in the
        // corpus) is NOT a compile-time constant, so it uses the same
        // var-pattern + `when`-guard form as a range above - a pattern that
        // always matches, filtered by an equality check, works for ANY
        // runtime expression regardless of constant-ness.
        const v = translateExpr(part, env);
        return isCaseConstant(v) ? `case ${v}:` : `case var _smlCaseValue when _smlCaseValue == ${v}:`;
    }).join('\n');
}

// ===========================================================================
// 6. SML type -> Dart type (mirrors UltimateTemplateController::
//    smlTypeToDart() on the PHP side exactly - kept in sync deliberately,
//    since `var` declarations are the one place this translator needs its
//    own copy rather than reading a value the PHP side already resolved).
// ===========================================================================

function smlTypeToDart(smlType, env) {
    smlType = (smlType || '').trim();
    const simple = {
        int: 'int', real: 'double', currency: 'double', bool: 'bool',
        string: 'String', buffer: 'Uint8List', date: 'DateTime',
        time: 'DateTime', datetime: 'DateTime', variant: 'dynamic',
        any: 'dynamic', void: 'void',
    };
    if (Object.prototype.hasOwnProperty.call(simple, smlType)) {
        return simple[smlType];
    }
    if (smlType.startsWith('array<') && smlType.endsWith('>')) {
        return 'List<' + smlTypeToDart(smlType.slice(6, -1), env) + '>';
    }
    if (smlType.startsWith('map<') && smlType.endsWith('>')) {
        const parts = splitTopLevelCommas(smlType.slice(4, -1));
        if (parts.length === 2) {
            return 'Map<' + smlTypeToDart(parts[0], env) + ', ' + smlTypeToDart(parts[1], env) + '>';
        }
        return 'Map<dynamic, dynamic>';
    }
    if (smlType.startsWith('record<') && smlType.endsWith('>')) {
        // Mirrors UltimateTemplateController.php's smlTypeToDart() `record<X>`
        // fallback EXACTLY (this JS copy had drifted out of sync - confirmed
        // real: `List<stArrIdentOriginal> arrEmpty = [];` - a project whose
        // SML code references a struct that was NEVER actually imported into
        // `ui_project_structs`, same "resolver vs validator drift" trap this
        // codebase's own memory notes already warn about) - `env.structsByName`
        // is the SAME real-struct-name source the rest of this file already
        // uses (buildStructsByName()), so no separate list needs threading
        // through.
        const structName = smlType.slice(7, -1).trim();
        const isKnownStruct = env && env.structsByName && env.structsByName.has(structName.toLowerCase());
        return isKnownStruct ? structName : 'dynamic';
    }
    return 'dynamic';
}

// ===========================================================================
// 7. Public entry point
// ===========================================================================

/**
 * Translates one event/procedure's SML body into a Dart statement block's
 * CONTENTS (no enclosing braces - the caller's own function/method
 * signature supplies those). `gtree` is the full gtree (see point 3 above)
 * used to compute the async-procedure map; pass the SAME gtree every call
 * within one generation pass - it's cheap to recompute (bounded by the
 * project's own procedure count) and every {:code:} block already gets it
 * for free as a global. `controlNames` (optional) lists the bare control
 * names that are valid, ctx-backed bare references for THIS snippet's
 * window (see translateExpr()'s bare-control-read handling and
 * translateSet()'s bare-control-write handling) - omit/pass [] for
 * snippets with no owning window context (global procedures, project init;
 * confirmed by real-corpus scan that neither ever uses this shorthand).
 * `globalNames` (optional) lists every project global's bare name - unlike
 * controlNames this is the SAME list for every snippet in a project (a
 * global has no owning window) - see app_globals.dart.
 */
/**
 * WLanguage identifiers are case-insensitive (confirmed in the real corpus:
 * a control declared "Table" is referred to as `TABLE`/`table` elsewhere; a
 * global declared "garrSubscriber" is referred to as `garrsubscriber`) - a
 * lowercase-keyed Map lets a case-insensitive lookup still recover the
 * canonically-declared spelling to emit (the one the Dart field/registry
 * key actually uses).
 */
function toCaseInsensitiveNameMap(names) {
    const map = new Map();
    for (const name of (names || [])) {
        map.set(name.toLowerCase(), name);
    }
    return map;
}

/** Same idea as toCaseInsensitiveNameMap(), but for {name, dart_type}
 * global descriptors (see translateSet()'s int/double cast handling). */
function toGlobalNameMap(globals) {
    const map = new Map();
    for (const g of (globals || [])) {
        map.set(g.name.toLowerCase(), g);
    }
    return map;
}

/**
 * `{ LooperName: [subControlName, ...] }` -> a case-insensitive nested Map
 * (looper name -> Set of lowercase sub-control names) used by translateExpr()
 * to tell `LooperName[i].SubControl` (a CONTROL REFERENCE - see the row-
 * access handling below) apart from `TableName[i].ColumnName` (plain row
 * DATA - a Table has no row-template sub-controls in this data model, so it
 * never appears here at all).
 */
function toLooperRowControlMap(loopers) {
    const map = new Map();
    for (const looperName of Object.keys(loopers || {})) {
        const subControls = new Set((loopers[looperName] || []).map(n => n.toLowerCase()));
        map.set(looperName.toLowerCase(), subControls);
    }
    return map;
}

/**
 * Case-insensitive union of every project struct's own field names (lower
 * -> canonical declared casing) - used by translateExpr()'s struct-field-
 * access handling (any bare `.field` read) to apply the SAME WLanguage
 * case-insensitivity already applied to controls/globals/procedures.
 * Confirmed real and necessary: `AppGlobals.garrCashRegisters[i-1].
 * Cash_register`/`...garrSubscriber[i-1].Description` reference struct
 * fields declared `cash_register`/`description` (lowercase) - a plain
 * casing mismatch between the RAD-generated reader code and the struct's
 * own declared field name, exactly analogous to a control/global referenced
 * under a different case elsewhere in the same real corpus. A UNION across
 * ALL structs (rather than resolving each field access's OWN struct type
 * first) is deliberate: struct field naming is consistent project-wide in
 * every real case seen (a `description` field is always lowercase
 * everywhere it appears), and per-access type resolution would need full
 * static type inference through arbitrarily nested `vRecord[i].field`
 * chains this translator does not build (see resolveListElementType()'s own
 * "bare identifier only" limitation) - a project-wide union gets the same
 * real-world correction for a small fraction of the engineering cost, with
 * no observed casing collision between structs to make it ambiguous.
 */
function buildStructFieldCasingMap(structsByName) {
    const map = new Map();
    for (const fields of structsByName.values()) {
        for (const [key, f] of fields) {
            if (!map.has(key)) { map.set(key, f.name); }
        }
    }
    return map;
}

/**
 * `{ structNameLower: { fieldNameLower: {name, dart_type}, ... }, ... }` -
 * every project struct's own fields, keyed for case-insensitive lookup by
 * BOTH struct name and field name. Feeds buildStructFieldCasingMap() above
 * (a flat union, for correcting a mis-cased field reference) and
 * resolveListElementType()'s compound-path resolution below (which needs
 * to walk INTO a specific struct's OWN field types, not just names).
 */
function buildStructsByName(gtree) {
    const map = new Map();
    const structs = (gtree[0].project[0].structs) || [];
    for (const s of structs) {
        const fields = new Map();
        for (const f of (s.fields || [])) {
            if (!f.name) { continue; }
            fields.set(f.name.toLowerCase(), f);
        }
        map.set((s.name || '').toLowerCase(), fields);
    }
    return map;
}

/**
 * Case-insensitive map of a WINDOW's own declarations-scoped names (both
 * `var` lines and `// event parameters: ...` entries - see
 * translateDeclarationsToFields()) to `{name, dart_type}`, lower ->
 * canonical - same shape/purpose as toGlobalNameMap() but for a window's
 * OWN private fields rather than project-wide globals. Confirmed real and
 * necessary: WIN_Password_change declares `sUserName` (an event parameter)
 * but its own button-click code refers back to it as `susername` elsewhere
 * - WLanguage identifiers are case-insensitive for a window's own
 * declarations exactly as much as they are for controls/globals/procedures,
 * and until this existed a differently-cased reference fell all the way
 * through translateExpr()'s bare-identifier chain unresolved (a hard
 * "getter/setter not defined" compile error, since the declared FIELD only
 * exists under its own canonical casing on the generated State class).
 * Empty for snippets with no owning window (global procedures, project
 * init) - identical scoping rule as controlNames.
 */
function toDeclarationNameMap(declarationNames) {
    const map = new Map();
    for (const d of (declarationNames || [])) {
        if (d && d.name) { map.set(d.name.toLowerCase(), d); }
    }
    return map;
}

/** Builds the shared per-snippet translation environment - see
 * translateSmlToDart()'s own parameter docs for what each piece means. */
function buildEnv(gtree, controlNames, globalNames, selfControlName, loopers, declarationNames, windowIndex, deferCtxCalls) {
    const asyncMap = computeAsyncProcedureMap(gtree, windowIndex);
    const structsByName = buildStructsByName(gtree);
    return {
        // Only ever true for the PROJECT's own init code (see
        // ProjectInitQueue's own doc comment for the full "why") - every
        // other caller (window events/procedures, global procedures,
        // globals-init) leaves this false/undefined and keeps using `ctx`
        // directly, unchanged.
        deferCtxCalls: !!deferCtxCalls,
        asyncMap: asyncMap,
        ctxMap: computeWindowContextMap(gtree, windowIndex),
        globalProcedureNames: new Set((gtree[0].project[0].globalprocedures || []).map(p => p.name)),
        // Case-insensitive procedure-name lookup, used by translateExpr()'s
        // `timer.start("Name", ...)` handling to resolve a STRING-named
        // timer target back to the real procedure it names (WinDev's Timer
        // idiom: the timer's name matches the procedure it calls on each
        // tick) - see that handling's own doc comment for the full
        // rationale.
        procedureNameMap: toCaseInsensitiveNameMap(Object.keys(asyncMap)),
        controlNames: toCaseInsensitiveNameMap(controlNames),
        globalNames: toGlobalNameMap(globalNames),
        // `ui.SELF` (see translateExpr()) - only meaningful when this
        // snippet IS one specific control's own event code; undefined
        // everywhere else (window events, procedures, project init - `ui.
        // SELF` never appears there per a real-corpus scan).
        selfControlName: selfControlName || null,
        looperRowControls: toLooperRowControlMap(loopers),
        structsByName: structsByName,
        structFieldCasing: buildStructFieldCasingMap(structsByName),
        declarationNames: toDeclarationNameMap(declarationNames),
        // Real DB table names (see UltimateTemplateController.php's own
        // `knowntablenames` doc comment) - case-insensitive lower -> real
        // casing, same shape as controlNames/globalNames. Backs
        // translateExpr()'s `TableName.FieldName` HFSQL current-record-
        // buffer resolution below.
        tableNames: toCaseInsensitiveNameMap(gtree[0].project[0].knowntablenames || []),
        // Populated incrementally by translateVarDecl() as `var` lines are
        // translated (SML is straight-line/block-scoped like C, so a name
        // declared earlier in this snippet stays visible for the rest of
        // it) - lets translateSet() apply the same `num` -> `int`/`double`
        // narrowing cast to a LOCAL variable that AppGlobals' own writes
        // already get (see translateSet()'s doc comment) - confirmed real:
        // `var nCode: int` followed later by `set nCode = num.parse(...)`
        // hits the identical num/int mismatch a global's default_value does.
        localTypes: new Map(),
    };
}

/**
 * Bare names THIS procedure's own body `set`s but never declares itself
 * (not a `var` line anywhere in `logicalLines`, not one of its own
 * parameters, and not a control/global/declarations-field env already
 * resolves) - WLanguage's "internal procedure lifted to unit level"
 * conversion artifact (see the SML converter's own `// TODO: internal
 * procedure X was lifted to unit level` comment) is the confirmed real
 * cause: a WinDev procedure originally NESTED inside another one shares
 * its outer procedure's local variables by closure; once lifted to a
 * top-level procedure (required for targets without WinDev's nested-
 * procedure scoping), those outer locals are no longer declared anywhere
 * the lifted body can see, while the body still references them exactly as
 * before (`Json2WinDev__MakePHPAssociative` referencing `n`, a local of
 * the outer `Json2WinDev`). Since every confirmed real case only ever uses
 * such a name as a short-lived WITHIN-THIS-CALL working variable (assigned
 * fresh via `SmlArr.add(...)` before every read), giving it its own fresh
 * `dynamic` local at the top of THIS procedure reproduces the same
 * behaviour the shared closure variable would have had, without needing to
 * actually thread state between the lifted procedure and whichever one it
 * came from.
 */
/**
 * SML keywords that can appear as bare words inside a procedure body but
 * are never themselves a variable/value reference - excludes a
 * control-flow keyword or literal from ever being mistaken for an
 * implicit local by collectBareReadNames() below.
 */
const SML_STATEMENT_KEYWORDS = new Set([
    'if', 'elseif', 'else', 'switch', 'case', 'default', 'for', 'foreach', 'while', 'loop',
    'try', 'catch', 'finally', 'var', 'set', 'call', 'return', 'break', 'continue', 'throw',
    'true', 'false', 'null', 'to', 'in', 'step', 'raw', 'todo',
]);

/**
 * Every bare word READ anywhere in `logicalLines` (as opposed to
 * collectImplicitLocals()'s own `set`-target scan, which only catches a
 * never-declared name on its WRITE side) - lower-cased name -> its
 * first-seen casing. Excludes: the second half of a dotted access (`x` in
 * `owner.x`), a call target (`x` in `x(...)`, resolved separately - either
 * a known procedure or the "unmapped WinDev function" TODO closure, never
 * needs a local), and any SML statement keyword. String literals are
 * blanked out first (same length, so column positions used by the dot/
 * paren lookahead below still line up) so a word INSIDE one is never
 * mistaken for a real reference. Trailing comments are stripped via the
 * same splitTrailingComment() every other statement-line branch already
 * uses, for the same reason - a comment's own prose shouldn't be scanned
 * as code.
 */
function collectBareReadNames(logicalLines) {
    const found = new Map();
    const idRe = /[A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*/g;
    for (const line of logicalLines) {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('|')) { continue; }
        let { code } = splitTrailingComment(trimmed);
        // A `var name: type [= initializer]` line's OWN "name: type" part is
        // never a value reference (the type name isn't a variable - `var
        // sOutput: string` would otherwise wrongly flag "string" itself as
        // needing its own implicit local) - only its initializer expression,
        // if any, can contain a real bare read (confirmed real:
        // `var nSeparatorPosition: int = str.index_of(FilterVal, "=") + 1`).
        if (code.startsWith('var ')) {
            const rest = code.slice(3).trim();
            const colon = rest.indexOf(':');
            const afterColon = colon === -1 ? '' : rest.slice(colon + 1);
            const eq = afterColon === '' ? -1 : findTopLevelEquals(afterColon);
            code = eq === -1 ? '' : afterColon.slice(eq + 1);
        }
        const stripped = code.replace(/"(?:[^"\\]|\\.)*"/g, (m) => ' '.repeat(m.length));
        idRe.lastIndex = 0;
        let m;
        while ((m = idRe.exec(stripped)) !== null) {
            const word = m[0];
            const start = m.index;
            const end = start + word.length;
            if (start > 0 && stripped[start - 1] === '.') { continue; }
            if (stripped[end] === '.') { continue; }
            let k = end;
            while (k < stripped.length && stripped[k] === ' ') { k++; }
            if (stripped[k] === '(') { continue; }
            const lower = word.toLowerCase();
            if (SML_STATEMENT_KEYWORDS.has(lower)) { continue; }
            if (!found.has(lower)) { found.set(lower, word); }
        }
    }
    return found;
}

const FOR_HEADER_RE = /^for\s+(\w+)\s*=/;
const FOREACH_HEADER_RE = /^foreach\s+(\w+)\s+in\s+/;
const CATCH_HEADER_RE = /^catch\s+(\w+)\s*\{?\s*$/;

function collectImplicitLocals(logicalLines, env) {
    const declaredHere = new Set(env.localTypes.keys());
    const setTargets = new Map();

    for (const line of logicalLines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('var ')) {
            const rest = trimmed.slice(3).trim();
            const colon = rest.indexOf(':');
            if (colon !== -1) {
                declaredHere.add(rest.slice(0, colon).trim());
            }
            continue;
        }
        // `for NAME = a to b [step c] {`/`foreach NAME in EXPR {`/
        // `catch NAME {` all declare NAME themselves (see
        // translateBlockHeader() - each becomes a real Dart `for (var
        // NAME = ...)`/`for (final NAME in ...)`/`catch (NAME)`), exactly
        // like a `var` line does - NOT a "never declared" bare read/write,
        // even though collectBareReadNames() has no way to tell that from
        // the header line's own bare "NAME" appearing in it (or from every
        // read of NAME inside the loop/catch body). Without this, EVERY
        // for-loop/foreach/catch in the entire real corpus would falsely
        // report its own loop/exception variable as undeclared - confirmed
        // real (`for i = 1 to json.count(vResult) { ... }`, `catch error {
        // ... sys.error_info(...) ... }`) and NOT rare (a for-loop is one
        // of the most common WLanguage constructs there is).
        const forMatch = FOR_HEADER_RE.exec(trimmed);
        if (forMatch) { declaredHere.add(forMatch[1]); continue; }
        const foreachMatch = FOREACH_HEADER_RE.exec(trimmed);
        if (foreachMatch) { declaredHere.add(foreachMatch[1]); continue; }
        const catchMatch = CATCH_HEADER_RE.exec(trimmed);
        if (catchMatch) { declaredHere.add(catchMatch[1]); continue; }
        if (!trimmed.startsWith('set ')) { continue; }
        const afterSet = trimmed.slice(3).trim();
        const eq = findTopLevelEquals(afterSet);
        if (eq === -1) { continue; }
        const lvalue = afterSet.slice(0, eq).trim();
        if (/^[A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*$/.test(lvalue)) {
            setTargets.set(lvalue.toLowerCase(), lvalue);
        }
    }

    // Bare READS of a never-declared name (see collectBareReadNames()'s own
    // doc comment) - confirmed real and NOT rare: this real project's
    // `SuspendRefresh` procedure (repeated across ~40 windows, one per
    // table's own copy) reads `sSuspend` (`if sSuspend == true`) despite
    // being imported with ZERO declared parameters - confirmed a genuine
    // SML-import gap, not a translator design question, by its OWN
    // sibling call site elsewhere passing it an argument
    // (`call SuspendRefresh(sSuspend == true)`) that a 0-param Dart method
    // could never accept either. `InitialFilter`/`FilterVal` is the same
    // shape. Merged with the `set`-target scan above through the same
    // exclusion rules.
    const readNames = collectBareReadNames(logicalLines);

    const declaredHereLower = new Set(Array.from(declaredHere, n => n.toLowerCase()));
    const seen = new Set();
    const implicit = [];
    const consider = (lower, name) => {
        if (seen.has(lower)) { return; }
        if (declaredHereLower.has(lower)) { return; }
        if (env.controlNames && env.controlNames.has(lower)) { return; }
        if (env.globalNames && env.globalNames.has(lower)) { return; }
        if (env.declarationNames && env.declarationNames.has(lower)) { return; }
        if (env.procedureNameMap && env.procedureNameMap.has(lower)) { return; }
        if (KNOWN_BARE_CONSTANTS.has(name) || WINDEV_CONSTANT_RE.test(name)) { return; }
        seen.add(lower);
        implicit.push(name);
    };
    for (const [lower, name] of setTargets) { consider(lower, name); }
    for (const [lower, name] of readNames) { consider(lower, name); }
    return implicit;
}

/**
 * The exact same "never-declared identifier" detection translateSmlToDart()
 * uses to decide what gets a silent `dynamic X;` auto-declaration - exposed
 * as its own function so the PHP side can surface these as a real,
 * user-visible generation error (a typo'd/never-declared SML variable
 * should stop generation with a clear message, not silently compile into a
 * field that stays `null` forever) WITHOUT duplicating the detection logic
 * itself: same buildEnv() call, same param pre-seeding, same
 * collectImplicitLocals() - if that logic ever changes, this can never
 * drift out of sync with what actually gets auto-declared, because it's
 * the same code path.
 */
function collectUndeclaredVariables(smlCode, gtree, controlNames, globalNames, selfControlName, loopers, params, declarationNames, windowIndex) {
    if (!smlCode || smlCode.trim() === '') {
        return [];
    }
    const env = buildEnv(gtree, controlNames, globalNames, selfControlName, loopers, declarationNames, windowIndex);
    for (const p of (params || [])) {
        env.localTypes.set(p.name, p.dart_type);
    }
    const logicalLines = toLogicalLines(smlCode);
    return collectImplicitLocals(logicalLines, env);
}

function translateSmlToDart(smlCode, gtree, controlNames, globalNames, selfControlName, loopers, params, declarationNames, windowIndex, deferCtxCalls) {
    if (!smlCode || smlCode.trim() === '') {
        return '';
    }
    const env = buildEnv(gtree, controlNames, globalNames, selfControlName, loopers, declarationNames, windowIndex, deferCtxCalls);
    // A procedure's own parameters behave exactly like locally-declared
    // `var`s for type-tracking purposes (env.localTypes - see
    // translateVarDecl()'s doc comment and translateArrAdd() below) - pre-
    // seed them before translating the body, since a `var` line inside the
    // body can never declare them again to do it naturally.
    for (const p of (params || [])) {
        env.localTypes.set(p.name, p.dart_type);
    }
    const logicalLines = toLogicalLines(smlCode);
    const implicitLocals = collectImplicitLocals(logicalLines, env);
    for (const name of implicitLocals) {
        env.localTypes.set(name, 'dynamic');
    }
    const implicitLocalsDart = implicitLocals.map(name => `dynamic ${name};\n`).join('');
    return implicitLocalsDart + translateStatements(logicalLines, 0, logicalLines.length, 0, env);
}

/**
 * Translates a window's "declarations" event SPECIALLY, not through
 * translateSmlToDart() - WinDev's `declarations` event is a `var`-only block
 * (confirmed real: every real declarations event seen is a flat list of
 * `var name: type [= expr]` lines, sometimes with comments, never control
 * flow) whose variables behave like PRIVATE INSTANCE FIELDS of the window -
 * visible to every one of that window's event handlers/local procedures,
 * NOT scoped to just one method. Emitting them as `var` statements inside
 * `_runWindowInit()` (the original approach) made them invisible everywhere
 * else - confirmed real and broken: a window's Timer callback referencing a
 * `declarations`-declared counter like `gnTimerNo` got "undefined name"
 * because that counter was a local variable of a DIFFERENT method.
 *
 * Returns `{ fields, initStatements }`:
 *   - `fields` - one class-level field declaration per `var` line, with a
 *     plain zero-value default (see defaultDartValue()) - NEVER the real
 *     SML initializer expression directly, for the identical reason
 *     AppGlobals' fields don't either (a field initializer can't `await`,
 *     and Dart field initializers can't reference constructor
 *     parameters/`this` the way a method body can).
 *   - `initStatements` - one plain assignment per `var` line THAT HAD a
 *     real SML initializer, meant to run once from `_runWindowInit()`
 *     (before the `init` event's own code) - exactly the same
 *     "zero-default field + separate real-value-assigning init step" shape
 *     as AppGlobals/AppGlobals.init().
 * A non-`var` line (never seen in practice, but never silently dropped
 * either) becomes a TODO comment in `fields` instead of being guessed at.
 */
function translateDeclarationsToFields(smlCode, gtree, controlNames, globalNames, loopers, windowIndex) {
    if (!smlCode || smlCode.trim() === '') {
        return { fields: '', initStatements: '', fieldNames: [] };
    }
    const env = buildEnv(gtree, controlNames, globalNames, null, loopers, undefined, windowIndex);
    const logicalLines = toLogicalLines(smlCode);
    let fields = '';
    let initStatements = '';
    // Every field this pass declares (name + dart_type), returned to the
    // caller (attachDartTranslations()) so it can thread them into every
    // OTHER snippet belonging to this SAME window as `declarationNames` -
    // see toDeclarationNameMap()'s own doc comment for why a window's
    // declarations fields need the identical case-insensitive treatment
    // controls/globals already get.
    const fieldNames = [];

    for (const line of logicalLines) {
        const trimmed = line.trim();
        if (trimmed === '') { continue; }

        // `on window declarations(params)` - WinDev's window-open-time
        // constructor parameters (`OpeningMode`, `gnID`, ...). The SML
        // converter records these as ONE machine-generated comment line
        // appended to the window's own `declarations` event (confirmed
        // real: `// event parameters: gnID: int = 0, OpeningMode: any =
        // "Browse"`), same `name: type [= default]` shape as a procedure's
        // own param list. Real constructor-parameter wiring (the opening
        // window passing real values in) is a separate, larger, still
        // out-of-scope prerequisite (%1_page.dart's StatefulWidget would
        // need real constructor args) - so, like AppGlobals/declarations
        // vars, each becomes a State field seeded with its OWN declared
        // default value (a literal every real case seen uses) rather than
        // whatever the ACTUAL caller might have passed - compiles and
        // behaves exactly as if every window were always opened with its
        // documented defaults, which is honest given no real values flow
        // in yet anyway.
        const eventParamsMatch = /^\/\/\s*event parameters:\s*(.+)$/i.exec(trimmed);
        if (eventParamsMatch) {
            for (const rawSegment of splitTopLevelCommas(eventParamsMatch[1])) {
                const segment = rawSegment.trim();
                const colon = segment.indexOf(':');
                if (colon === -1) { continue; }
                const paramName = segment.slice(0, colon).trim();
                const afterColon = segment.slice(colon + 1).trim();
                const eq = findTopLevelEquals(afterColon);
                const smlType = eq === -1 ? afterColon.trim() : afterColon.slice(0, eq).trim();
                const dartType = smlTypeToDart(smlType, env);
                env.localTypes.set(paramName, dartType);
                fieldNames.push({ name: paramName, dart_type: dartType });

                if (dartTypeIsNullableByDefault(dartType)) {
                    fields += `${dartType}? ${paramName};\n`;
                } else {
                    fields += `${dartType} ${paramName} = ${defaultDartValue(dartType)};\n`;
                }
                if (eq !== -1) {
                    let translated = translateExpr(afterColon.slice(eq + 1).trim(), env);
                    if (dartType === 'int') {
                        translated = `(${translated}).toInt()`;
                    } else if (dartType === 'double') {
                        translated = `(${translated}).toDouble()`;
                    }
                    initStatements += `${paramName} = ${translated};\n`;
                }
            }
            continue;
        }

        if (trimmed.startsWith('//')) { fields += trimmed + '\n'; continue; }

        const { code: trimmedCode, comment: trailingComment } = splitTrailingComment(trimmed);
        const suffix = trailingComment ? '  ' + trailingComment : '';
        const firstWord = trimmedCode.split(/[\s({]/)[0];

        if (firstWord !== 'var') {
            // A real executable statement inside a "declarations" event -
            // confirmed real (`EDT_ServerIP = gsDB_IP`, assigning a
            // control's initial value from a window-scoped var declared
            // earlier in this SAME event) - WinDev's own Declarations code
            // section isn't purely static declarations, it can contain
            // ordinary initialization statements too, executed once like
            // any other window-init code (see _runWindowInit() in
            // %1_page.dart, which already runs `initStatements` before the
            // window's OWN "init" event). Reuses the SAME general statement
            // dispatcher every other event/procedure body goes through
            // (`translateStatements()` on a single-line range) rather than
            // hand-rolling a second, parallel "set"/"call"/bare-assignment
            // recognizer here - one source of truth, automatically gets
            // any future addition to that dispatcher for free. Deliberately
            // excludes a BLOCK-opening keyword (`if`/`for`/...): a real
            // multi-line block needs its own end-of-block scan across the
            // REST of this event's lines, which this single-line path
            // can't safely do - falls back to the old, honest TODO comment
            // for that one case instead of risking a truncated/malformed
            // translation.
            if (BLOCK_KEYWORDS.has(firstWord)) {
                fields += '// TODO: unexpected declarations statement: ' + trimmedCode + suffix + '\n';
            } else {
                initStatements += translateStatements([line], 0, 1, 0, env);
            }
            continue;
        }

        const rest = trimmedCode.slice(3).trim();
        const colon = rest.indexOf(':');
        if (colon === -1) {
            fields += '// TODO: malformed var declaration: ' + trimmedCode + suffix + '\n';
            continue;
        }
        const name = rest.slice(0, colon).trim();
        const afterColon = rest.slice(colon + 1).trim();
        const eq = findTopLevelEquals(afterColon);
        const smlType = eq === -1 ? afterColon.trim() : afterColon.slice(0, eq).trim();
        const dartType = smlTypeToDart(smlType, env);
        fieldNames.push({ name, dart_type: dartType });

        if (dartTypeIsNullableByDefault(dartType)) {
            fields += `${dartType}? ${name};${suffix}\n`;
        } else {
            fields += `${dartType} ${name} = ${defaultDartValue(dartType)};${suffix}\n`;
        }

        if (eq !== -1) {
            const initExpr = afterColon.slice(eq + 1).trim();
            let translated = translateExpr(initExpr, env);
            if (dartType === 'int') {
                translated = `(${translated}).toInt()`;
            } else if (dartType === 'double') {
                translated = `(${translated}).toDouble()`;
            }
            initStatements += `${name} = ${translated};${suffix}\n`;
        }
    }

    return { fields, initStatements, fieldNames };
}

/**
 * Whether translateSmlToDart() would emit any `await` for this code (either
 * a direct async namespace call or a call to a transitively-async
 * procedure) - the caller uses this to decide whether the enclosing Dart
 * method/callback needs the `async` keyword.
 */
function smlNeedsAsyncDart(smlCode, gtree, windowIndex) {
    if (!smlCode) return false;
    if (directlyCallsAsyncFunction(smlCode)) return true;
    const asyncMap = computeAsyncProcedureMap(gtree, windowIndex);
    for (const target of bareCallTargets(smlCode)) {
        if (asyncMap[target]) return true;
    }
    return false;
}

/**
 * Whether this code needs a live window (directly calls ui./win./dlg./
 * rpt./timer., or calls a procedure that transitively does) - the caller
 * (global_procedures.dart's generation) uses this to decide whether a
 * GLOBAL procedure needs an extra leading `SmlWindowContext ctx` parameter.
 * Meaningless for window events/local procedures (they always have `ctx`
 * as a State field regardless) - only ever consulted for
 * `globalprocedure.needs_window_context`.
 */
function smlNeedsWindowContext(smlCode, gtree, windowIndex) {
    if (!smlCode) return false;
    if (directlyUsesWindowScopedNamespace(smlCode)) return true;
    const ctxMap = computeWindowContextMap(gtree, windowIndex);
    for (const target of bareCallTargets(smlCode)) {
        if (ctxMap[target]) return true;
    }
    return false;
}
