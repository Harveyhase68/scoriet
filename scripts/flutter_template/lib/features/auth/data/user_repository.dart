import '../../../core/db/database.dart';
import '../model/app_user.dart';

/// Data access for `users` plus the `password_reset_tokens` helper table.
class UserRepository {
  UserRepository(this._db);

  final Database _db;

  static const _cols = '''
    id, name, email, avatar_path, language, email_verified_at, password,
    remember_token, created_at, updated_at, two_factor_secret,
    two_factor_enabled, two_factor_confirmed_at, two_factor_recovery_codes,
    two_factor_last_verified_at
  ''';

  Future<AppUser?> getByEmail(String email) async {
    final r = await _db.execute(
      'SELECT $_cols FROM users WHERE email = :e LIMIT 1',
      {'e': email.trim().toLowerCase()},
    );
    return r.rows.isEmpty ? null : AppUser.fromRow(r.rows.first);
  }

  Future<AppUser?> getById(int id) async {
    final r = await _db.execute(
      'SELECT $_cols FROM users WHERE id = :id LIMIT 1',
      {'id': id},
    );
    return r.rows.isEmpty ? null : AppUser.fromRow(r.rows.first);
  }

  Future<bool> emailExists(String email) async {
    final r = await _db.execute(
      'SELECT 1 FROM users WHERE email = :e LIMIT 1',
      {'e': email.trim().toLowerCase()},
    );
    return r.rows.isNotEmpty;
  }

  Future<AppUser> insertUser({
    required String name,
    required String email,
    required String passwordHash,
    String language = 'en',
  }) async {
    await _db.execute(
      '''
      INSERT INTO users (name, email, password, language, created_at, updated_at)
      VALUES (:name, :email, :pw, :lang, NOW(), NOW())
      ''',
      {
        'name': name.trim(),
        'email': email.trim().toLowerCase(),
        'pw': passwordHash,
        'lang': language,
      },
    );
    return (await getByEmail(email))!;
  }

  Future<void> updateProfile({
    required int id,
    required String name,
    required String language,
    String? avatarPath,
  }) async {
    await _db.execute(
      '''
      UPDATE users SET name = :name, language = :lang, avatar_path = :avatar,
             updated_at = NOW()
      WHERE id = :id
      ''',
      {'id': id, 'name': name.trim(), 'lang': language, 'avatar': avatarPath},
    );
  }

  Future<void> updatePassword(int id, String passwordHash) async {
    await _db.execute(
      'UPDATE users SET password = :pw, updated_at = NOW() WHERE id = :id',
      {'id': id, 'pw': passwordHash},
    );
  }

  Future<void> enableTwoFactor({
    required int id,
    required String secret,
    required List<String> recoveryCodes,
  }) async {
    await _db.execute(
      '''
      UPDATE users SET
        two_factor_secret = :secret,
        two_factor_enabled = 1,
        two_factor_confirmed_at = NOW(),
        two_factor_recovery_codes = :codes,
        updated_at = NOW()
      WHERE id = :id
      ''',
      {'id': id, 'secret': secret, 'codes': AppUser.encodeCodes(recoveryCodes)},
    );
  }

  Future<void> disableTwoFactor(int id) async {
    await _db.execute(
      '''
      UPDATE users SET
        two_factor_secret = NULL,
        two_factor_enabled = 0,
        two_factor_confirmed_at = NULL,
        two_factor_recovery_codes = NULL,
        updated_at = NOW()
      WHERE id = :id
      ''',
      {'id': id},
    );
  }

  Future<void> updateRecoveryCodes(int id, List<String> codes) async {
    await _db.execute(
      'UPDATE users SET two_factor_recovery_codes = :codes WHERE id = :id',
      {'id': id, 'codes': AppUser.encodeCodes(codes)},
    );
  }

  Future<void> touchTwoFactorVerified(int id) async {
    await _db.execute(
      'UPDATE users SET two_factor_last_verified_at = NOW() WHERE id = :id',
      {'id': id},
    );
  }

  // ---- password_reset_tokens ----

  Future<void> upsertResetToken(String email, String tokenHash) async {
    await _db.execute(
      '''
      INSERT INTO password_reset_tokens (email, token, created_at)
      VALUES (:e, :t, NOW())
      ON DUPLICATE KEY UPDATE token = :t, created_at = NOW()
      ''',
      {'e': email.trim().toLowerCase(), 't': tokenHash},
    );
  }

  /// Returns `(tokenHash, createdAt)` or null.
  Future<({String tokenHash, DateTime? createdAt})?> getResetToken(
      String email) async {
    final r = await _db.execute(
      'SELECT token, created_at FROM password_reset_tokens WHERE email = :e',
      {'e': email.trim().toLowerCase()},
    );
    if (r.rows.isEmpty) return null;
    final m = r.rows.first.assoc();
    return (
      tokenHash: m['token'] ?? '',
      createdAt: (m['created_at'] == null || m['created_at']!.isEmpty)
          ? null
          : DateTime.tryParse(m['created_at']!),
    );
  }

  Future<void> deleteResetToken(String email) async {
    await _db.execute(
      'DELETE FROM password_reset_tokens WHERE email = :e',
      {'e': email.trim().toLowerCase()},
    );
  }
}
