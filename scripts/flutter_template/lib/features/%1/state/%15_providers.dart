import 'package:flutter_riverpod/flutter_riverpod.dart';
// Riverpod 3: StateProvider moved out of the main barrel export into this
// dedicated entry point (still fully supported, just no longer the
// recommended default for new code).
import 'package:flutter_riverpod/legacy.dart';

import '../../../core/db/database.dart';
import '../../../core/ui/lookup_field.dart';
import '../data/{:filesingularlower:}_repository.dart';
import '../model/{:filesingularlower:}.dart';

/// SCORIET: one providers file per entity. Names follow `<entity>...Provider`.
{:code:}
var table = gtree[0].project[0].tables[gtree[0].project[0].tableindex];
var fields = table.fields;
var entity = table.filesingularpascalcase;
var entityLower = table.filesingularcamelcase;

var pkField = fields.find(function (f) { return f.isprimary; });
var foreignkeys = table.foreignkeys || [];
// Business key: an incoming FK from another table (see %15_repository.dart
// for the full rationale) wins over the generic single-column-UNIQUE guess —
// every FK combobox elsewhere in the app was generated against that exact
// column, and this table's own provider types must agree with it.
var allTables = gtree[0].project[0].tables;
var incomingKeyFieldName = null;
for (var ti = 0; ti < allTables.length && !incomingKeyFieldName; ti++) {
  var otherFks = allTables[ti].foreignkeys || [];
  for (var fi = 0; fi < otherFks.length; fi++) {
    if (otherFks[fi].referencedtable === table.filename) {
      incomingKeyFieldName = otherFks[fi].referencedcolumn;
      break;
    }
  }
}
var keys = table.keys || [];
var uniqueConstraintSize = {};
keys.forEach(function (k) {
  if (!k.isunique || k.isprimary) return;
  uniqueConstraintSize[k.constraintname] = (uniqueConstraintSize[k.constraintname] || 0) + 1;
});
var singleColumnUniqueNames = keys.filter(function (k) {
  return k.isunique && !k.isprimary && uniqueConstraintSize[k.constraintname] === 1;
}).map(function (k) { return k.name; });
var keyField =
  (incomingKeyFieldName && fields.find(function (f) { return f.name === incomingKeyFieldName; })) ||
  fields.find(function (f) {
    return singleColumnUniqueNames.indexOf(f.name) !== -1 && !foreignkeys.some(function (fk) { return fk.name === f.name; });
  }) || pkField;
var keyIsString = !(keyField.phptype === 'int' || keyField.phptype === 'float') || keyField.type === 'ENUM';
var keyDartType = keyIsString ? 'String' : 'int';

var out = '';
out += 'final ' + entityLower + 'RepositoryProvider = Provider<' + entity + 'Repository>((ref) {\n';
out += '  return ' + entity + 'Repository(ref.watch(databaseProvider));\n';
out += '});\n\n';

out += "final " + entityLower + "SearchProvider = StateProvider<String>((ref) => '');\n\n";

out += 'final ' + entityLower + 'ListProvider =\n';
out += '    FutureProvider.autoDispose<List<' + entity + '>>((ref) async {\n';
out += '  final repo = ref.watch(' + entityLower + 'RepositoryProvider);\n';
out += '  final search = ref.watch(' + entityLower + 'SearchProvider);\n';
out += '  return repo.fetchAll(search: search);\n';
out += '});\n\n';

out += 'final ' + entityLower + 'ByKeyProvider =\n';
out += '    FutureProvider.autoDispose.family<' + entity + '?, ' + keyDartType + '>((ref, key) async {\n';
out += '  return ref.watch(' + entityLower + 'RepositoryProvider).getByKey(key);\n';
out += '});\n\n';

out += '/// Combobox options for any FK that references `' + table.filename + '`.\n';
out += '/// SCORIET: one `<entity>LookupProvider` per lookup table.\n';
out += 'final ' + entityLower + 'LookupProvider =\n';
out += '    FutureProvider<List<LookupOption<' + keyDartType + '>>>((ref) async {\n';
out += '  return ref.watch(' + entityLower + 'RepositoryProvider).lookupOptions();\n';
out += '});\n\n';

out += 'final ' + entityLower + 'ControllerProvider = Provider<' + entity + 'Controller>((ref) {\n';
out += '  return ' + entity + 'Controller(ref);\n';
out += '});\n\n';

out += 'class ' + entity + 'Controller {\n';
out += '  ' + entity + 'Controller(this._ref);\n\n';
out += '  final Ref _ref;\n\n';
out += '  ' + entity + 'Repository get _repo => _ref.read(' + entityLower + 'RepositoryProvider);\n\n';

if (!keyIsString) {
  out += '  Future<int> nextKey() => _repo.nextKey();\n\n';
}

var keyAccessorSaved = 'saved.' + keyField.camelcase + (keyField.name === pkField.name ? '!' : '');
out += '  Future<' + entity + '> save(' + entity + ' row) async {\n';
out += '    final saved = row.isNew ? await _repo.insert(row) : await _repo.update(row);\n';
out += '    _invalidate(' + keyAccessorSaved + ');\n';
out += '    return saved;\n';
out += '  }\n\n';

out += '  Future<void> delete(' + keyDartType + ' key) async {\n';
out += '    await _repo.deleteByKey(key);\n';
out += '    _invalidate(key);\n';
out += '  }\n\n';

out += '  void _invalidate(' + keyDartType + ' key) {\n';
out += '    _ref.invalidate(' + entityLower + 'ListProvider);\n';
out += '    _ref.invalidate(' + entityLower + 'ByKeyProvider(key));\n';
out += '    _ref.invalidate(' + entityLower + 'LookupProvider); // refresh comboboxes\n';
out += '  }\n';
out += '}\n';

sContentResult += out;
return sContentResult;
{:codeend:}
