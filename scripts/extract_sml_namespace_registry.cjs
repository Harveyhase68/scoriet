#!/usr/bin/env node
// Extracts the REAL, currently-implemented function names for every SML
// runtime namespace directly from the Flutter SML Template's own runtime
// library source (scripts/flutter_sml_template/lib/core/sml_runtime/) and
// writes a generated TypeScript registry the Window Designer's Code Editor
// linter uses to catch a misspelled namespaced call (e.g. `str.lfet(...)`)
// live, without a popup - see smlParser.ts.
//
// WHY extract instead of hand-maintaining a list: sml_to_dart.js (the real
// translator) does NOT validate function names against anything - it just
// mechanically converts `ns.fn_name(...)` to `ns.fnName(...)` and trusts
// the Dart compiler to catch a typo (see its own toCamelCase() doc
// comment). That means the CORRESPONDING Dart file (lib_<ns>.dart, or
// sml_<ns>_context.dart for the five window-scoped namespaces) is the only
// real source of truth for "does this function actually exist" - hand-
// copying that list here would silently drift out of sync the next time a
// runtime library gains a function. Re-run this script (`node
// scripts/extract_sml_namespace_registry.js`) whenever that happens.
//
// Reverses the SAME mechanical camelCase conversion sml_to_dart.js's own
// toCamelCase() applies going the other way (snake_case -> camelCase) -
// including its DART_KEYWORD_OVERRIDES table (assertLog/yield_/rethrow_) -
// so the registry's spelling always matches what a real SML author would
// type, not the Dart method name.
'use strict';

const fs = require('fs');
const path = require('path');

const RUNTIME_DIR = path.join(__dirname, 'flutter_sml_template', 'lib', 'core', 'sml_runtime');
const OUTPUT_FILE = path.join(__dirname, '..', 'resources', 'js', 'lib', 'smlNamespaceRegistry.ts');

// Stateless namespaces: one plain static class per file, `lib_<ns>.dart`.
// `map`/`draw`/`ftp`/`sock`/`rpt`(namespace, not the file below)/`i18n` are
// deliberately NOT all included - only namespaces with a REAL
// implementation file are extracted; see smlParser.ts's own doc comment on
// why an namespace with zero known functions is skipped entirely during
// validation rather than treated as "every call is invalid".
const STATIC_LIB_FILES = {
    str: 'lib_str.dart',
    num: 'lib_num.dart',
    arr: 'lib_arr.dart',
    dt: 'lib_dt.dart',
    db: 'lib_db.dart',
    sql: 'lib_sql.dart',
    http: 'lib_http.dart',
    ftp: 'lib_ftp.dart',
    sock: 'lib_sock.dart',
    json: 'lib_json.dart',
    crypt: 'lib_crypt.dart',
    file: 'lib_file.dart',
    log: 'lib_log.dart',
    sys: 'lib_sys.dart',
    draw: 'lib_draw.dart',
};

// Window-scoped namespaces: instance methods on a real SmlWindowContext
// sub-object, `sml_<ns>_context.dart` (NOT sml_window_context.dart itself -
// that's the container class, not a namespace).
const INSTANCE_CONTEXT_FILES = {
    ui: 'sml_ui_context.dart',
    dlg: 'sml_dlg_context.dart',
    win: 'sml_win_context.dart',
    rpt: 'sml_rpt_context.dart',
    timer: 'sml_timer_context.dart',
};

// Mirrors sml_to_dart.js's DART_KEYWORD_OVERRIDES, reversed (Dart name ->
// SML name) - keep in sync if that table ever changes.
const REVERSE_KEYWORD_OVERRIDES = { assertLog: 'assert', yield_: 'yield', rethrow_: 'rethrow' };

// camelCase -> snake_case, the exact inverse of sml_to_dart.js's
// toCamelCase(). "readFirst" -> "read_first", "codeAt" -> "code_at".
function toSnakeCase(camel) {
    if (Object.prototype.hasOwnProperty.call(REVERSE_KEYWORD_OVERRIDES, camel)) {
        return REVERSE_KEYWORD_OVERRIDES[camel];
    }
    return camel.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

// A word immediately preceding "name(" that means this is a STATEMENT
// (a call site, inside some OTHER method's body) rather than a
// declaration - `await openWindowModal(id);`/`return foo(x);`/`throw
// Bar(...)` all have the exact same textual shape a real declaration does
// ("word word(") with nothing structural to tell them apart on this one
// line alone (no real Dart parser/brace-depth tracking here - see this
// script's own header comment on why a line-oriented scan is good enough
// for a REGISTRY extraction tool, not full validation).
const STATEMENT_LEADING_WORDS = new Set(['await', 'return', 'throw', 'yield', 'new', 'else', 'print', 'in', 'on']);

// Genuine Dart control-flow keywords that can appear alone right before
// "(" (`if (x)`, `while (y)`, `} else if (z)`, `switch (w)`, `catch (e)`) -
// never a real method NAME even though nothing about the shape above rules
// them out on their own.
const CONTROL_FLOW_WORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'else', 'do']);

// Drops the CONTENTS of every '...'/"..." string literal on the line
// (never just the quotes) - a doc/error-message string can itself contain
// plain-English text that happens to look like "word word(" (e.g. "...is
// not implemented (WinDev's own..."), which would otherwise be misread as
// a declaration once its own "(" is reached. Single-line only, matching
// this codebase's own style of one string literal (or several implicitly
// concatenated ones) per physical line - see this script's own header
// comment on why a line-oriented scan is an accepted, disclosed
// limitation here.
function stripDartStringLiterals(line) {
    let result = '';
    let i = 0;
    while (i < line.length) {
        const ch = line[i];
        if (ch === '"' || ch === "'") {
            const quote = ch;
            i++;
            while (i < line.length) {
                if (line[i] === '\\') { i += 2; continue; }
                if (line[i] === quote) { i++; break; }
                i++;
            }
            continue;
        }
        if (ch === '/' && line[i + 1] === '/') break;
        result += ch;
        i++;
    }
    return result;
}

function extractMethodNames(filePath) {
    const text = fs.readFileSync(filePath, 'utf8');
    const names = new Set();
    for (const rawLine of text.split(/\r\n|\r|\n/)) {
        let line = rawLine.trim();
        if (!line || line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;
        line = stripDartStringLiterals(line);
        // Strip generic type-parameter/type-argument clauses (`<T>`,
        // `<K, V>`) wherever they appear - a generic method's OWN `<T>`
        // sits BETWEEN its name and `(` (`static int add<T>(List<T>
        // list...)`), which would otherwise break the "word right before
        // the first remaining `(`" rule below. Looped (not a single pass)
        // so nested generics of any depth (`Map<String, List<int>>`) are
        // fully removed, not just the innermost level.
        while (/<[^<>]*>/.test(line)) {
            line = line.replace(/<[^<>]*>/g, '');
        }

        const parenIndex = line.indexOf('(');
        if (parenIndex <= 0) continue; // no "(" at all, or nothing before it (e.g. a getter, or a bare call with no preceding type)
        const before = line.slice(0, parenIndex).trim();
        const words = before.split(/\s+/);
        // A genuine declaration always has AT LEAST "ReturnType name" (2+
        // words) before its own "(" - a bare `save();` call statement with
        // literally nothing preceding it is exactly what this rules out,
        // same reasoning as the STATEMENT_LEADING_WORDS check below for the
        // "something DOES precede it, but that something is a keyword, not
        // a type" case.
        if (words.length < 2) continue;

        const name = words[words.length - 1];
        const precedingWord = words[words.length - 2];
        if (!/^[A-Za-z_]\w*$/.test(name)) continue; // e.g. `operator ==(...)`
        if (name.startsWith('_')) continue; // private - never callable from SML
        // Dart convention: types/classes/constructors are UpperCamelCase,
        // methods/functions are lowerCamelCase - a capitalized "name" here
        // is always a false match, never a real callable function. Without
        // this, a constructor declaration (`const SmlDlgContext(this._ctx);`)
        // and a thrown/instantiated built-in type (`throw
        // UnimplementedError(...)`/`throw StateError(...)`) both get
        // misread as method declarations otherwise.
        if (/^[A-Z]/.test(name)) continue;
        if (CONTROL_FLOW_WORDS.has(name)) continue;
        if (STATEMENT_LEADING_WORDS.has(precedingWord)) continue;
        names.add(toSnakeCase(name));
    }
    return names;
}

const registry = {};

for (const [ns, file] of Object.entries(STATIC_LIB_FILES)) {
    const filePath = path.join(RUNTIME_DIR, file);
    if (!fs.existsSync(filePath)) continue;
    const names = extractMethodNames(filePath);
    if (names.size > 0) registry[ns] = names;
}

for (const [ns, file] of Object.entries(INSTANCE_CONTEXT_FILES)) {
    const filePath = path.join(RUNTIME_DIR, file);
    if (!fs.existsSync(filePath)) continue;
    const names = extractMethodNames(filePath);
    if (names.size > 0) registry[ns] = names;
}

const sortedNamespaces = Object.keys(registry).sort();
let out = '';
out += '// GENERATED FILE - do not hand-edit.\n';
out += '// Produced by scripts/extract_sml_namespace_registry.js from the Flutter SML\n';
out += '// Template\'s own runtime library source - re-run that script whenever\n';
out += '// lib_<ns>.dart/sml_<ns>_context.dart gains, renames, or removes a function.\n';
out += '// See that script\'s own header comment for why this is extracted rather\n';
out += '// than hand-maintained.\n';
out += '//\n';
out += `// Generated ${new Date().toISOString().slice(0, 10)}.\n\n`;
out += '// Every SML namespace with at least one REAL, currently-implemented\n';
out += '// function - a namespace with no entry here is one this runtime hasn\'t\n';
out += '// implemented at all yet (e.g. `map`), so smlParser.ts skips validating\n';
out += '// calls into it entirely rather than flagging every single call as\n';
out += '// "unknown" (see its own doc comment).\n';
out += 'export const SML_NAMESPACE_FUNCTIONS: Record<string, Set<string>> = {\n';
for (const ns of sortedNamespaces) {
    const names = [...registry[ns]].sort();
    out += `    ${ns}: new Set([${names.map((n) => `'${n}'`).join(', ')}]),\n`;
}
out += '};\n';

fs.writeFileSync(OUTPUT_FILE, out, 'utf8');

console.log(`Wrote ${OUTPUT_FILE}`);
for (const ns of sortedNamespaces) {
    console.log(`  ${ns}: ${registry[ns].size} functions`);
}
