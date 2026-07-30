import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/password_hasher.dart';
import '../../../core/auth/totp_service.dart';
import '../../../core/db/database.dart';
import '../data/user_repository.dart';
import '../model/app_user.dart';

/// Thrown for expected auth failures; its [message] is safe to show to users.
class AuthException implements Exception {
  const AuthException(this.message);
  final String message;
  @override
  String toString() => message;
}

// ---- shared services ----
final userRepositoryProvider = Provider<UserRepository>((ref) {
  return UserRepository(ref.watch(databaseProvider));
});
final passwordHasherProvider =
    Provider<PasswordHasher>((ref) => const PasswordHasher());
final totpServiceProvider = Provider<TotpService>((ref) => const TotpService());

/// The authentication session.
class AuthState {
  const AuthState({this.user, this.pendingTwoFactor});

  /// The signed-in user, or null when logged out.
  final AppUser? user;

  /// A user who passed the password check but still owes a 2FA code.
  final AppUser? pendingTwoFactor;

  bool get isAuthenticated => user != null;
  bool get needsTwoFactor => pendingTwoFactor != null;
}

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);

/// Convenience accessor for the current user.
final currentUserProvider =
    Provider<AppUser?>((ref) => ref.watch(authControllerProvider).user);

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() => const AuthState();

  UserRepository get _repo => ref.read(userRepositoryProvider);
  PasswordHasher get _hasher => ref.read(passwordHasherProvider);
  TotpService get _totp => ref.read(totpServiceProvider);

  Future<void> login(String email, String password) async {
    final user = await _repo.getByEmail(email);
    if (user == null || !_hasher.verify(password, user.passwordHash)) {
      throw const AuthException('E-Mail oder Passwort ist falsch.');
    }
    if (user.twoFactorEnabled && (user.twoFactorSecret ?? '').isNotEmpty) {
      state = AuthState(pendingTwoFactor: user);
    } else {
      state = AuthState(user: user);
    }
  }

  Future<void> verifyTwoFactor(String code) async {
    final u = state.pendingTwoFactor;
    if (u == null) throw const AuthException('Keine 2FA-Anmeldung aktiv.');

    if (_totp.verify(u.twoFactorSecret!, code)) {
      await _repo.touchTwoFactorVerified(u.id!);
      state = AuthState(user: u);
      return;
    }
    // Fall back to a one-time recovery code.
    final normalized = code.trim().toUpperCase();
    if (u.recoveryCodes.contains(normalized)) {
      final remaining = [...u.recoveryCodes]..remove(normalized);
      await _repo.updateRecoveryCodes(u.id!, remaining);
      await _repo.touchTwoFactorVerified(u.id!);
      state = AuthState(user: u.copyWith(recoveryCodes: remaining));
      return;
    }
    throw const AuthException('Ungültiger Code.');
  }

  void cancelTwoFactor() => state = const AuthState();

  Future<void> register({
    required String name,
    required String email,
    required String password,
    String language = 'de',
  }) async {
    if (await _repo.emailExists(email)) {
      throw const AuthException('Diese E-Mail ist bereits registriert.');
    }
    final user = await _repo.insertUser(
      name: name,
      email: email,
      passwordHash: _hasher.hash(password),
      language: language,
    );
    state = AuthState(user: user);
  }

  void logout() => state = const AuthState();

  /// Re-reads the current user from the DB (after profile/2FA changes).
  Future<void> refresh() async {
    final id = state.user?.id;
    if (id == null) return;
    final fresh = await _repo.getById(id);
    if (fresh != null) state = AuthState(user: fresh);
  }
}
