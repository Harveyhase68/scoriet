import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/state/auth_providers.dart';
import 'app_strings.dart';
import 'schema_captions.dart';

/// Falls back to this when generation didn't bake in a real project default
/// (should not happen — `db_config.dart`-style `{:defaultlanguage:}` is
/// always resolved at generation time) and as the ultimate fallback for
/// [s]/[schemaCaption] lookups.
const String kFallbackLanguage = 'en';

/// The project's language at generation time — the pre-login default before
/// a user (with their own [AppUser.language]) is signed in.
const String kProjectDefaultLanguage = '{:defaultlanguage:}';

/// The active UI language: the signed-in user's own preference once
/// authenticated, otherwise the project default (login/register/forgot-
/// password/2FA screens run before any user is known).
final activeLanguageProvider = Provider<String>((ref) {
  final user = ref.watch(currentUserProvider);
  return user?.language ?? kProjectDefaultLanguage;
});

/// Static UI-chrome string lookup (buttons, dialogs, validation messages —
/// see `app_strings.dart`). Falls back to English, then the raw key, so
/// nothing ever renders blank for a language without a hand-authored
/// translation.
String s(WidgetRef ref, String key) {
  final lang = ref.watch(activeLanguageProvider);
  return kAppStrings[key]?[lang] ?? kAppStrings[key]?[kFallbackLanguage] ?? key;
}

/// Schema-derived caption lookup (table/field captions from Scoriet's Schema
/// Translation — see `schema_captions.dart`). `key` is `'<table>'` for a
/// table caption or `'<table>.<field>'` for a field caption.
String tc(WidgetRef ref, String key) {
  final lang = ref.watch(activeLanguageProvider);
  return kSchemaCaptions[key]?[lang] ??
      kSchemaCaptions[key]?[kFallbackLanguage] ??
      key;
}
