// CodeMirror 6 language support for SML ("Scoriet Meta Language") - the
// event-code-behind language for Windows (see WindowDesignerPanel.tsx).
//
// Reuses the SAME @codemirror/* packages already installed for FileModal.tsx
// (StreamLanguage is part of @codemirror/language, already a dependency) -
// no new editor library, per explicit instruction. A StreamLanguage is a
// lightweight, single-pass tokenizer (as opposed to a full @lezer grammar),
// which is all a highlighter needs for a language this small; it is not an
// AST parser and does not validate SML syntax.
//
// Token type strings returned below ("keyword", "string", "comment", ...)
// are the classic CodeMirror style names - StreamLanguage's built-in token
// table maps them to the same @lezer/highlight tags (t.keyword, t.string, ...)
// that FileModal.tsx's lightHighlightStyle/oneDark already style, so SML
// renders correctly with zero extra highlight-style code.
import { StreamLanguage, StringStream } from '@codemirror/language';
import type { StreamParser } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { Annotation } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { linter, type Diagnostic } from '@codemirror/lint';
import { validateSml } from './smlValidator';
import { KEYWORDS, TYPES, ATOMS, NAMESPACES, BARE_BUILTINS } from './smlVocabulary';

interface SmlState {
    // No multi-line constructs in SML (no block comments, no multi-line
    // strings) - state exists only to satisfy the StreamParser contract.
    inRaw: boolean;
}

const smlParser: StreamParser<SmlState> = {
    startState(): SmlState {
        return { inRaw: false };
    },

    token(stream: StringStream, _state: SmlState): string | null {
        if (stream.eatSpace()) return null;

        // `raw <lang> at <line> | ...` passthrough lines - the '|'-prefixed
        // continuation lines carry foreign source (WLanguage etc.), so once
        // a `raw` block starts, subsequent '|' lines are left unstyled.
        if (stream.sol() && stream.match(/^\s*\|/)) {
            stream.skipToEnd();
            return 'string';
        }

        // Comments
        if (stream.match('//')) {
            stream.skipToEnd();
            return 'comment';
        }

        // Strings: double-quoted, with \\ \" \n \r \t \u{XXXX} escapes
        if (stream.peek() === '"') {
            stream.next();
            let escaped = false;
            for (;;) {
                const ch = stream.next();
                if (ch === undefined || (ch === '"' && !escaped)) break;
                escaped = !escaped && ch === '\\';
            }
            return 'string';
        }

        // Numbers (int and real, including exponent form)
        if (stream.match(/^\d+(\.\d+)?([eE][+-]?\d+)?/)) {
            return 'number';
        }

        // Identifiers / keywords / types / atoms / namespaced calls
        if (stream.match(/^[A-Za-z_][A-Za-z0-9_]*/)) {
            const word = stream.current();

            if (KEYWORDS.has(word)) return 'keyword';
            if (TYPES.has(word)) return 'type';
            if (ATOMS.has(word)) return 'atom';

            // `namespace.call(...)` - style the namespace segment distinctly.
            // Legacy token name "namespace" maps to @lezer/highlight's
            // tags.namespace via StreamLanguage's built-in token table.
            if (NAMESPACES.has(word) && stream.peek() === '.') {
                return 'namespace';
            }

            return 'variable';
        }

        // Member access after a dot - dotted callee/property name. Legacy
        // token name "property" (not "propertyName") maps to tags.propertyName.
        if (stream.peek() === '.') {
            stream.next();
            if (stream.match(/^[A-Za-z_][A-Za-z0-9_]*/)) {
                return 'property';
            }
            return 'operator';
        }

        // Special two/three-char operators before falling back to generic ones.
        if (stream.match('..') || stream.match('~=') || stream.match('~~') ||
            stream.match('==') || stream.match('!=') || stream.match('<=') ||
            stream.match('>=') || stream.match('&&') || stream.match('||')) {
            return 'operator';
        }

        if (stream.match(/^[+\-*/%=<>!]/)) {
            return 'operator';
        }

        if (stream.match(/^[{}()[\],:]/)) {
            return 'punctuation';
        }

        stream.next();
        return null;
    },
};

export function sml() {
    return StreamLanguage.define(smlParser);
}

// ========== Auto-lowercase SML keywords/atoms/types as you type ==========
// (2026-09-06 follow-up, item f) WLanguage/SML keywords are case-
// insensitive in real WinDev source, but this codebase's own convention
// (and every hand-written example) is lowercase - `IF`/`FOR`/`INFO` typed
// out of habit should quietly become `if`/`for`/`info` as the user types,
// WITHOUT ever touching a string literal's contents, a `//` comment, or any
// identifier the user actually chose themselves (a local variable/procedure
// name keeps whatever case it was typed in - only the fixed vocabulary
// below is rewritten).
//
// `BARE_BUILTINS` (imported from smlVocabulary.ts, shared with
// smlValidator.ts's "did you mean" check) mirrors sml_to_dart.js's own bare
// (non-namespaced) WinDev-style builtin bridges - see that module's own
// doc comment. Unlike KEYWORDS/TYPES/ATOMS, these are only rewritten when
// they look like an actual call (`info(`, not a bare `info` used as some
// unrelated identifier) and are NOT already a `namespace.info(` property
// access - exactly the same two conditions sml_to_dart.js itself requires
// before treating one specially.

interface SmlIdentifierToken {
    from: number;
    to: number;
    text: string;
    precededByDot: boolean;
    followedByParen: boolean;
}

// A deliberately narrow, single-line-only re-scan (NOT a reuse of
// `smlParser` above, which is a full StreamLanguage tokenizer needing a
// live `StringStream`/multi-token-per-call driver loop) - safe because SML
// itself has no multi-line strings or block comments (see SmlState's own
// doc comment on `smlParser`), so a per-line scan can never miss a string/
// comment that started on an earlier line. Only identifies plain
// identifier tokens and skips string/comment content exactly like
// `smlParser` does - it does not need to classify punctuation/operators at
// all for this purpose.
function scanSmlIdentifiers(lineText: string): SmlIdentifierToken[] {
    const tokens: SmlIdentifierToken[] = [];
    let i = 0;
    const n = lineText.length;
    while (i < n) {
        const ch = lineText[i];
        if (ch === '/' && lineText[i + 1] === '/') break;
        if (ch === '"') {
            i++;
            let escaped = false;
            while (i < n) {
                const c = lineText[i];
                i++;
                if (c === '"' && !escaped) break;
                escaped = !escaped && c === '\\';
            }
            continue;
        }
        if (/[A-Za-z_]/.test(ch)) {
            let j = i + 1;
            while (j < n && /[A-Za-z0-9_]/.test(lineText[j])) j++;
            let k = j;
            while (k < n && lineText[k] === ' ') k++;
            tokens.push({
                from: i,
                to: j,
                text: lineText.slice(i, j),
                precededByDot: i > 0 && lineText[i - 1] === '.',
                followedByParen: lineText[k] === '(',
            });
            i = j;
            continue;
        }
        i++;
    }
    return tokens;
}

// Tags OUR OWN corrective dispatch below so the same `updateListener` can
// tell it apart from the user's own edit and not re-process it - without
// this, every auto-fix would itself be a docChanged update, which would
// re-scan (harmlessly, since it's already lowercase - findings would be
// empty) but there is no reason to pay that cost twice per keystroke.
const smlAutoLowerAnnotation = Annotation.define<boolean>();

export function smlAutoLowerExtension(): Extension {
    return EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;
        if (update.transactions.some((tr) => tr.annotation(smlAutoLowerAnnotation))) return;

        // Only the lines actually touched by this change - cheap even for a
        // large file, since a normal keystroke touches exactly one line.
        const changedLines = new Set<number>();
        update.changes.iterChangedRanges((_fromA, _toA, fromB, toB) => {
            const startLine = update.state.doc.lineAt(fromB).number;
            const endLine = update.state.doc.lineAt(toB).number;
            for (let l = startLine; l <= endLine; l++) changedLines.add(l);
        });

        const changes: { from: number; to: number; insert: string }[] = [];
        changedLines.forEach((lineNo) => {
            if (lineNo < 1 || lineNo > update.state.doc.lines) return;
            const line = update.state.doc.line(lineNo);
            for (const tok of scanSmlIdentifiers(line.text)) {
                const lower = tok.text.toLowerCase();
                if (tok.text === lower) continue;
                const isReservedWord = KEYWORDS.has(lower) || TYPES.has(lower) || ATOMS.has(lower);
                const isBareBuiltinCall = !tok.precededByDot && tok.followedByParen && BARE_BUILTINS.has(lower);
                if (isReservedWord || isBareBuiltinCall) {
                    changes.push({ from: line.from + tok.from, to: line.from + tok.to, insert: lower });
                }
            }
        });

        if (changes.length > 0) {
            // A same-length case-only replacement maps the existing cursor
            // position through unchanged by default - no explicit selection
            // override needed to avoid a visible caret jump.
            update.view.dispatch({ changes, annotations: smlAutoLowerAnnotation.of(true) });
        }
    });
}

// ========== Live, non-blocking syntax checking ==========
// (2026-09-06 follow-up, item g, extended the same day once a real
// statement/namespace-function validator existed to plug in - see
// smlValidator.ts's own header comment for the full design and why it's a
// PORT of sml_to_dart.js's real classification rules rather than a second,
// independently-invented grammar) - bracket/string checks, statement/block
// structure, and namespaced-call function-name validation all live there
// now; this is just the thin CodeMirror-facing wrapper.
//
// `@codemirror/lint`'s own diagnostics render as an underline (default:
// wavy/red, matching exactly what was asked for) and only surface a
// tooltip ON HOVER - never a popup/dialog forcing an OK/Escape, and typing
// is never interrupted. `{ delay: 300 }` re-runs this only once the user
// has paused for 300ms, not on every keystroke.
export const smlLinter = linter((view): Diagnostic[] =>
    validateSml(view.state.doc.toString()).map((d) => ({ from: d.from, to: d.to, severity: d.severity, message: d.message })),
{ delay: 300 });
