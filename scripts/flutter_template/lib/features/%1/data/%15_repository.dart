import '../../../core/db/database.dart';
import '../../../core/ui/lookup_field.dart';
import '../model/{:filesingularlower:}.dart';

/// Data access for the `{:filename:}` table.
///
/// SCORIET: one repository per table. The SQL strings and the table/column
/// names are the only entity-specific parts; the method shapes (list/search/
/// get/insert/update/delete/count) are identical across every generated table.
class {:filesingularpascalcase:}Repository {
{:code:}
var table = gtree[0].project[0].tables[gtree[0].project[0].tableindex];
var fields = table.fields;
var entity = table.filesingularpascalcase;
var entityLower = table.filesingularcamelcase;

var pkField = fields.find(function (f) { return f.isprimary; });
var foreignkeys = table.foreignkeys || [];
// "Business key": first non-PK, single-column UNIQUE constraint in declaration
// order, falling back to the surrogate PK when a table has none. `item.isunique`
// is true for EVERY column in a UNIQUE constraint, including composite ones
// (e.g. UNIQUE(cust_no, addr_no) on a join table) — a lone half of a composite
// key isn't actually unique by itself, so those must be excluded by counting
// constraint members via `table.keys` (one row per constraint column). FK
// columns are excluded too, even single-column-unique ones — an FK isn't a
// plain editable identity field, it needs the LookupField/combobox treatment.
var keys = table.keys || [];
var uniqueConstraintSize = {};
keys.forEach(function (k) {
  if (!k.isunique || k.isprimary) return;
  uniqueConstraintSize[k.constraintname] = (uniqueConstraintSize[k.constraintname] || 0) + 1;
});
var singleColumnUniqueNames = keys.filter(function (k) {
  return k.isunique && !k.isprimary && uniqueConstraintSize[k.constraintname] === 1;
}).map(function (k) { return k.name; });
var keyField = fields.find(function (f) {
  return singleColumnUniqueNames.indexOf(f.name) !== -1 && !foreignkeys.some(function (fk) { return fk.name === f.name; });
}) || pkField;
// Numeric key iff phptype int/float and not an enum column.
var keyIsString = !(keyField.phptype === 'int' || keyField.phptype === 'float') || keyField.type === 'ENUM';
var keyDartType = keyIsString ? 'String' : 'int';

// Combobox label: prefer a GENERATED string column (e.g. `count_display`),
// else the first plain (non-key, non-generated) string column, else fall
// back to the key itself so lookupOptions() always has a usable label.
var labelField =
  fields.find(function (f) { return f.is_generated && f.phptype === 'string'; }) ||
  fields.find(function (f) { return !f.isprimary && f.name !== keyField.name && !f.is_generated && f.phptype === 'string' && f.type !== 'TEXT'; }) ||
  keyField;

var selectable = fields.filter(function (f) { return true; });
var selectCols = selectable.map(function (f) { return f.name; });

var insertable = fields.filter(function (f) { return !f.isprimary && !f.is_generated; });

var stringSearchFields = fields.filter(function (f) {
  return !f.isprimary && !f.is_generated && !f.isblob && f.type !== 'ENUM' &&
    (f.phptype === 'string') && f.type !== 'TEXT' && f.type !== 'DATE' && f.type !== 'DATETIME' && f.type !== 'TIMESTAMP';
});
if (stringSearchFields.length === 0) {
  stringSearchFields = fields.filter(function (f) {
    return !f.isprimary && !f.is_generated && f.phptype === 'string';
  });
}

function chunk(cols) {
  var lines = [];
  for (var i = 0; i < cols.length; i += 6) {
    lines.push('    ' + cols.slice(i, i + 6).join(', '));
  }
  return lines.join(',\n');
}

var whereClause = stringSearchFields.length === 0 ? '' :
  "'''WHERE " + stringSearchFields.map(function (f) { return f.name + ' LIKE :q'; }).join('\n                OR ') + "'''";

var out = '';
out += '  ' + entity + 'Repository(this._db);\n\n';
out += '  final Database _db;\n\n';
out += "  static const _table = '" + table.filename + "';\n";
out += "  static const _pk = '" + keyField.name + "';\n\n";
out += '  /// All columns needed to hydrate a [' + entity + '] (incl. generated ones).\n';
out += '  static const _selectCols = \'\'\'\n' + chunk(selectCols) + '\n  \'\'\';\n\n';

out += '  /// Loads a page of rows, optionally filtered by a free-text [search].\n';
out += '  Future<List<' + entity + '>> fetchAll({\n';
out += '    String search = \'\',\n';
out += '    int limit = 200,\n';
out += '    int offset = 0,\n';
out += '  }) async {\n';
out += '    final where = search.trim().isEmpty\n        ? \'\'\n        : ' + (whereClause || "''") + ';\n\n';
out += '    final result = await _db.execute(\n';
out += "      '''\n";
out += '      SELECT $_selectCols FROM $_table\n';
out += '      $where\n';
out += '      ORDER BY $_pk\n';
out += "      LIMIT ${limit.clamp(1, 5000)} OFFSET ${offset.clamp(0, 1 << 31)}\n";
out += "      ''',\n";
out += "      search.trim().isEmpty ? null : {'q': '%${search.trim()}%'},\n";
out += '    );\n\n';
out += '    return result.rows.map(' + entity + '.fromRow).toList();\n';
out += '  }\n\n';

out += '  Future<int> count({String search = \'\'}) async {\n';
out += '    final where = search.trim().isEmpty\n        ? \'\'\n        : ' + (whereClause || "''") + ';\n';
out += '    final result = await _db.execute(\n';
out += "      'SELECT COUNT(*) AS c FROM \$_table \$where',\n";
out += "      search.trim().isEmpty ? null : {'q': '%${search.trim()}%'},\n";
out += '    );\n';
out += "    return int.tryParse(result.rows.first.assoc()['c'] ?? '0') ?? 0;\n";
out += '  }\n\n';

out += '  Future<' + entity + '?> getByKey(' + keyDartType + ' key) async {\n';
out += '    final result = await _db.execute(\n';
out += "      'SELECT \$_selectCols FROM \$_table WHERE \$_pk = :k',\n";
out += "      {'k': key},\n";
out += '    );\n';
out += '    if (result.rows.isEmpty) return null;\n';
out += '    return ' + entity + '.fromRow(result.rows.first);\n';
out += '  }\n\n';

// When the table has no real business key, keyField falls back to the
// surrogate (auto-increment) PK — which is `int?` and unknown before INSERT.
// Use the driver's last-insert-id instead of the (still-null) row value.
var keyIsFallbackPk = keyField.name === pkField.name;
var keyAccessor = 'row.' + keyField.camelcase + (keyIsFallbackPk ? '!' : '');

out += '  /// Inserts a new row and returns it re-read from the DB (generated columns).\n';
out += '  Future<' + entity + '> insert(' + entity + ' row) async {\n';
out += '    final params = row.toParams();\n';
out += "    final cols = params.keys.join(', ');\n";
out += "    final binds = params.keys.map((k) => ':\$k').join(', ');\n";
if (keyIsFallbackPk) {
  out += "    final result = await _db.execute('INSERT INTO \$_table (\$cols) VALUES (\$binds)', params);\n";
  out += '    return (await getByKey(result.lastInsertID.toInt()))!;\n';
} else {
  out += "    await _db.execute('INSERT INTO \$_table (\$cols) VALUES (\$binds)', params);\n";
  out += '    return (await getByKey(' + keyAccessor + '))!;\n';
}
out += '  }\n\n';

out += '  Future<' + entity + '> update(' + entity + ' row) async {\n';
out += '    final params = row.toParams();\n';
out += "    final assignments = params.keys.map((k) => '\$k = :\$k').join(', ');\n";
out += '    await _db.execute(\n';
out += "      'UPDATE \$_table SET \$assignments WHERE \$_pk = :_key',\n";
out += "      {...params, '_key': " + keyAccessor + "},\n";
out += '    );\n';
out += '    return (await getByKey(' + keyAccessor + '))!;\n';
out += '  }\n\n';

out += '  Future<void> deleteByKey(' + keyDartType + ' key) async {\n';
out += "    await _db.execute('DELETE FROM \$_table WHERE \$_pk = :k', {'k': key});\n";
out += '  }\n';

if (!keyIsString) {
  out += '\n  /// Next free business key — the template\'s simple sequence helper.\n';
  out += '  Future<int> nextKey() async {\n';
  out += "    final result = await _db.execute(\n";
  out += "      'SELECT COALESCE(MAX(\$_pk), 0) + 1 AS n FROM \$_table',\n";
  out += '    );\n';
  out += "    return int.tryParse(result.rows.first.assoc()['n'] ?? '1') ?? 1;\n";
  out += '  }\n';
}

out += '\n  /// FK combobox source for any table with a foreign key into `' + table.filename + '`.\n';
out += '  Future<List<LookupOption<' + keyDartType + '>>> lookupOptions() async {\n';
out += "    final result = await _db.execute('SELECT \$_selectCols FROM \$_table ORDER BY \$_pk');\n";
out += '    return result.rows.map((r) {\n';
out += '      final row = ' + entity + '.fromRow(r);\n';
var labelExpr = labelField.name === keyField.name
  ? keyAccessor + '.toString()'
  : labelField.notnull
    ? 'row.' + labelField.camelcase + '.toString()'
    : 'row.' + labelField.camelcase + ' ?? ' + keyAccessor + '.toString()';
out += '      return LookupOption<' + keyDartType + '>(' + keyAccessor + ', ' + labelExpr + ');\n';
out += '    }).toList();\n';
out += '  }\n';

sContentResult += out;
return sContentResult;
{:codeend:}
}
