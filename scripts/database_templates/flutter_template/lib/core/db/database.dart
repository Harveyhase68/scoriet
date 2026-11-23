import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mysql_client/mysql_client.dart';

import 'db_config.dart';

/// Owns a single [MySQLConnectionPool] for the whole app.
///
/// SCORIET: static file — every entity repository takes this [Database] and
/// calls [execute]. Repositories never open their own connections.
class Database {
  Database(this._config);

  final DbConfig _config;
  MySQLConnectionPool? _pool;

  MySQLConnectionPool get _connection {
    return _pool ??= MySQLConnectionPool(
      host: _config.host,
      port: _config.port,
      userName: _config.user,
      password: _config.password,
      databaseName: _config.database,
      maxConnections: _config.maxConnections,
      secure: _config.secure,
    );
  }

  /// Runs a (optionally parameterised) statement and returns the result.
  ///
  /// Uses named parameters (`:name`) so generated repositories can bind the
  /// entity fields by column name without worrying about positional order.
  Future<IResultSet> execute(
    String sql, [
    Map<String, dynamic>? params,
  ]) {
    return _connection.execute(sql, params);
  }

  /// Simple connectivity probe used by the status indicator.
  Future<bool> ping() async {
    try {
      await execute('SELECT 1');
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> close() async {
    await _pool?.close();
    _pool = null;
  }
}

/// The active [DbConfig]. Override in `main()`/tests to point elsewhere.
final dbConfigProvider = Provider<DbConfig>((ref) => DbConfig.dev);

/// App-wide database handle.
final databaseProvider = Provider<Database>((ref) {
  final db = Database(ref.watch(dbConfigProvider));
  ref.onDispose(db.close);
  return db;
});
