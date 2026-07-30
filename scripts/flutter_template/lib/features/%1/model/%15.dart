import 'package:mysql_client/mysql_client.dart';

{:code:}
// Emits one Dart enum per ENUM/SET column on this table. Enum member names
// must be valid Dart identifiers, but MySQL enum values can contain spaces/
// punctuation (e.g. "billing & shipping"), so member names are sanitised
// here while `wire` keeps the exact original DB string.
function toIdentifier(raw, fallbackPrefix) {
  var cleaned = String(raw)
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(function (w) { return w.length > 0; })
    .map(function (w, idx) {
      var lower = w.toLowerCase();
      return idx === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
  if (cleaned.length === 0 || /^[0-9]/.test(cleaned)) {
    cleaned = fallbackPrefix + cleaned;
  }
  return cleaned;
}

var table = gtree[0].project[0].tables[gtree[0].project[0].tableindex];
var enumOut = '';
for (var i = 0; i < table.fields.length; i++) {
  var f = table.fields[i];
  if (f.type !== 'ENUM' && f.type !== 'SET') continue;
  var enumName = table.filesingularpascalcase + (f.pascalcasenoprefix || f.pascalcase);
  var values = f.enum_values || [];
  enumOut += '/// Enum mirroring the `' + f.name + '` column.\n';
  enumOut += 'enum ' + enumName + ' {\n';
  for (var v = 0; v < values.length; v++) {
    var member = toIdentifier(values[v], 'v');
    enumOut += '  ' + member + "('" + values[v] + "', '" + values[v] + "')" + (v < values.length - 1 ? ',' : ';') + '\n';
  }
  enumOut += '\n';
  enumOut += '  const ' + enumName + '(this.wire, this.label);\n\n';
  enumOut += '  final String wire;\n';
  enumOut += '  final String label;\n\n';
  enumOut += '  static ' + enumName + ' fromWire(String? value) {\n';
  enumOut += '    return ' + enumName + '.values.firstWhere(\n';
  enumOut += '      (e) => e.wire == value,\n';
  enumOut += '      orElse: () => ' + enumName + '.values.first,\n';
  enumOut += '    );\n';
  enumOut += '  }\n';
  enumOut += '}\n\n';
}
sContentResult += enumOut;
return sContentResult;
{:codeend:}
/// Immutable domain model for the `{:filename:}` table.
///
/// SCORIET: one model per table. Field <-> column mapping lives in [fromRow]
/// (read) and [toParams] (write). Generated columns are read-only (no param).
class {:filesingularpascalcase:} {
  const {:filesingularpascalcase:}({
{:for nmaxitems:}
{:if item.isprimary:}
    this.{:item.camelcase:},
{:elseif item.type eq "ENUM":}
    required this.{:item.camelcase:},
{:elseif item.type eq "TINYINT":}
    required this.{:item.camelcase:},
{:elseif item.notnull:}
    required this.{:item.camelcase:},
{:else:}
    this.{:item.camelcase:},
{:endif:}
{:endfor:}
  });

{:for nmaxitems:}
{:if item.type eq "ENUM":}
  final {:filesingularpascalcase:}{:item.pascalcasenoprefix:} {:item.camelcase:};
{:elseif item.isprimary:}
  final int? {:item.camelcase:};
{:elseif item.type eq "TINYINT":}
  final bool {:item.camelcase:};
{:elseif item.type eq "DATE" or item.type eq "DATETIME" or item.type eq "TIMESTAMP":}
  final DateTime? {:item.camelcase:};
{:elseif item.phptype eq "int":}
{:if item.notnull:}
  final int {:item.camelcase:};
{:else:}
  final int? {:item.camelcase:};
{:endif:}
{:elseif item.phptype eq "float":}
{:if item.notnull:}
  final double {:item.camelcase:};
{:else:}
  final double? {:item.camelcase:};
{:endif:}
{:else:}
{:if item.notnull:}
  final String {:item.camelcase:};
{:else:}
  final String? {:item.camelcase:};
{:endif:}
{:endif:}
{:endfor:}

  bool get isNew =>
{:for nmaxitems:}
{:if item.isprimary:}
      {:item.camelcase:} == null;
{:endif:}
{:endfor:}

  /// Builds a model from a MySQL result row (via its assoc map).
  factory {:filesingularpascalcase:}.fromRow(ResultSetRow row) {
    final m = row.assoc();
    return {:filesingularpascalcase:}(
{:for nmaxitems:}
{:if item.type eq "ENUM":}
      {:item.camelcase:}: {:filesingularpascalcase:}{:item.pascalcasenoprefix:}.fromWire(m['{:item.name:}']),
{:elseif item.isprimary:}
      {:item.camelcase:}: _int(m['{:item.name:}']),
{:elseif item.type eq "TINYINT":}
      {:item.camelcase:}: (m['{:item.name:}'] ?? '0') == '1',
{:elseif item.type eq "DATE" or item.type eq "DATETIME" or item.type eq "TIMESTAMP":}
      {:item.camelcase:}: _dt(m['{:item.name:}']),
{:elseif item.phptype eq "int":}
{:if item.notnull:}
      {:item.camelcase:}: _int(m['{:item.name:}']) ?? 0,
{:else:}
      {:item.camelcase:}: _int(m['{:item.name:}']),
{:endif:}
{:elseif item.phptype eq "float":}
{:if item.notnull:}
      {:item.camelcase:}: _double(m['{:item.name:}']) ?? 0,
{:else:}
      {:item.camelcase:}: _double(m['{:item.name:}']),
{:endif:}
{:else:}
{:if item.notnull:}
      {:item.camelcase:}: m['{:item.name:}'] ?? '',
{:else:}
      {:item.camelcase:}: m['{:item.name:}'],
{:endif:}
{:endif:}
{:endfor:}
    );
  }

  /// Named bind params for INSERT/UPDATE. Generated & auto columns excluded.
  Map<String, dynamic> toParams() => {
{:for nmaxitems:}
{:if item.isprimary:}
{:elseif item.is_generated:}
{:elseif item.type eq "ENUM":}
        '{:item.name:}': {:item.camelcase:}.wire,
{:elseif item.type eq "TINYINT":}
        '{:item.name:}': {:item.camelcase:} ? 1 : 0,
{:elseif item.type eq "DATE":}
        '{:item.name:}': _fmtDate({:item.camelcase:}),
{:else:}
        '{:item.name:}': {:item.camelcase:},
{:endif:}
{:endfor:}
      };

{:code:}
// Only emit the parsing helpers this table's fields actually use — an unused
// private static method is a lint warning in every single generated file
// otherwise (there's always at least one int column, the PK, so _int is
// unconditional; the others depend on which column types are present).
var table = gtree[0].project[0].tables[gtree[0].project[0].tableindex];
var fields = table.fields;
var hasFloat = fields.some(function (f) { return f.type !== 'ENUM' && f.type !== 'TINYINT' && !(f.type === 'DATE' || f.type === 'DATETIME' || f.type === 'TIMESTAMP') && f.phptype === 'float'; });
var hasDate = fields.some(function (f) { return f.type === 'DATE' || f.type === 'DATETIME' || f.type === 'TIMESTAMP'; });
var hasPlainDate = fields.some(function (f) { return f.type === 'DATE'; });

var out = '  static int? _int(String? v) => v == null ? null : int.tryParse(v);\n';
if (hasFloat) {
  out += '  static double? _double(String? v) => v == null ? null : double.tryParse(v);\n';
}
if (hasDate) {
  out += '  static DateTime? _dt(String? v) =>\n      (v == null || v.isEmpty) ? null : DateTime.tryParse(v);\n';
}
if (hasPlainDate) {
  out += "  static String? _fmtDate(DateTime? d) => d == null\n      ? null\n      : '${d.year.toString().padLeft(4, '0')}-'\n          '${d.month.toString().padLeft(2, '0')}-'\n          '${d.day.toString().padLeft(2, '0')}';\n";
}
out += '}\n';
sContentResult += out;
return sContentResult;
{:codeend:}
