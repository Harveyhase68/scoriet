import 'database.dart';

/// Ensures the auth tables exist. Unlike the business schema (see
/// `db_bootstrap.dart`, generated from the project's own tables), `users` and
/// `password_reset_tokens` are a FIXED shape owned by the auth feature
/// itself, not derived from the schema — a generic project can't be assumed
/// to already ship a Laravel/Fortify-style `users` table, so it is created
/// here if missing, same as every other table.
Future<void> ensureAuthSchema(Database db) async {
  await db.execute('''
    CREATE TABLE IF NOT EXISTS users (
      id                          bigint unsigned NOT NULL AUTO_INCREMENT,
      name                        varchar(255) NOT NULL,
      email                       varchar(255) NOT NULL,
      avatar_path                 varchar(255) NULL,
      language                    varchar(10) NOT NULL DEFAULT 'en',
      email_verified_at           timestamp NULL DEFAULT NULL,
      password                    varchar(255) NOT NULL,
      remember_token              varchar(100) NULL,
      two_factor_secret           text NULL,
      two_factor_enabled          tinyint(1) NOT NULL DEFAULT 0,
      two_factor_confirmed_at     timestamp NULL DEFAULT NULL,
      two_factor_recovery_codes   text NULL,
      two_factor_last_verified_at timestamp NULL DEFAULT NULL,
      created_at                  timestamp NULL DEFAULT NULL,
      updated_at                  timestamp NULL DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY users_email_unique (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  ''');

  await db.execute('''
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      email      varchar(255) NOT NULL,
      token      varchar(255) NOT NULL,
      created_at timestamp NULL DEFAULT NULL,
      PRIMARY KEY (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  ''');
}
