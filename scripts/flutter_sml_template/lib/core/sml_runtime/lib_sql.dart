import 'lib_db.dart';

/// `sql.*` (see supported.md's `sql` namespace, `lib_sql`) - raw/stored
/// queries against the exact same database `db.*` uses (see
/// `SmlDb.query()`), for `HExecuteQuery`/`HExecuteSQLQuery`'s "just run
/// this SQL and give me rows" use case rather than HFSQL's cursor model.
class SmlSql {
  const SmlSql._();

  /// `HExecuteQuery`/`HExecuteSQLQuery` - runs [sql] with positional [args]
  /// and returns every row as a `Map<String, dynamic>`.
  static Future<List<Map<String, dynamic>>> execute(String sql, [List<dynamic> args = const []]) =>
      SmlDb.query(sql, args);

  static Future<List<Map<String, dynamic>>> executeSql(String sql, [List<dynamic> args = const []]) =>
      execute(sql, args);
}
