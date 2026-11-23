/// WinDev built-in constants that appear as bare identifiers in real SML
/// code (the WinDev->SML converter passes an enum-style constant like
/// `cryptNone`/`encodeBASE64` through unchanged, exactly like an
/// unmapped bare function name - see supported.md's "What is deliberately
/// not mapped" section). Not exhaustive - WinDev has hundreds of these;
/// add more here as a real generated project's `dart analyze` turns up an
/// undefined name, the same "grow the registry on demand" approach
/// supported.md itself documents for functions.
library;

/// `crypt.encrypt`/`crypt.decrypt`'s cipher-mode argument - "no encryption,
/// just apply the encoding" (see SmlCrypt, the only mode implemented for
/// real this round).
const int cryptNone = 0;

/// A real WinDev symmetric cipher - NOT reproduced here (see SmlCrypt's own
/// TODO): WinDev's exact "Fast" algorithm is undocumented/proprietary, and
/// guessing at a substitute cipher would silently corrupt any real secret
/// encrypted with it - worse than leaving the call as a visible TODO.
const int cryptFast = 1;

/// `crypt.encrypt`/`crypt.decrypt`'s encoding-mode argument - Base64.
const int encodeBASE64 = 0;

/// `http.result`'s selector argument - "the response body" (the only
/// selector value seen in real project code; WinDev has others - e.g. the
/// HTTP status code - add them here if a generated project turns up an
/// undefined name).
const int httpResult = 0;

/// `ui.WINDOW` - WLanguage's self-reference to "the current window" as a
/// `ui.get`/`ui.set` TARGET (as opposed to a named control) - confirmed
/// very common in the real corpus (`ui.set(ui.WINDOW, "modified", false)`,
/// `ui.set(ui.WINDOW, "returned_value", true)` - the standard WinDev modal-
/// dialog "was this record changed / what should this window return"
/// idiom). A sentinel string deliberately never equal to any real control's
/// source_name - SmlUiContext.get/set special-case it into a small
/// per-window property bag (see SmlWindowContext.windowProperties) instead
/// of looking it up in the control registry.
const String uiWindow = '__scoriet_window__';

/// `str.EOT` (End Of Text) - ASCII 0x03, WLanguage's own constant of the
/// same name.
const String strEot = '\x03';

/// `arr.find`'s search-mode argument (`arr.find(array, asLinear, "Field",
/// value)`) - carries no real meaning here (sml_to_dart.js rewrites this
/// whole call shape into SmlArr.findByField(), which reads but ignores this
/// argument - a plain Dart List has no other way to search anyway). Kept as
/// a real constant only so a hand-written/future call this rewrite doesn't
/// catch still compiles.
const int asLinear = 0;

/// `json.stringify(value, psdMinified)` - WinDev's output-formatting mode
/// argument. SmlJson.stringify() always produces compact JSON (dart:convert
/// has no "pretty vs minified" toggle worth modelling here), so - like
/// asLinear above - this carries no real meaning, kept only so the call
/// compiles.
const int psdMinified = 0;

/// A control's/looper row's "grayed out" (disabled) display-state value,
/// used as `ui.set(name, "state", Grayed)` - WinDev's ControlState enum.
/// Round-1 scope: SmlControlBinding's property table doesn't model an
/// explicit disabled STATE separate from "Enabled" - add real handling if a
/// generated project needs it to do more than compile.
// ignore: constant_identifier_names
const int Grayed = 1;

/// The other half of the Grayed/Active ControlState pair above - a
/// control's normal, enabled/interactive display state.
// ignore: constant_identifier_names
const int Active = 0;

/// `SmlSys.errorInfo(detailFlag)`'s detail-level selector - WinDev's
/// `ErrorInfo()` returns different information depending on which of these
/// flags is passed (a short message vs. the full technical detail incl.
/// stack/source). SmlSys.errorInfo() doesn't yet distinguish between them
/// (Round-1 scope - see lib_sys.dart), so both compile to distinct values
/// only so a call site passing either one still compiles; add real
/// per-flag behaviour if a generated project needs it to do more.
// ignore: constant_identifier_names
const int errMessage = 0;
// ignore: constant_identifier_names
const int errFullDetails = 1;
// ignore: constant_identifier_names
const int errCode = 2;

/// `ui.table_refresh(name, mode)`/`ui.list_refresh(...)`'s refresh-scope
/// argument - WinDev's TableRefresh mode enum (`taCurrentSelection`
/// refreshes only the selected row, `taCurrentFirst` refreshes from the
/// current first visible row). SmlUiContext.tableRefresh() doesn't yet
/// distinguish between refresh scopes (no real per-row rendering to
/// selectively refresh - see its own TODO), so these compile to distinct
/// values only so a real call site still compiles.
// ignore: constant_identifier_names
const int taCurrentSelection = 0;
// ignore: constant_identifier_names
const int taCurrentFirst = 1;

/// `sys.call_by_name(procedureName, triggerType)`'s trigger-type argument -
/// WinDev's RAD-generated "notify related controls of a change" idiom
/// passes one of these to say WHAT kind of event to simulate on the named
/// procedure/control (a click, a value change, or a plain procedure call).
/// SmlSys.callByName() doesn't yet distinguish between them (Round-1 scope
/// - see lib_sys.dart), so these compile to distinct values only so a real
/// call site still compiles.
// ignore: constant_identifier_names
const int trtClick = 0;
// ignore: constant_identifier_names
const int trtChange = 1;
// ignore: constant_identifier_names
const int trtProcedure = 2;

/// WinDev's fixed set of named colour constants (`ui.set(name, "brushcolor",
/// White)`, `call ProgressBar(..., LightGreen)`) - packed as a full 32-bit
/// ARGB int (`0xAARRGGBB`), consumed directly as `Color(constant)`
/// everywhere a colour argument is used (see SmlWindowContext.progressBar) -
/// deliberately NOT a 24-bit `0xRRGGBB` forced to full opacity at the call
/// site the way the first two of these (`White`/`LightGreen`) briefly were,
/// because that representation has no way to express [Transparent] (alpha
/// really is 0 there, not "some RGB triple that happens to render
/// invisibly"). Values are the classic 16-colour EGA/console palette every
/// one of these WinDev names has matched since the DOS era - "Light" is a
/// component at full intensity (0xFF), "Dark" is the same component at half
/// intensity (0x80), exactly like the naming implies. `YellowToolhelp` is
/// the other odd one out: the classic Windows tooltip background colour
/// (`COLOR_INFOBK`), not part of the Light/Dark pattern.
// ignore: constant_identifier_names
const int Transparent = 0x00000000;
// ignore: constant_identifier_names
const int White = 0xFFFFFFFF;
// ignore: constant_identifier_names
const int Black = 0xFF000000;
// ignore: constant_identifier_names
const int LightGray = 0xFFC0C0C0;
// ignore: constant_identifier_names
const int DarkGray = 0xFF808080;
// ignore: constant_identifier_names
const int LightRed = 0xFFFF0000;
// ignore: constant_identifier_names
const int DarkRed = 0xFF800000;
// ignore: constant_identifier_names
const int LightGreen = 0xFF00FF00;
// ignore: constant_identifier_names
const int DarkGreen = 0xFF008000;
// ignore: constant_identifier_names
const int LightBlue = 0xFF0000FF;
// ignore: constant_identifier_names
const int DarkBlue = 0xFF000080;
// ignore: constant_identifier_names
const int LightCyan = 0xFF00FFFF;
// ignore: constant_identifier_names
const int DarkCyan = 0xFF008080;
// ignore: constant_identifier_names
const int LightYellow = 0xFFFFFF00;
// ignore: constant_identifier_names
const int DarkYellow = 0xFF808000;
// ignore: constant_identifier_names
const int YellowToolhelp = 0xFFFFFFE1;
// ignore: constant_identifier_names
const int LightMagenta = 0xFFFF00FF;
// ignore: constant_identifier_names
const int DarkMagenta = 0xFF800080;

/// `str.indexOf(s, sub, occurrence, IgnoreCase)` - WinDev's case-
/// insensitive-search mode constant for `Position`/`PositionOccurrence`
/// (see [SmlStr.indexOf]'s own doc comment) - the value itself only needs
/// to be non-null/non-false (SmlStr.indexOf treats it as a plain boolean
/// flag), so any non-zero int satisfies that.
// ignore: constant_identifier_names
const int IgnoreCase = 1;

/// `SmlDraw.savePng(image, destination)`'s destination-mode argument -
/// WinDev's `InMemory` requests the encoded bytes back as a buffer instead
/// of writing to a file. SmlDraw.savePng() doesn't yet distinguish between
/// destination modes (Round-1 scope), so this is kept only so a real call
/// site still compiles.
// ignore: constant_identifier_names
const int inMemory = 1;

/// `crypt.hash(algorithm, text)`'s algorithm selector - MD5 (see
/// SmlCrypt.hash(), the one non-SHA-256 algorithm confirmed real in this
/// project's own password-hashing code).
// ignore: constant_identifier_names
const int HA_MD5_128 = 1;

/// WLanguage's own runtime variant-type-ID constants (see `TypeOf`/
/// `VariantType`), used by real generated code (`GetVariantToJson`) to
/// switch on `json.type(value)`'s result. These are NOT WLanguage's real
/// internal integer IDs (undocumented/proprietary, and irrelevant here
/// anyway) - `json.type()` is Scoriet's OWN function, built on
/// `dart:convert`'s decoded JSON shape, so these constants are defined to
/// match ITS OWN string contract exactly (see lib_json.dart's `type()`):
/// every "number-ish" WLanguage type maps to whichever of 'int'/'real'/
/// 'bool' a decoded JSON number/boolean actually produces, and every
/// "text-ish" type (WLanguage distinguishes date/time/UUID/character as
/// separate types; JSON does not - they all decode as plain strings) maps
/// to 'string'. `wlVariantArray`/`wlVariantObject`/`wlEmpty` match
/// `type()`'s own 'array'/'object'/'null'.
const String wlVariantArray = 'array';
const String wlVariantObject = 'object';
const String wlInt = 'int';
const String wlInt_1 = 'int';
const String wlInt_2 = 'int';
const String wlInt_4 = 'int';
const String wlInt_8 = 'int';
const String wlReal = 'real';
const String wlBoolean = 'bool';
const String wlCurrency = 'real';
const String wlNumeric = 'real';
const String wlCharacter = 'string';
const String wlDate = 'string';
const String wlDateTime = 'string';
const String wlTime = 'string';
const String wlSQLQuery = 'string';
const String wlUUID = 'string';
const String wlUUID_128 = 'string';
const String wlUUID_256 = 'string';
const String wlEmpty = 'null';
