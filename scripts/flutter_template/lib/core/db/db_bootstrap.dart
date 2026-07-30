import 'package:mysql_client/mysql_client.dart';

import 'db_config.dart';

/// SCORIET: generated once per project — full `CREATE TABLE` / `FOREIGN KEY`
/// DDL for every table in the schema, used by [DbBootstrapGate] to offer
/// creating a missing database on first run instead of just failing.
///
/// Foreign keys are kept as a separate statement list, applied only after
/// every table exists, so table creation order never has to account for
/// dependency order.
///
/// KNOWN LIMITATION: composite (multi-column) UNIQUE/INDEX constraints are
/// only represented by their first column here — the schema/gtree's `keys`
/// array exposes one entry per constraint, not per constraint column, so a
/// `UNIQUE(a, b)` constraint is emitted as `UNIQUE KEY (a)`. Single-column
/// constraints and every PRIMARY KEY / FOREIGN KEY are unaffected. This
/// mirrors a pre-existing limitation of the repository's own business-key
/// detection, not something introduced here.
{:code:}
function sqlQuote(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function columnTypeSql(f) {
  var t = f.type;
  if (t === 'VARCHAR' || t === 'CHAR') return t + '(' + (f.size || 255) + ')';
  if (t === 'DECIMAL' || t === 'NUMERIC') return t + '(' + (f.precision || 10) + ',' + (f.scale || 0) + ')';
  if (t === 'ENUM' || t === 'SET') {
    var vals = (f.enum_values || []).map(sqlQuote).join(',');
    return t + '(' + vals + ')';
  }
  if (f.size && (t === 'INT' || t === 'BIGINT' || t === 'SMALLINT' || t === 'TINYINT' || t === 'MEDIUMINT')) {
    return t + '(' + f.size + ')';
  }
  return t;
}

function defaultSql(f) {
  if (f.default === null || f.default === undefined || f.default === '') return null;
  var d = String(f.default);
  if (/^CURRENT_TIMESTAMP/i.test(d)) return d;
  if (f.type === 'ENUM' || f.type === 'SET') return sqlQuote(d);
  if (f.phptype === 'int' || f.phptype === 'float') {
    return /^-?[0-9]+(\.[0-9]+)?$/.test(d) ? d : sqlQuote(d);
  }
  return sqlQuote(d);
}

function columnDdl(f) {
  var parts = ['`' + f.name + '`', columnTypeSql(f)];
  if (f.unsigned) parts.push('UNSIGNED');
  if (f.is_generated) {
    parts.push('GENERATED ALWAYS AS (' + (f.generation_expression || 'NULL') + ') ' + (f.generation_storage || 'VIRTUAL'));
    if (f.notnull) parts.push('NOT NULL');
    return parts.join(' ');
  }
  parts.push(f.notnull ? 'NOT NULL' : 'NULL');
  if (f.autoincrement) {
    parts.push('AUTO_INCREMENT');
  } else {
    var def = defaultSql(f);
    if (def !== null) parts.push('DEFAULT ' + def);
  }
  return parts.join(' ');
}

var project = gtree[0].project[0];
var tablesgen = project.tablesgen || [];
var allTables = project.tables || [];

var createStatements = [];
var fkStatements = [];

for (var ti = 0; ti < tablesgen.length; ti++) {
  var table = allTables[tablesgen[ti]];
  var fields = table.fields || [];
  var keys = table.keys || [];
  var foreignkeys = table.foreignkeys || [];

  var lines = [];
  for (var fi = 0; fi < fields.length; fi++) {
    lines.push('  ' + columnDdl(fields[fi]));
  }

  var pkCols = fields.filter(function (f) { return f.isprimary; }).map(function (f) { return '`' + f.name + '`'; });
  if (pkCols.length > 0) lines.push('  PRIMARY KEY (' + pkCols.join(', ') + ')');

  var keyGroups = {};
  var keyOrder = [];
  keys.forEach(function (k) {
    if (k.isprimary) return;
    if (!keyGroups[k.constraintname]) {
      keyGroups[k.constraintname] = { unique: k.isunique, cols: [] };
      keyOrder.push(k.constraintname);
    }
    keyGroups[k.constraintname].cols.push('`' + k.name + '`');
  });
  keyOrder.forEach(function (cn) {
    var g = keyGroups[cn];
    var kw = g.unique ? 'UNIQUE KEY' : 'KEY';
    lines.push('  ' + kw + ' `' + cn + '` (' + g.cols.join(', ') + ')');
  });

  // `__DB__` is substituted for the real (project-configured) database name
  // at runtime — see databaseNamePlaceholder usage in createDatabaseAndSchema.
  // Every table is schema-qualified so no `USE` statement is ever needed
  // (mysql_client executes one statement per call, no multi-statement support).
  var sql = 'CREATE TABLE IF NOT EXISTS `__DB__`.`' + table.filename + '` (\n' + lines.join(',\n') + '\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;';
  createStatements.push(sql);

  foreignkeys.forEach(function (fk) {
    var fkSql = 'ALTER TABLE `__DB__`.`' + table.filename + '` ADD CONSTRAINT `' + fk.constraintname +
      '` FOREIGN KEY (`' + fk.name + '`) REFERENCES `__DB__`.`' + fk.referencedtable + '` (`' + fk.referencedcolumn +
      '`) ON DELETE ' + (fk.ondelete || 'RESTRICT') + ' ON UPDATE ' + (fk.onupdate || 'RESTRICT') + ';';
    fkStatements.push(fkSql);
  });
}

var out = 'const List<String> kCreateTableStatements = [\n';
createStatements.forEach(function (s) {
  out += '  r"""\n' + s + '\n""",\n';
});
out += '];\n\n';

out += 'const List<String> kForeignKeyStatements = [\n';
fkStatements.forEach(function (s) {
  out += '  r"""' + s + '""",\n';
});
out += '];\n';

sContentResult += out;
return sContentResult;
{:codeend:}

/// Checks whether [DbConfig.database] exists on the server. Connects via the
/// always-present `information_schema` database first, so this works even
/// when the app's own database doesn't exist yet.
Future<bool> databaseExists(DbConfig config) async {
  final probe = MySQLConnectionPool(
    host: config.host,
    port: config.port,
    userName: config.user,
    password: config.password,
    databaseName: 'information_schema',
    maxConnections: 1,
    secure: config.secure,
  );
  try {
    final result = await probe.execute(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = :name',
      {'name': config.database},
    );
    return result.rows.isNotEmpty;
  } finally {
    await probe.close();
  }
}

/// Creates [DbConfig.database] plus every table and foreign key in the
/// schema. Tables are created first (no inline FKs), then every foreign key
/// is added via `ALTER TABLE` — so creation order never needs to account for
/// inter-table dependencies.
Future<void> createDatabaseAndSchema(DbConfig config) async {
  final probe = MySQLConnectionPool(
    host: config.host,
    port: config.port,
    userName: config.user,
    password: config.password,
    databaseName: 'information_schema',
    maxConnections: 1,
    secure: config.secure,
  );
  try {
    await probe.execute(
      'CREATE DATABASE IF NOT EXISTS `${config.database}` '
      'CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    );
    // Every generated statement is schema-qualified with a `__DB__`
    // placeholder instead of relying on `USE` — mysql_client executes one
    // statement per call with no multi-statement support, so `USE x; SQL`
    // as a single execute() call would not reliably switch databases.
    for (final sql in kCreateTableStatements) {
      await probe.execute(sql.replaceAll('__DB__', config.database));
    }
    for (final sql in kForeignKeyStatements) {
      await probe.execute(sql.replaceAll('__DB__', config.database));
    }
  } finally {
    await probe.close();
  }
}
