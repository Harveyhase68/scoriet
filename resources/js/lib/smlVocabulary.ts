// Shared SML ("Scoriet Meta Language") vocabulary - the fixed keyword/type/
// namespace/bare-builtin lists both smlLanguage.ts (tokenizer, highlighting,
// auto-lowercase) and smlValidator.ts (structural + namespaced-call
// validation, and the "did you mean" fuzzy check) need. Split into its own
// leaf module (no imports of its own) specifically so smlValidator.ts can
// use it too WITHOUT creating a circular import - smlLanguage.ts already
// imports smlValidator.ts's `validateSml` for its linter extension, so
// smlValidator.ts importing something back FROM smlLanguage.ts would be a
// cycle.
//
// Grammar reference: SML spec section 2 (statements) and section on
// standard library namespaces - see
// "WinDev to Scoriet Meta Language SML/progress/02_SML_SPECIFICATION.md".
export const KEYWORDS = new Set([
    'var', 'set', 'call', 'if', 'elseif', 'else', 'switch', 'case', 'default',
    'for', 'foreach', 'while', 'loop', 'break', 'continue', 'return',
    'try', 'catch', 'finally', 'throw', 'raw', 'todo',
    'on', 'proc', 'private', 'unit', 'requires', 'ui', 'globals', 'source',
    'window', 'report', 'procedures', 'block', 'control',
    'to', 'step', 'in', 'at',
]);

export const TYPES = new Set([
    'int', 'real', 'currency', 'bool', 'string', 'buffer', 'date', 'time',
    'datetime', 'variant', 'any', 'void', 'array', 'map', 'record',
]);

export const ATOMS = new Set(['true', 'false', 'null']);

// Runtime library namespaces (str., db., ui., dlg., ...).
export const NAMESPACES = new Set([
    'str', 'num', 'arr', 'map', 'dt', 'db', 'sql', 'http', 'ftp', 'sock',
    'json', 'crypt', 'file', 'ui', 'dlg', 'win', 'rpt', 'timer', 'log', 'sys',
]);

// WinDev's own bare (non-namespaced) builtins this runtime bridges directly
// - mirrors sml_to_dart.js's own `ident.toLowerCase() === '...'` branches
// (message/progressbar/iniread/iniwrite/val/info/open/openchild) - keep
// both in sync if a new one is ever added there.
export const BARE_BUILTINS = new Set(['message', 'progressbar', 'iniread', 'iniwrite', 'val', 'info', 'open', 'openchild']);
