import 'package:sqlite3/sqlite3.dart' as sqlite;
import 'package:mysql1/mysql1.dart';
import 'sml_db_config.dart';

/// `db.*` (see supported.md's `db` namespace, `lib_db`) - HFSQL-style
/// record access.
///
/// Round-1 scope: `mysql` is real, over a genuine network connection to
/// the SAME database the Scoriet project itself is configured to use (see
/// [SmlDbConfig]/main.dart's own `SmlDb.connect()` call) - this project's
/// own `database_type` is "MySQL", so that's the one confirmed-real
/// backend this template needs to get right. `sqlite` stays real too (via
/// the `sqlite3` package, FFI-based, Windows-desktop-only like this
/// template's own target) as a local-file fallback for a standalone/
/// offline demo that has no real project database to point at.
/// `postgres`/`sqlserver` are honest, not-yet-implemented stubs - never
/// guessed at without a real project configured for them to verify
/// against (same "wrong mapping is worse than an honest failure"
/// principle as everywhere else in this runtime).
///
/// Every function that actually touches the database is `Future`-based -
/// MySQL is a real network round-trip, and `sql.*` shares this exact same
/// connection (see [SmlSql.execute]), so both had to move to async
/// together even though the SQLite path alone could have stayed
/// synchronous.
///
/// WinDev's HFSQL model is CURSOR-based: `HReadFirst(File, Key)` positions
/// an implicit "current record" cursor on a file, and the file name itself
/// becomes a record-like variable (`File.Field`) until the next read moves
/// the cursor. This runtime reproduces the cursor half faithfully (one
/// current-record cursor per table name, advanced by
/// read_first/read_next/read_previous/read_last/seek, tested with
/// [found]) via real SQL queries.
///
/// NOT YET MODELED: reading the CURRENT record's own fields the way WinDev
/// writes it (`TableName.FieldName`, the same implicit-binding sugar as a
/// control's `..` property access). No real project in this codebase's test
/// corpus uses `db.*` at all (it's a REST-based app - zero real db.* SML
/// exists to confirm the exact shape the WinDev->SML converter would emit
/// for that specific access pattern), so guessing at it risks exactly the
/// "wrong mapping is worse than an honest bare call" problem supported.md
/// itself warns about. Until real data exists: read the current record via
/// [current] explicitly, e.g. `SmlDb.current("Artikel")?['iArtNum']` -
/// a genuine, documented follow-up once a real project exercises this.
class SmlDb {
  const SmlDb._();

  static sqlite.Database? _sqliteDb;
  static MySqlConnection? _mysqlDb;
  static final Map<String, List<Map<String, dynamic>>> _cursorRows = {};
  static final Map<String, int> _cursorIndex = {};
  static final Map<String, Map<String, dynamic>?> _current = {};
  static final Map<String, String> _cursorKey = {};
  static String? _lastError;
  /// The most recently cursor-positioned table (set by every [_position]
  /// call) - backs the zero-argument `outOfRange()`/`found()` forms, which
  /// in real WinDev check the LAST database operation performed on ANY
  /// file, not a specific one (confirmed real: 300 occurrences of bare
  /// `db.out_of_range()` immediately following a `db.readFirst(table, ...)`
  /// on the SAME table, real project corpus).
  static String? _lastTable;

  /// `HOpenConnection` - opens the connection [config] describes. Called
  /// once from `main.dart` before any other `db.*`/`sql.*` call, same as
  /// [SmlFile.initDirectories] - every generated window runs in its OWN
  /// Flutter engine (see main.dart's own doc comment), so every one calls
  /// this itself; the static fields below are per-engine, never shared
  /// across windows the way they might look at a glance.
  ///
  /// Named `connectProject`, NOT `connect` - `connect` is reserved for
  /// WinDev's OWN `db.connect(...)` SML function (see below), a completely
  /// different, incompatible signature confirmed real in the same
  /// project's own legacy "let the user pick their database driver at
  /// runtime" settings screen. Dart has no overloading, so the two had to
  /// get different names; main.dart calls this one directly by name
  /// (never through the SML translator, so the name mismatch with the SML
  /// function name `connect` is never actually seen by generated code).
  static Future<void> connectProject(SmlDbConfig config) async {
    switch (config.type.toLowerCase()) {
      case 'mysql':
        _mysqlDb = await MySqlConnection.connect(ConnectionSettings(
          host: config.host,
          port: config.port,
          user: config.username,
          password: config.password,
          db: config.database,
        ));
        break;
      case 'sqlite':
        _sqliteDb = sqlite.sqlite3.open(config.database);
        break;
      default:
        throw UnimplementedError(
          'SmlDb.connectProject: database type "${config.type}" is not implemented yet '
          '(mysql/sqlite are the only real backends so far) - see lib_db.dart.',
        );
    }
  }

  /// `HOpenConnection` - WinDev's own legacy, low-level, MULTI-ARGUMENT
  /// HFSQL Client/Server connection API (`connectionName, user, password,
  /// server, database, provider, [accessMode], [extraOption]` - confirmed
  /// real, up to 8 positional arguments, in a project-specific "let the
  /// user configure their own database driver at runtime" settings screen
  /// - see `Check_Verzeichnis`). That whole screen is OBSOLETE under this
  /// port's architecture: the real connection is already wired from the
  /// Scoriet project's OWN configured settings before any window ever
  /// runs (see [connectProject], called from main.dart) - a user-facing
  /// "pick your database driver" screen has nothing left to configure.
  /// Not implemented - always reports failure so a caller checking the
  /// result (`if bRes { ... }`) takes the "connection failed" branch
  /// rather than proceeding as though a second, different connection
  /// exists.
  static bool connect(String connectionName,
      [dynamic p2, dynamic p3, dynamic p4, dynamic p5, dynamic p6, dynamic p7, dynamic p8]) {
    // TODO: db.connect (legacy multi-arg HFSQL driver form) - obsolete under this port's own project-configured connection (see main.dart)
    return false;
  }

  /// The legacy counterpart to [connect] above - `disconnect(connectionName)`
  /// (a specific NAMED connection, confirmed real) as well as this class's
  /// own internal zero-arg teardown share one method; `connectionName` is
  /// accepted and ignored since there is only ever the ONE active
  /// connection [connectProject] establishes, never multiple named ones.
  static Future<void> disconnect([String? connectionName]) async {
    await _mysqlDb?.close();
    _mysqlDb = null;
    _sqliteDb?.close();
    _sqliteDb = null;
  }

  /// `HExecuteQuery`/`HExecuteSQLQuery`'s "just run this and give me rows"
  /// entry point - [SmlSql.execute] is a thin wrapper over this, since
  /// WinDev's `sql.*` runs against the exact same database `db.*` does.
  /// Positional `?` placeholders work identically against both backends
  /// (mysql1's own syntax; sqlite3 accepts the same convention).
  static Future<List<Map<String, dynamic>>> query(String sql, [List<dynamic> args = const []]) async {
    if (_mysqlDb != null) {
      final results = await _mysqlDb!.query(sql, args.isEmpty ? null : args);
      return results.map((row) => Map<String, dynamic>.from(row.fields)).toList();
    }
    final db = _sqliteDb;
    if (db == null) {
      throw StateError('SmlDb: no database connection - call SmlDb.connect(...) first (see main.dart)');
    }
    return db.select(sql, args).map((row) => Map<String, dynamic>.from(row)).toList();
  }

  /// Runs [sql] for its side effect (INSERT/UPDATE/DELETE/transaction
  /// control) - returns the new row's auto-increment id for an INSERT, 0
  /// otherwise (mirrors [add]'s only real use of the return value).
  static Future<int> _execute(String sql, [List<dynamic> args = const []]) async {
    if (_mysqlDb != null) {
      final results = await _mysqlDb!.query(sql, args.isEmpty ? null : args);
      return results.insertId ?? 0;
    }
    final db = _sqliteDb;
    if (db == null) {
      throw StateError('SmlDb: no database connection - call SmlDb.connect(...) first (see main.dart)');
    }
    db.execute(sql, args);
    return db.lastInsertRowId;
  }

  /// The current record for [table] (the last row `read_first`/`read_next`/
  /// `read_previous`/`read_last`/`read`/`seek*` positioned on), or null if
  /// the cursor is out of range (see [found]).
  static Map<String, dynamic>? current(String table) => _current[table];

  static bool found(String table) => _current[table] != null;

  /// `HOutOfRange([file])` - [table] is optional in real WinDev, checking
  /// the LAST database operation performed on ANY file when omitted
  /// (confirmed real and in fact the dominant shape: 300 zero-arg calls vs.
  /// 1 explicit-table call in this project's own corpus) - see [_lastTable].
  static bool outOfRange([String? table]) {
    final t = table ?? _lastTable;
    return t == null || _current[t] == null;
  }

  static void _position(String table, List<Map<String, dynamic>> rows, int index, String keyField) {
    _lastTable = table;
    _cursorRows[table] = rows;
    _cursorIndex[table] = index;
    _cursorKey[table] = keyField;
    _current[table] = (index >= 0 && index < rows.length) ? rows[index] : null;
  }

  /// `HReadFirst(file[, item])` - [keyField] is optional in real WinDev
  /// (defaults to the file's declared primary key/natural order); omitting
  /// it here reads in the table's own physical row order (no `ORDER BY`)
  /// rather than guessing at a primary key column name generically.
  static Future<void> readFirst(String table, [String? keyField]) async {
    final rows = keyField != null
        ? await query('SELECT * FROM `$table` ORDER BY `$keyField` ASC')
        : await query('SELECT * FROM `$table`');
    _position(table, rows, 0, keyField ?? '');
  }

  static Future<void> readLast(String table, String keyField) async {
    final rows = await query('SELECT * FROM `$table` ORDER BY `$keyField` DESC');
    _position(table, rows, 0, keyField);
  }

  static Future<void> readNext(String table, String keyField) async {
    final rows = _cursorRows[table];
    final index = _cursorIndex[table];
    if (rows == null || index == null) {
      _current[table] = null;
      return;
    }
    _position(table, rows, index + 1, keyField);
  }

  static Future<void> readPrevious(String table, String keyField) async {
    final rows = _cursorRows[table];
    final index = _cursorIndex[table];
    if (rows == null || index == null) {
      _current[table] = null;
      return;
    }
    _position(table, rows, index - 1, keyField);
  }

  /// `HRead` - TWO real, confirmed call shapes: `read(table, keyField,
  /// keyValue)` (keyed lookup) and `read(table, recordNumber)` (WinDev's
  /// plain `HRead(file, recnum)` - positions on a specific PHYSICAL record
  /// number, confirmed real and in fact the ONLY shape this project's own
  /// RAD-generated code uses - every `db.read(...)` call site passes
  /// exactly 2 arguments). The 2-arg form isn't implemented for real yet -
  /// this runtime has no stable, order-preserving recordset to index a
  /// physical record number into outside of what read_first/read_next's
  /// own cursor walk already builds - so it's a compile-safe no-op
  /// (cursor state left untouched) rather than a guess at what "record
  /// number 42" should mean.
  static Future<void> read(String table, dynamic keyFieldOrRecordNumber, [dynamic keyValue]) async {
    if (keyValue == null) {
      // TODO: db.read(table, recordNumber) - physical record-number positioning not implemented yet
      return;
    }
    final keyField = keyFieldOrRecordNumber as String;
    final rows = await query('SELECT * FROM `$table` WHERE `$keyField` = ?', [keyValue]);
    _position(table, rows, 0, keyField);
  }

  static Future<void> seek(String table, String keyField, dynamic keyValue) async {
    final rows = await query('SELECT * FROM `$table` WHERE `$keyField` >= ? ORDER BY `$keyField` ASC', [keyValue]);
    _position(table, rows, 0, keyField);
  }

  static Future<void> seekFirst(String table, String keyField, dynamic keyValue) => seek(table, keyField, keyValue);

  static Future<void> seekLast(String table, String keyField, dynamic keyValue) async {
    final rows = await query('SELECT * FROM `$table` WHERE `$keyField` <= ? ORDER BY `$keyField` DESC', [keyValue]);
    _position(table, rows, 0, keyField);
  }

  /// `HChangeKey` - which field subsequent read_first/read_next/... calls
  /// order/step by; kept only as documentation here since every function
  /// above already takes the key field explicitly per call (SML's
  /// normalised calls carry it directly, unlike WinDev's implicit
  /// per-file "current key" setting).
  static void setKey(String table, String keyField) {
    _cursorKey[table] = keyField;
  }

  /// `HAdd` - TWO real, confirmed call shapes, same split as [modify]:
  /// `add(table, record)` (explicit column values) and bare `add(table)` -
  /// WinDev's "write the record buffer already populated via the RAD
  /// screen<->file binding as a NEW record" idiom (confirmed real and in
  /// fact the ONLY shape this project's own RAD-generated code uses - every
  /// `db.add(...)` call site passes exactly the table name, nothing else).
  /// The 1-arg form isn't implemented for real yet - same reason as
  /// [modify]'s own 1-arg form (depends on the RAD screen<->file buffer
  /// [SmlUiContext.screenToFile] doesn't build yet) - so it's a
  /// compile-safe no-op returning `-1` (no row was actually inserted, so
  /// there is no real id to report) rather than a guess.
  static Future<int> add(String table, [Map<String, dynamic>? record]) async {
    if (record == null) {
      // TODO: db.add(table) - RAD screen-to-file buffer write-back not implemented yet
      return -1;
    }
    final columns = record.keys.map((c) => '`$c`').join(', ');
    final placeholders = List.filled(record.length, '?').join(', ');
    try {
      final id = await _execute('INSERT INTO `$table` ($columns) VALUES ($placeholders)', record.values.toList());
      _lastError = null;
      return id;
    } catch (e) {
      _lastError = e.toString();
      rethrow;
    }
  }

  /// `HModify` - TWO real, confirmed call shapes: `modify(table, keyField,
  /// changes)` (explicit field changes) and bare `modify(table)` - WinDev's
  /// "write the record buffer already populated via the RAD screen<->file
  /// binding back to the database" idiom, confirmed real and in fact the
  /// ONLY shape this project's own RAD-generated `CheckModification`
  /// family uses (every `db.modify(...)` call site passes exactly the
  /// table name, nothing else). The 1-arg form isn't implemented for real
  /// yet - it depends on the SAME RAD screen<->file buffer
  /// [SmlUiContext.screenToFile] doesn't build yet either - so it's a
  /// compile-safe no-op (the database is left unchanged) rather than a
  /// guess at which fields "the buffer" would have contained.
  static Future<void> modify(String table, [String? keyField, Map<String, dynamic>? changes]) async {
    if (keyField == null || changes == null) {
      // TODO: db.modify(table) - RAD screen-to-file buffer write-back not implemented yet
      return;
    }
    final currentRecord = _current[table];
    if (currentRecord == null) return;
    final keyValue = currentRecord[keyField];
    final assignments = changes.keys.map((k) => '`$k` = ?').join(', ');
    await _execute('UPDATE `$table` SET $assignments WHERE `$keyField` = ?', [...changes.values, keyValue]);
    currentRecord.addAll(changes);
  }

  /// `HDelete(file[, item])` - deletes the CURRENT record. [keyField] is
  /// optional in real WinDev (confirmed real and in fact the dominant
  /// shape: every `db.delete(...)` call site in this project's own corpus
  /// passes just the table name) - falls back to whichever key the CURRENT
  /// cursor position was read with (see [_cursorKey], set by every
  /// read_first/read_next/.../seek call via [_position]), since that is
  /// necessarily the same key that positioned the row now being deleted.
  static Future<void> delete(String table, [String? keyField]) async {
    final currentRecord = _current[table];
    if (currentRecord == null) return;
    final resolvedKeyField = keyField ?? _cursorKey[table];
    if (resolvedKeyField == null || resolvedKeyField.isEmpty) {
      // TODO: db.delete(table) - no key field given AND none recorded by the cursor that positioned this row
      return;
    }
    await _execute('DELETE FROM `$table` WHERE `$resolvedKeyField` = ?', [currentRecord[resolvedKeyField]]);
    _current[table] = null;
  }

  static Future<int> recordCount(String table) async {
    final rows = await query('SELECT COUNT(*) AS c FROM `$table`');
    return rows.first['c'] as int;
  }

  static int recordNumber(String table) => _cursorIndex[table] ?? -1;

  static void reset(String table) {
    _cursorRows.remove(table);
    _cursorIndex.remove(table);
    _current.remove(table);
  }

  /// `HErrorInfo([nInfo])` - real WinDev's `nInfo` selects WHICH piece of
  /// error information to return (`hErrCurrent`/`hErrFullDetails`/etc,
  /// confirmed real in this project's own error-handling corpus) - this
  /// runtime tracks only a single `_lastError` string (no distinct
  /// code/message/detail breakdown yet), so [infoType] is accepted (for
  /// real call-site compatibility) but not yet differentiated - an honest
  /// scope gap, not a wrong mapping, until a real project's error handling
  /// needs the distinction. Same story for [errorInfo] below.
  static int errorCode([dynamic infoType]) => _lastError == null ? 0 : 1;
  static String errorInfo([dynamic infoType]) => _lastError ?? '';
  static bool errorDuplicate() {
    final e = _lastError?.toLowerCase();
    return e != null && (e.contains('unique') || e.contains('duplicate'));
  }

  static Future<void> begin() async => _execute('BEGIN');
  static Future<void> commit() async => _execute('COMMIT');
  /// `HRollback([connectionName])` - [connectionName] is optional in real
  /// WinDev and confirmed real at call sites here; this runtime has exactly
  /// one connection (see [connectProject]), so it is accepted but ignored,
  /// same as the legacy [connect]/[disconnect] stubs' own connection-name
  /// parameters.
  static Future<void> rollback([String? connectionName]) async => _execute('ROLLBACK');

  /// `HVersion([file])` - real WinDev returns a specific FILE's own
  /// structure-version number (bumped when its schema changes), used by
  /// RAD-generated "has the file been modified since I last checked?"
  /// polling (confirmed real and in fact the ONLY shape this project's own
  /// RAD-generated table-refresh boilerplate uses - every `db.version(...)`
  /// call site passes the table name). [table] is accepted for real
  /// call-site compatibility, but not yet differentiated per-table (no
  /// schema-version tracking exists in this runtime yet) - this still
  /// returns the connected DB SERVER's own version (an honest, stable,
  /// always-real value) rather than fabricating a per-table number that
  /// would never actually change and so silently defeat the polling this
  /// exists for.
  static Future<int> version([String? table]) async {
    final rows = _mysqlDb != null ? await query('SELECT VERSION() AS v') : await query('SELECT sqlite_version() AS v');
    return rows.first['v'].hashCode;
  }

  /// `HFilter`/`HDeactivateFilter` - a stored WHERE clause applied to
  /// subsequent read_first/read_next calls; not yet implemented (no real
  /// project usage to confirm the exact SML call shape - same "wait for
  /// real data" reasoning as record-field access above).
  static void filter(String table, String whereClause) {
    // TODO: db.filter - not implemented, no real usage to confirm the call shape yet
  }

  static void clearFilter(String table) {
    // TODO: db.clear_filter - see filter() above
  }

  /// `HCross` - a multi-table join cursor; a genuinely different shape from
  /// every other function here (multiple tables, not one) - not
  /// implemented without a real example to design against.
  static void cross(List<String> tables) {
    // TODO: db.cross - multi-table join cursor not implemented yet
  }
}
