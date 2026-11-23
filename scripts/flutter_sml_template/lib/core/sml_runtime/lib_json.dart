import 'dart:convert';

/// `json.*` (see supported.md's `json` namespace, `lib_json`) - JSON and
/// variant traversal. Stateless/pure, built on `dart:convert`; WinDev's
/// "variant" (a dynamically-typed value that can be inspected/traversed at
/// runtime - `count`/`member`/`name`/`type`/`value` in supported.md's
/// "Variant properties" table) maps naturally onto Dart's own decoded JSON
/// shape (`Map<String, dynamic>` / `List<dynamic>` / primitives).
class SmlJson {
  const SmlJson._();

  /// `JSONToVariant` - parses a JSON string into a dynamic Dart value.
  static dynamic parse(String jsonText) => jsonDecode(jsonText);

  /// `VariantToJSON` - the inverse of [parse]. `format` (WinDev's
  /// `psdMinified`-style output-mode flag) is accepted and ignored -
  /// `dart:convert` always produces compact JSON, and confirmed real usage
  /// calls this BOTH with and without the flag (`json.stringify(value)` and
  /// `json.stringify(value, psdMinified)`).
  static String stringify(dynamic value, [dynamic format]) => jsonEncode(value);

  /// `Serialize`/`Deserialize` - WinDev's own (non-JSON) binary/text
  /// variant serialisation; approximated here as JSON since that is the
  /// only serialisation format this runtime can guarantee round-trips
  /// correctly, and every real use in a project ported to Flutter is
  /// interoperating over JSON anyway (REST APIs, not WinDev's own wire format).
  static String serialize(dynamic value) => jsonEncode(value);
  static dynamic deserialize(String text) => jsonDecode(text);

  /// `VariantConvert` - best-effort type coercion; never throws, returns
  /// the original value unchanged when the target type isn't recognised.
  static dynamic convert(dynamic value, String targetType) {
    switch (targetType.toLowerCase()) {
      case 'string':
        return value?.toString() ?? '';
      case 'int':
        return value is num ? value.toInt() : (int.tryParse(value.toString()) ?? 0);
      case 'real':
      case 'double':
        return value is num ? value.toDouble() : (double.tryParse(value.toString()) ?? 0.0);
      case 'bool':
        return value == true || value?.toString().toLowerCase() == 'true';
      default:
        return value; // TODO: unrecognised target type "$targetType"
    }
  }

  /// `HExecuteQuery`/`JSONExecute`-style "run this and get variant results"
  /// is not a JSON concept on its own - see SmlDb/SmlSql for real query
  /// execution; kept here only as a namespace-complete no-op so generated
  /// code calling `json.execute` in a context this runtime doesn't model
  /// yet still compiles.
  static dynamic execute(String expression) {
    // TODO: json.execute - no generic "evaluate this" runtime exists
    return null;
  }

  // ---- Variant traversal (supported.md's "Variant properties" table) ----

  static int count(dynamic value) {
    if (value is Map) return value.length;
    if (value is List) return value.length;
    return 0;
  }

  static List<String> members(dynamic value) => value is Map ? value.keys.map((k) => k.toString()).toList() : const [];

  /// `variant.name` has no meaning once decoded into a plain Dart Map/List
  /// (a JSON value has no "name" of its own, only its containing key does)
  /// - kept for namespace completeness, returns an empty string rather
  /// than guessing. Typed `dynamic`, not `String` - real code has been seen
  /// treating this call's result as a numeric member index (`json.name(x)
  /// - 1`), a WinDev variant-member-handle idiom this Round-1 model doesn't
  /// capture (see [members]'s own doc comment) - a `dynamic` return at
  /// least keeps that call site COMPILING (its value is still wrong/unused
  /// until the underlying member-handle model is built for real) instead of
  /// a hard "operator not defined for String" error.
  static dynamic name(dynamic value) => '';

  static String type(dynamic value) {
    if (value == null) return 'null';
    if (value is String) return 'string';
    if (value is bool) return 'bool';
    if (value is int) return 'int';
    if (value is num) return 'real';
    if (value is Map) return 'object';
    if (value is List) return 'array';
    return 'unknown';
  }

  static dynamic value(dynamic v) => v;
}
