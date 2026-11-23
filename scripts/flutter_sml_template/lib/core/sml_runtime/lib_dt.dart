/// `dt.*` (see supported.md's `dt` namespace, `lib_datetime`) - dates and
/// times. Stateless/pure, so a plain static class over Dart's `DateTime`.
///
/// WinDev format masks (`"YYYY-MM-DD"`, `"HH:MM:SS"`, ...) are simple,
/// fixed-vocabulary token replacement, not a full format-string language,
/// so this implements them directly rather than pulling in `intl`'s own
/// (differently-spelled) pattern syntax - `_applyMask` is deliberately a
/// plain token scan, no regex needed for a fixed set of literal tokens.
class SmlDt {
  const SmlDt._();

  /// `DayOfWeek` - 1=Monday .. 7=Sunday, matching Dart's own `weekday` (and
  /// WinDev's own convention).
  static int dayOfWeek(DateTime d) => d.weekday;

  static int daysBetween(DateTime from, DateTime to) => to.difference(from).inDays;

  /// `d` is `dynamic`, not `DateTime` - confirmed real call sites pass an
  /// ALREADY-STRING value through here too (a business-logic helper that
  /// slices a compact `YYYYMMDDHHMMSS`-shaped string into date/time halves
  /// before reformatting each), not just genuine `DateTime` values. A
  /// non-`DateTime` input has no real mask to apply (this Round-1 model has
  /// no compact-string date parser), so it passes through as its own
  /// string form rather than crashing or fabricating a wrong reformat.
  static String format(dynamic d, [String mask = 'YYYY-MM-DD HH:MM:SS']) {
    return d is DateTime ? _applyMask(d, mask) : d.toString();
  }

  static String formatDate(dynamic d, [String mask = 'YYYY-MM-DD']) =>
      d is DateTime ? _applyMask(d, mask) : d.toString();

  static String formatTime(dynamic d, [String mask = 'HH:MM:SS']) =>
      d is DateTime ? _applyMask(d, mask) : d.toString();

  static String _applyMask(DateTime d, String mask) {
    String two(int n) => n.toString().padLeft(2, '0');
    return mask
        .replaceAll('YYYY', d.year.toString().padLeft(4, '0'))
        .replaceAll('YY', (d.year % 100).toString().padLeft(2, '0'))
        .replaceAll('MM', two(d.month))
        .replaceAll('DD', two(d.day))
        .replaceAll('HH', two(d.hour))
        .replaceAll('NN', two(d.minute)) // WinDev sometimes spells minute "NN" to avoid clashing with month "MM" in a combined mask
        .replaceAll('SS', two(d.second));
  }

  /// `IntegerToDate` - a `YYYYMMDD`-encoded integer (WinDev's own compact
  /// date representation).
  static DateTime fromInt(int n) {
    final year = n ~/ 10000;
    final month = (n ~/ 100) % 100;
    final day = n % 100;
    return DateTime(year, month, day);
  }

  /// `DateToInteger` - inverse of [fromInt].
  static int toInt(DateTime d) => d.year * 10000 + d.month * 100 + d.day;

  static bool isValid(DateTime? d) => d != null;

  static DateTime now() => DateTime.now();

  static DateTime today() {
    final n = DateTime.now();
    return DateTime(n.year, n.month, n.day);
  }

  /// `StringToDate` - parses the same fixed mask tokens [formatDate] emits;
  /// defaults to ISO `YYYY-MM-DD` order, WinDev's own most common mask.
  static DateTime? parseDate(String s, [String mask = 'YYYY-MM-DD']) {
    final order = _fieldOrder(mask, const ['YYYY', 'MM', 'DD']);
    final parts = _extractDigitGroups(s);
    if (parts.length < 3) return null;
    final values = <String, int>{};
    for (var i = 0; i < order.length && i < parts.length; i++) {
      values[order[i]] = parts[i];
    }
    final year = values['YYYY'] ?? DateTime.now().year;
    final month = values['MM'] ?? 1;
    final day = values['DD'] ?? 1;
    return DateTime(year, month, day);
  }

  /// `StringToTime` - same idea as [parseDate], time-of-day tokens.
  static DateTime? parseTime(String s, [String mask = 'HH:MM:SS']) {
    final order = _fieldOrder(mask, const ['HH', 'MM', 'SS']);
    final parts = _extractDigitGroups(s);
    if (parts.isEmpty) return null;
    final values = <String, int>{};
    for (var i = 0; i < order.length && i < parts.length; i++) {
      values[order[i]] = parts[i];
    }
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day, values['HH'] ?? 0, values['MM'] ?? 0, values['SS'] ?? 0);
  }

  static List<String> _fieldOrder(String mask, List<String> tokens) {
    final found = <MapEntry<int, String>>[];
    for (final token in tokens) {
      final i = mask.indexOf(token);
      if (i != -1) found.add(MapEntry(i, token));
    }
    found.sort((a, b) => a.key.compareTo(b.key));
    return found.map((e) => e.value).toList();
  }

  static List<int> _extractDigitGroups(String s) {
    final groups = <int>[];
    final buffer = StringBuffer();
    void flush() {
      if (buffer.isNotEmpty) {
        groups.add(int.parse(buffer.toString()));
        buffer.clear();
      }
    }
    for (final ch in s.split('')) {
      if (ch.codeUnitAt(0) >= 48 && ch.codeUnitAt(0) <= 57) {
        buffer.write(ch);
      } else {
        flush();
      }
    }
    flush();
    return groups;
  }
}

/// `dt.today() + dt.now()` - confirmed real, recurring idiom ("today's date
/// combined with the current time-of-day" - WinDev's own historical
/// separate Date/Time value split, ported over even though `SmlDt.now()`
/// already carries both). Dart's `DateTime` class defines no `+` operator
/// at all (only `.add(Duration)`), so this extension is free to give the
/// combination a real meaning rather than leaving a hard compile error -
/// takes the LEFT operand's date and the RIGHT operand's time-of-day,
/// matching every real call's own `today() + now()` argument order.
extension SmlDateTimeCombine on DateTime {
  DateTime operator +(DateTime other) =>
      DateTime(year, month, day, other.hour, other.minute, other.second, other.millisecond, other.microsecond);
}
