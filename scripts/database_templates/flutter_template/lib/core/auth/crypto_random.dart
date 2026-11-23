import 'dart:math';
import 'dart:typed_data';

/// Cryptographically secure random helpers shared by the auth layer.
final Random _rng = Random.secure();

Uint8List secureBytes(int length) {
  return Uint8List.fromList(List.generate(length, (_) => _rng.nextInt(256)));
}

/// A URL-safe random token string (used for password-reset tokens).
String secureToken([int bytes = 32]) {
  const alphabet =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return List.generate(bytes, (_) => alphabet[_rng.nextInt(alphabet.length)])
      .join();
}
