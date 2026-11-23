import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/password_hasher.dart';
import '../../../core/auth/totp_service.dart';
import '../data/user_repository.dart';
import '../model/app_user.dart';
import 'auth_providers.dart';

/// Data needed to render the 2FA setup screen before it is confirmed/persisted.
class TwoFactorSetup {
  const TwoFactorSetup({required this.secret, required this.otpauthUri});
  final String secret;
  final String otpauthUri;
}

final accountControllerProvider =
    Provider<AccountController>((ref) => AccountController(ref));

/// Operations on the currently signed-in account: profile, password, 2FA.
class AccountController {
  AccountController(this._ref);
  final Ref _ref;

  UserRepository get _repo => _ref.read(userRepositoryProvider);
  PasswordHasher get _hasher => _ref.read(passwordHasherProvider);
  TotpService get _totp => _ref.read(totpServiceProvider);

  AppUser get _current {
    final u = _ref.read(authControllerProvider).user;
    if (u == null) throw const AuthException('Nicht angemeldet.');
    return u;
  }

  Future<void> updateProfile({
    required String name,
    required String language,
    String? avatarPath,
  }) async {
    await _repo.updateProfile(
      id: _current.id!,
      name: name,
      language: language,
      avatarPath: avatarPath,
    );
    await _ref.read(authControllerProvider.notifier).refresh();
  }

  Future<void> changePassword({
    required String current,
    required String next,
  }) async {
    final u = _current;
    if (!_hasher.verify(current, u.passwordHash)) {
      throw const AuthException('Aktuelles Passwort ist falsch.');
    }
    await _repo.updatePassword(u.id!, _hasher.hash(next));
    await _ref.read(authControllerProvider.notifier).refresh();
  }

  // ---- two-factor ----

  /// Starts setup: fresh secret + otpauth URI (not persisted until confirmed).
  TwoFactorSetup beginTwoFactorSetup() {
    final secret = _totp.generateSecret();
    return TwoFactorSetup(
      secret: secret,
      otpauthUri: _totp.otpauthUri(account: _current.email, secret: secret),
    );
  }

  /// Confirms setup with a code, persists it, and returns recovery codes.
  Future<List<String>> confirmTwoFactor({
    required String secret,
    required String code,
  }) async {
    if (!_totp.verify(secret, code)) {
      throw const AuthException('Der Code stimmt nicht. Bitte erneut versuchen.');
    }
    final codes = _totp.generateRecoveryCodes();
    await _repo.enableTwoFactor(
        id: _current.id!, secret: secret, recoveryCodes: codes);
    await _ref.read(authControllerProvider.notifier).refresh();
    return codes;
  }

  Future<void> disableTwoFactor() async {
    await _repo.disableTwoFactor(_current.id!);
    await _ref.read(authControllerProvider.notifier).refresh();
  }
}
