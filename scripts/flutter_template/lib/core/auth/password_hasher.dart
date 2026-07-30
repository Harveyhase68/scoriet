import 'dart:convert';

import 'package:hashlib/hashlib.dart';

import 'crypto_random.dart';

/// Argon2id password hashing.
///
/// Produces a PHC-format string (`$argon2id$v=19$m=...,t=...,p=...$salt$hash`)
/// that is self-describing, so [verify] needs no separately stored parameters.
class PasswordHasher {
  const PasswordHasher();

  /// Hash length 32 bytes, 16-byte random salt, Argon2Security.good params.
  String hash(String password) {
    final salt = secureBytes(16);
    return argon2id(utf8.encode(password), salt).encoded();
  }

  bool verify(String password, String encoded) {
    if (encoded.isEmpty) return false;
    try {
      return argon2Verify(encoded, utf8.encode(password));
    } catch (_) {
      return false;
    }
  }
}
