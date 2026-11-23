import 'dart:convert';

import 'package:mysql_client/mysql_client.dart';

/// Domain model for the `users` table (Laravel/Fortify-style columns).
///
/// Holds sensitive fields ([passwordHash], [twoFactorSecret], [recoveryCodes])
/// because this is a thick desktop client that talks to MySQL directly; they
/// are never rendered in the UI.
class AppUser {
  const AppUser({
    this.id,
    required this.name,
    required this.email,
    this.avatarPath,
    this.language = 'en',
    this.emailVerifiedAt,
    this.passwordHash = '',
    this.twoFactorSecret,
    this.twoFactorEnabled = false,
    this.twoFactorConfirmedAt,
    this.recoveryCodes = const [],
    this.createdAt,
    this.updatedAt,
  });

  final int? id;
  final String name;
  final String email;
  final String? avatarPath;
  final String language;
  final DateTime? emailVerifiedAt;
  final String passwordHash;
  final String? twoFactorSecret;
  final bool twoFactorEnabled;
  final DateTime? twoFactorConfirmedAt;
  final List<String> recoveryCodes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  String get initials {
    final parts =
        name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return email.isNotEmpty ? email[0].toUpperCase() : '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  factory AppUser.fromRow(ResultSetRow row) {
    final m = row.assoc();
    return AppUser(
      id: _int(m['id']),
      name: m['name'] ?? '',
      email: m['email'] ?? '',
      avatarPath: m['avatar_path'],
      language: m['language'] ?? 'en',
      emailVerifiedAt: _dt(m['email_verified_at']),
      passwordHash: m['password'] ?? '',
      twoFactorSecret: m['two_factor_secret'],
      twoFactorEnabled: (m['two_factor_enabled'] ?? '0') == '1',
      twoFactorConfirmedAt: _dt(m['two_factor_confirmed_at']),
      recoveryCodes: _decodeCodes(m['two_factor_recovery_codes']),
      createdAt: _dt(m['created_at']),
      updatedAt: _dt(m['updated_at']),
    );
  }

  AppUser copyWith({
    String? name,
    String? email,
    String? avatarPath,
    String? language,
    bool? twoFactorEnabled,
    String? twoFactorSecret,
    List<String>? recoveryCodes,
  }) {
    return AppUser(
      id: id,
      name: name ?? this.name,
      email: email ?? this.email,
      avatarPath: avatarPath ?? this.avatarPath,
      language: language ?? this.language,
      emailVerifiedAt: emailVerifiedAt,
      passwordHash: passwordHash,
      twoFactorSecret: twoFactorSecret ?? this.twoFactorSecret,
      twoFactorEnabled: twoFactorEnabled ?? this.twoFactorEnabled,
      twoFactorConfirmedAt: twoFactorConfirmedAt,
      recoveryCodes: recoveryCodes ?? this.recoveryCodes,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  static List<String> _decodeCodes(String? raw) {
    if (raw == null || raw.trim().isEmpty) return const [];
    try {
      final decoded = jsonDecode(raw);
      if (decoded is List) return decoded.map((e) => '$e').toList();
    } catch (_) {}
    return const [];
  }

  static String encodeCodes(List<String> codes) => jsonEncode(codes);

  static int? _int(String? v) => v == null ? null : int.tryParse(v);
  static DateTime? _dt(String? v) =>
      (v == null || v.isEmpty) ? null : DateTime.tryParse(v);
}
