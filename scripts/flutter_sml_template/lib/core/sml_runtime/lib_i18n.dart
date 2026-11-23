/// `i18n.*` - not one of the original 20 SML namespaces (supported.md
/// predates it) but real and documented (07_REAL_PROJECT_FINDINGS.md):
/// WinDev embeds a string's every language variant directly in the source
/// (`<§id¤de-DE¤Text¤en-GB¤Text¤...¤>`), which the converter turns into
/// `i18n.text(id, lang1, text1, lang2, text2, ...)` calls - the id is kept
/// only for traceability, the actual lookup is by the CURRENT language
/// against the inline lang/text pairs, never a separate catalog file.
///
/// [currentLanguage] is a simple mutable flag rather than something wired
/// to Flutter's own `Localizations`/`Locale` machinery, since a Window
/// Designer project's own language list (see `ui_projects`'s
/// `enabled_languages`/`default_language`) is what actually drives which
/// text shows, not the OS locale - the generated app's own language
/// switcher (if any) should set this.
class SmlI18n {
  const SmlI18n._();

  static String currentLanguage = 'en';

  /// `i18n.text(id, lang1, text1, lang2, text2, ...)` - returns the pair
  /// matching [currentLanguage] (checked case-insensitively, and matching a
  /// bare language prefix too - `"de"` matches a `"de-DE"` pair), falling
  /// back to the FIRST pair when there is no match, never an empty string
  /// with no explanation.
  static String text(String id, [dynamic a1, dynamic a2, dynamic a3, dynamic a4, dynamic a5, dynamic a6, dynamic a7, dynamic a8, dynamic a9, dynamic a10]) {
    final pairs = [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10];
    String? fallback;
    for (var i = 0; i + 1 < pairs.length; i += 2) {
      final lang = pairs[i];
      final value = pairs[i + 1];
      if (lang == null || value == null) break;
      fallback ??= value.toString();
      if (_languageMatches(lang.toString(), currentLanguage)) {
        return value.toString();
      }
    }
    return fallback ?? id;
  }

  static bool _languageMatches(String pairLanguage, String current) {
    final a = pairLanguage.toLowerCase();
    final b = current.toLowerCase();
    return a == b || a.startsWith('$b-') || b.startsWith('$a-');
  }

  /// `i18n.resource(id)` - a NUMBERED project resource (`<§$0001§>`), i.e.
  /// a lookup into a separate resource catalog rather than an inline
  /// lang/text list - Scoriet has no such catalog table yet, so this stays
  /// an honest TODO returning the id itself.
  static String resource(String id) {
    // TODO: i18n.resource - numbered project resource catalog not modeled yet
    return id;
  }
}
