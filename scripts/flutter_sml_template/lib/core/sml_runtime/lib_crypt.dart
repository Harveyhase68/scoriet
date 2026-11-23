import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'sml_constants.dart';

/// `crypt.*` (see supported.md's `crypt` namespace, `lib_crypt`) - hashing,
/// encryption, encoding. Stateless/pure, so a plain static class.
///
/// Round-1 scope: `hash`/`hash_verify`/`encode`/`decode` are fully real.
/// `encrypt`/`decrypt` are real ONLY for the `cryptNone` (encoding-only)
/// mode actually used throughout the real project this was built against -
/// any other cipher mode (WinDev's own "Fast"/"Strong" algorithms are
/// undocumented/proprietary) throws rather than silently returning
/// wrongly-"encrypted" data, since a wrong cipher is worse than a visible
/// failure for anything security-sensitive (matches supported.md's own
/// "a wrong mapping is worse than an honest bare call" principle).
class SmlCrypt {
  const SmlCrypt._();

  static String encode(String s) => base64.encode(utf8.encode(s));
  static String decode(String s) => utf8.decode(base64.decode(s));

  /// `crypt.hash(algorithm, text)` - confirmed real with an EXPLICIT
  /// algorithm selector (this project's own password hashing passes
  /// `HA_MD5_128`), not just a bare `hash(text)` - `algorithm` is `dynamic`
  /// because an unmapped WinDev algorithm constant translates to `null`
  /// (see sml_to_dart.js's WINDEV_CONSTANT_RE fallback), which must still
  /// compile and fall back to this class's original default (SHA-256)
  /// rather than crash.
  static String hash(dynamic algorithm, String s) {
    final bytes = utf8.encode(s);
    if (algorithm == HA_MD5_128) {
      return md5.convert(bytes).toString();
    }
    return sha256.convert(bytes).toString();
  }

  static String hashFile(List<int> fileBytes) => sha256.convert(fileBytes).toString();

  static bool hashVerify(dynamic algorithm, String s, String expectedHash) => hash(algorithm, s) == expectedHash;

  /// `Encrypt` - only `cryptNone` (encoding-only, see sml_constants.dart)
  /// is implemented; any other mode is a real, undocumented WinDev cipher
  /// this runtime cannot reproduce correctly.
  ///
  /// `data` is `dynamic`, accepting EITHER raw bytes (`List<int>` - a
  /// genuine binary blob field like `company_logo`, or the output of a
  /// previous [decrypt] round-trip) OR a plain `String` (confirmed real:
  /// `str.toUtf8()` is a no-op in this runtime - see its own doc comment -
  /// so text fields reach here as plain Dart Strings, not pre-encoded
  /// bytes) - encoded to UTF-8 bytes internally when a String arrives, so
  /// both real shapes produce the correct Base64 text output regardless of
  /// which one the caller happened to pass through.
  static String encrypt(dynamic data, String key, int mode, int encoding) {
    final bytes = data is String ? utf8.encode(data) : (data as List<int>);
    if (mode == cryptNone) {
      return encoding == encodeBASE64 ? base64.encode(bytes) : utf8.decode(bytes);
    }
    throw UnimplementedError(
      'SmlCrypt.encrypt: cipher mode $mode is not implemented (WinDev\'s own '
      'encryption algorithms are proprietary/undocumented) - only cryptNone '
      '(encoding-only) is supported.',
    );
  }

  /// `Decrypt` - the inverse of [encrypt]: String (Base64 text) input, raw
  /// BYTES output - confirmed real: every call either feeds the result into
  /// `str.fromUtf8()` (text fields) or assigns it directly to a binary blob
  /// field (`company_logo`/`footer_logo`) destined to be re-`encrypt`ed
  /// (bytes back in) before the next JSON round-trip.
  static List<int> decrypt(String s, String key, int mode, int encoding) {
    if (mode == cryptNone) {
      return encoding == encodeBASE64 ? base64.decode(s) : utf8.encode(s);
    }
    throw UnimplementedError(
      'SmlCrypt.decrypt: cipher mode $mode is not implemented (WinDev\'s own '
      'encryption algorithms are proprietary/undocumented) - only cryptNone '
      '(encoding-only) is supported.',
    );
  }
}
