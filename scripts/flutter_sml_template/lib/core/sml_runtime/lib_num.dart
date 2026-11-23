import 'dart:math' as math;

/// `num.*` (see supported.md's `num` namespace, `lib_num`) - numbers:
/// formatting, parsing, rounding, bit operations. Stateless/pure, so a
/// plain static class.
class SmlNum {
  const SmlNum._();

  static num abs(num n) => n.abs();

  static int bitAnd(int a, int b) => a & b;
  static int bitNot(int a) => ~a;
  static int bitOr(int a, int b) => a | b;
  static int bitXor(int a, int b) => a ^ b;
  static int shiftLeft(int a, int bits) => a << bits;
  static int shiftRight(int a, int bits) => a >> bits;

  static num ceil(num n) => n.ceil();
  static num floor(num n) => n.floor();

  static final RegExp _hexMask = RegExp(r'^0*(\d*)([xX])$');

  /// `IntegerToString`/`NumToString` - the mask is WinDev's own "picture"
  /// syntax, passed through as-is (supported.md). Round-1 covers the masks
  /// actually seen in real projects: `"d"` (integer), `"f"` (default
  /// decimal), and an `N` + `x`/`X` zero-padded hex mask (`"06X"` etc., used
  /// for colour values like `NumToString(colorValue, "06X")`). Anything
  /// else falls back to a plain `toString()` rather than mis-formatting.
  /// `n` is `dynamic`, not `num` - confirmed real callers sometimes pass an
  /// already-numeric-looking STRING literal (`num.format("30", "d")`) -
  /// WinDev's own `NumToString` is variant-typed and coerces either way.
  /// Parsed via [parse] (never-throws, `0` on anything unparseable) so a
  /// String argument behaves exactly like the `num` it represents would.
  static String format(dynamic n, [String? mask]) {
    n = n is num ? n : parse(n.toString());
    if (mask == null || mask.isEmpty) return n.toString();
    if (mask == 'd') return n.toInt().toString();
    if (mask == 'f') return n.toString();
    final hexMatch = _hexMask.firstMatch(mask);
    if (hexMatch != null) {
      final width = hexMatch.group(1)!.isEmpty ? 0 : int.parse(hexMatch.group(1)!);
      final hex = n.toInt().toRadixString(16);
      final padded = hex.padLeft(width, '0');
      return hexMatch.group(2) == 'X' ? padded.toUpperCase() : padded;
    }
    return n.toString(); // TODO: unrecognised NumToString mask "$mask"
  }

  static num fraction(num n) => n - n.truncate();

  static num max(num a, num b) => math.max(a, b);
  static num min(num a, num b) => math.min(a, b);

  static num mod(num a, num b) => a % b;

  /// `Val` - parses a leading numeric prefix, WinDev-forgiving (0 rather
  /// than throwing on non-numeric text). [s] is `dynamic`, not `String` -
  /// confirmed real callers sometimes pass an ALREADY-numeric value
  /// (`num.parse(db.errorCode(...))`, `HErrorInfo`'s real WinDev return
  /// type being variant-typed - "Val() on a number" is a defensive
  /// habit some WinDev code applies unconditionally) - same reasoning as
  /// [format] above; an already-numeric input passes straight through.
  static num parse(dynamic s) => s is num ? s : (num.tryParse(s.toString().trim()) ?? 0);
  static int parseInt(dynamic s) => s is int ? s : (s is num ? s.toInt() : (int.tryParse(s.toString().trim()) ?? (num.tryParse(s.toString().trim())?.toInt() ?? 0)));

  static num pow(num base, num exponent) => math.pow(base, exponent);

  static final math.Random _random = math.Random();

  /// `Random` - WinDev's `Random(min, max)` is an inclusive range.
  static int random(int min, int max) => min + _random.nextInt(max - min + 1);

  static num round(num n, [int decimals = 0]) {
    final factor = math.pow(10, decimals);
    return (n * factor).round() / factor;
  }

  static num sqrt(num n) => math.sqrt(n);

  static num truncate(num n) => n.truncate();
}
