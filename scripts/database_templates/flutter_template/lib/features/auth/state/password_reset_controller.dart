import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/crypto_random.dart';
import '../../../core/auth/mail_sender.dart';
import '../data/user_repository.dart';
import 'auth_providers.dart';

final passwordResetControllerProvider =
    Provider<PasswordResetController>((ref) => PasswordResetController(ref));

/// Token-based password reset. A random token is generated, its SHA-256 hash
/// is stored in `password_reset_tokens`, and the plaintext is emailed via the
/// [mailSenderProvider] hook.
class PasswordResetController {
  PasswordResetController(this._ref);
  final Ref _ref;

  static const validFor = Duration(minutes: 60);

  UserRepository get _repo => _ref.read(userRepositoryProvider);

  /// Requests a reset. Returns the plaintext token ONLY so the debug mail
  /// sender flow is usable without SMTP; with real SMTP configured, ignore it.
  /// Returns null when no user matches (without revealing that to the caller's
  /// UI, which should show the same confirmation either way).
  Future<String?> requestReset(String email) async {
    final user = await _repo.getByEmail(email);
    if (user == null) return null;

    final token = secureToken(24);
    final hash = sha256.convert(utf8.encode(token)).toString();
    await _repo.upsertResetToken(email, hash);
    await _ref
        .read(mailSenderProvider)
        .sendPasswordReset(to: email, token: token, validFor: validFor);
    return token;
  }

  Future<void> resetPassword({
    required String email,
    required String token,
    required String newPassword,
  }) async {
    final row = await _repo.getResetToken(email);
    if (row == null) {
      throw const AuthException('Kein Reset für diese E-Mail angefordert.');
    }
    if (row.createdAt != null &&
        DateTime.now().difference(row.createdAt!) > validFor) {
      await _repo.deleteResetToken(email);
      throw const AuthException('Der Reset-Code ist abgelaufen.');
    }
    final hash = sha256.convert(utf8.encode(token.trim())).toString();
    if (hash != row.tokenHash) {
      throw const AuthException('Ungültiger Reset-Code.');
    }
    final user = await _repo.getByEmail(email);
    if (user == null) throw const AuthException('Benutzer nicht gefunden.');

    final hasher = _ref.read(passwordHasherProvider);
    await _repo.updatePassword(user.id!, hasher.hash(newPassword));
    await _repo.deleteResetToken(email);
  }
}
