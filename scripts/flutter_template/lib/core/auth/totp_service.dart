import 'package:base32/base32.dart';
import 'package:otp/otp.dart';

import 'crypto_random.dart';

/// TOTP (RFC 6238) helper for two-factor auth, compatible with common
/// authenticator apps (Google/Microsoft Authenticator, Authy): SHA1, 6 digits,
/// 30-second period.
class TotpService {
  const TotpService({this.issuer = '{:projectname:}'});

  final String issuer;

  static const _digits = 6;
  static const _period = 30;

  /// A fresh base32 secret (no padding), 160-bit as recommended for SHA1.
  String generateSecret() =>
      base32.encode(secureBytes(20)).replaceAll('=', '');

  /// The `otpauth://` URI to encode as a QR code in the authenticator app.
  String otpauthUri({required String account, required String secret}) {
    final label = Uri.encodeComponent('$issuer:$account');
    final iss = Uri.encodeComponent(issuer);
    return 'otpauth://totp/$label'
        '?secret=$secret&issuer=$iss'
        '&algorithm=SHA1&digits=$_digits&period=$_period';
  }

  /// The current expected code (useful for tests / debugging).
  String currentCode(String secret) => _codeAt(secret, _nowMs());

  /// Verifies [code] allowing ±1 time step for clock skew.
  bool verify(String secret, String code) {
    final input = code.trim();
    if (input.length != _digits) return false;
    final now = _nowMs();
    for (final offset in [0, -_period * 1000, _period * 1000]) {
      if (_codeAt(secret, now + offset) == input) return true;
    }
    return false;
  }

  String _codeAt(String secret, int timeMs) => OTP.generateTOTPCodeString(
        secret,
        timeMs,
        interval: _period,
        length: _digits,
        algorithm: Algorithm.SHA1,
        isGoogle: true,
      );

  int _nowMs() => DateTime.now().millisecondsSinceEpoch;

  /// Generates [count] one-time recovery codes in `XXXXX-XXXXX` form.
  List<String> generateRecoveryCodes([int count = 8]) {
    return List.generate(count, (_) {
      final t = secureToken(10).toUpperCase();
      return '${t.substring(0, 5)}-${t.substring(5, 10)}';
    });
  }
}
