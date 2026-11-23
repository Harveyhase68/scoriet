/// SCORIET: generated from Scoriet's Schema Translation system — every
/// project language's table/field caption, keyed by `'<table>'` (table
/// caption) or `'<table>.<field>'` (field caption). See `locale_provider.dart`
/// for the runtime lookup (`tc()`) and fallback chain.
{:code:}
function dartString(s) {
  return JSON.stringify(s === null || s === undefined ? '' : String(s));
}

var project = gtree[0].project[0];
var tablesgen = project.tablesgen || [];
var allTables = project.tables || [];

var entries = [];
for (var ti = 0; ti < tablesgen.length; ti++) {
  var table = allTables[tablesgen[ti]];
  var tableLangs = table.lang || [];
  var tableMap = tableLangs.map(function (l) {
    return dartString(l.code) + ': ' + dartString(l.caption);
  }).join(', ');
  entries.push('  ' + dartString(table.filename) + ': {' + tableMap + '}');

  var fields = table.fields || [];
  for (var fi = 0; fi < fields.length; fi++) {
    var field = fields[fi];
    var fieldLangs = field.lang || [];
    var fieldMap = fieldLangs.map(function (l) {
      return dartString(l.code) + ': ' + dartString(l.caption);
    }).join(', ');
    entries.push('  ' + dartString(table.filename + '.' + field.name) + ': {' + fieldMap + '}');
  }
}

var out = 'const Map<String, Map<String, String>> kSchemaCaptions = {\n';
out += entries.join(',\n');
out += '\n};\n';

sContentResult = out;
return sContentResult;
{:codeend:}
