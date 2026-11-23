import 'dart:convert';

/// `str.*` (see supported.md's `str` namespace, `lib_str`) - text: length,
/// slicing, search, case, encoding. Stateless/pure, so a plain static class
/// - see sml_to_dart.js's SML_NAMESPACE_TO_DART_CLASS.
///
/// Indices are 0-based throughout, matching SML's own contract (ADR-004 in
/// the SML spec) and Dart's native String indexing - by the time an SML
/// call like `str.sub(s, pos, len)` reaches here, `pos` is already the
/// 0-based index the WinDev->SML converter resolved it to, so these
/// implementations never apply a further adjustment.
class SmlStr {
  const SmlStr._();

  /// `Asc`/`Charact`/`CharactUnicode` split: `code_at` returns the code of
  /// the first character (WinDev's `Asc`).
  static int codeAt(String s) => s.isEmpty ? 0 : s.codeUnitAt(0);

  static int count(String s, String substring) {
    if (substring.isEmpty) return 0;
    var count = 0, start = 0;
    while (true) {
      final i = s.indexOf(substring, start);
      if (i == -1) break;
      count++;
      start = i + substring.length;
    }
    return count;
  }

  /// ANSI is not a meaningful concept on non-Windows/portable text - treated
  /// as a pass-through, same string in and out.
  static String fromAnsi(String s) => s;
  static String toAnsi(String s) => s;
  static String utf8ToAnsi(String s) => s;

  static String fromCode(int code) => String.fromCharCode(code);

  static String fromUtf8(List<int> bytes) => utf8.decode(bytes);

  /// `StringToUTF8` - a genuine no-op in this runtime, NOT `utf8.encode()`.
  /// Confirmed real usage is split between two shapes with opposite needs:
  /// embedding the result straight into a plain Dart `String` (string
  /// concatenation building a JSON body, or a struct field later
  /// `json.stringify()`'d as text) and feeding it to `crypt.encrypt()`
  /// (which genuinely needs raw bytes). A Dart `String` is ALREADY valid
  /// Unicode internally and is UTF-8-encoded automatically by every layer
  /// that needs bytes on the wire (`dart:convert`'s `jsonEncode`, the
  /// `http` package's request body, `dart:io` file writes) - so returning
  /// the string unchanged is the functionally CORRECT choice for the first
  /// shape, and [SmlCrypt.encrypt] does its own `utf8.encode()` internally
  /// for the second - see its own doc comment. Splitting this into two
  /// return types is not possible in Dart's static type system; unifying
  /// on the no-op is the one choice that is CORRECT (not just compiling)
  /// for both real shapes, since encoding text to UTF-8 and immediately
  /// treating the result as text again is a lossless round-trip for any
  /// Dart String.
  static String toUtf8(String s) => s;

  /// `Position`/`PositionOccurrence([...,] mode)` -> 1-based position, 0
  /// when not found - WinDev's own sentinel, kept exactly (never guessed to
  /// be something else) since it's the return VALUE contract callers rely
  /// on, distinct from an argument position. [mode] is a confirmed real 4th
  /// argument (`str.indexOf(s, sub, 0, IgnoreCase)`, sml_constants.dart's
  /// own `IgnoreCase`) selecting a case-insensitive search - accepted as
  /// `dynamic` and treated as truthy-or-not, matching how every other
  /// WinDev mode-constant argument in this runtime is handled.
  static int indexOf(String s, String substring, [int occurrence = 1, dynamic mode]) {
    final ignoreCase = mode != null && mode != false;
    final haystack = ignoreCase ? s.toLowerCase() : s;
    final needle = ignoreCase ? substring.toLowerCase() : substring;
    var start = 0;
    for (var n = 0; n < occurrence; n++) {
      final i = haystack.indexOf(needle, start);
      if (i == -1) return 0;
      if (n == occurrence - 1) return i + 1;
      start = i + 1;
    }
    return 0;
  }

  /// `Insert` - argument 2 is the already-0-based insertion index.
  static String insert(String s, int index, String toInsert) {
    if (index < 0) index = 0;
    if (index > s.length) index = s.length;
    return s.substring(0, index) + toInsert + s.substring(index);
  }

  static String left(String s, int count) => count <= 0 ? '' : s.substring(0, count.clamp(0, s.length));
  static String right(String s, int count) => count <= 0 ? '' : s.substring((s.length - count).clamp(0, s.length));

  static int length(String s) => s.length;

  static String lower(String s) => s.toLowerCase();
  static String upper(String s) => s.toUpperCase();

  static String padLeft(String s, int width, [String pad = ' ']) => s.padLeft(width, pad.isEmpty ? ' ' : pad);
  static String padRight(String s, int width, [String pad = ' ']) => s.padRight(width, pad.isEmpty ? ' ' : pad);

  static String repeat(String s, int times) => times <= 0 ? '' : s * times;

  static String replace(String s, String search, String replacement) => s.replaceAll(search, replacement);

  static String reverse(String s) => String.fromCharCodes(s.runes.toList().reversed);

  /// `NoAccent` - strips the most common Latin diacritics (WinDev's
  /// intended use: matchcode/search-key normalisation, not full Unicode
  /// decomposition).
  static String stripAccents(String s) {
    const from = 'àáâãäåèéêëìíîïòóôõöùúûüñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÑÇ';
    const to = 'aaaaaaeeeeiiiiooooouuuuncAAAAAAEEEEIIIIOOOOOUUUUNC';
    final buffer = StringBuffer();
    for (final ch in s.split('')) {
      final i = from.indexOf(ch);
      buffer.write(i == -1 ? ch : to[i]);
    }
    return buffer.toString();
  }

  /// `Middle`/`Milieu` - `sub(s, position, length)`, position already
  /// 0-based; a negative or out-of-range length/position clamps rather than
  /// throwing, matching WinDev's own forgiving behaviour.
  static String sub(String s, int position, [int? len]) {
    if (position < 0) position = 0;
    if (position >= s.length) return '';
    final end = len == null ? s.length : (position + len).clamp(position, s.length);
    return s.substring(position, end);
  }

  /// `ExtractString` - `token(s, index, separator)`, index already 0-based.
  static String token(String s, int index, String separator) {
    final parts = s.split(separator);
    if (index < 0 || index >= parts.length) return '';
    return parts[index];
  }

  static String trim(String s) => s.trim();

  /// `~=` -> case-insensitive equality (see the SML spec's special mappings).
  static bool equalsCi(String a, String b) => a.toLowerCase() == b.toLowerCase();

  /// `~~` -> "loose" equality - case-insensitive AND accent-insensitive,
  /// the two normalisations WinDev's `~~` combines.
  static bool equalsLoose(String a, String b) => equalsCi(stripAccents(a), stripAccents(b));

  /// `&` concatenation - WinDev's `&` coerces its operands to text (unlike
  /// `+`, which requires both sides already be strings) - `dynamic` inputs
  /// here so a number/bool/date value converts the same way.
  static String concat(dynamic a, dynamic b) => a.toString() + b.toString();
}
