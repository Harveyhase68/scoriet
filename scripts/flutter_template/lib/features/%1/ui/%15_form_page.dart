import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/locale_provider.dart';

{:code:}
var table = gtree[0].project[0].tables[gtree[0].project[0].tableindex];
var fkUnique = table.foreignkeysunique || [];
var hasDateField = table.fields.some(function (f) {
  return f.type === 'DATE' || f.type === 'DATETIME' || f.type === 'TIMESTAMP';
});
var layoutRowsForImport = table.layoutsingles || [];
var buttonRowsForImport = layoutRowsForImport.filter(function (r) { return r.control_type === 'button'; });
var hasFieldProfilForImport = layoutRowsForImport.some(function (r) {
  return r.control_type !== 'button' && r.id > 0;
});
var tierForImport = !table.formedit ? 'a' : (hasFieldProfilForImport ? 'c' : 'b');
var hasPrintButtonForImport = tierForImport !== 'a' && buttonRowsForImport.some(function (b) {
  return b.button_type === 'button_print' || (b.action || '').toLowerCase() === 'print';
});
// Only import intl/LookupField/anchor_layout/report_page when this table's
// fields/buttons actually need them — otherwise it's an unused-import lint
// warning in every generated form that doesn't.
var out = hasDateField ? "import 'package:intl/intl.dart';\n" : '';
out += fkUnique.length > 0 ? "import '../../../core/ui/lookup_field.dart';\n" : '';
out += tierForImport === 'c' ? "import '../../../core/ui/anchor_layout.dart';\n" : '';
for (var i = 0; i < fkUnique.length; i++) {
  var fk = fkUnique[i];
  out += "import '../../" + fk.referencedtable + "/state/" + fk.referencedtablesingularlower + "_providers.dart';\n";
  out += "import '../../" + fk.referencedtable + "/ui/" + fk.referencedtablesingularlower + "_form_page.dart';\n";
}
out += hasPrintButtonForImport ? "import '" + table.filesingularlower + "_report_page.dart';\n" : '';
sContentResult += out;
return sContentResult;
{:codeend:}
import '../model/{:filesingularlower:}.dart';
import '../state/{:filesingularlower:}_providers.dart';

/// Detail / edit form for a single `{:filename:}` record — the SCORIET form
/// template.
///
/// Rendering follows what's actually configured in Scoriet's Form Layout
/// Designer, in three tiers:
///  - no FormSet at all              -> simple flow layout, built-in Save button.
///  - FormSet, no saved field Profil -> simple flow layout, but the REAL
///    configured button set (Save/Cancel/Print/nav/custom) + the designed
///    window width.
///  - a saved field Profil exists    -> fields AND buttons positioned exactly
///    as designed (`AnchorCanvas`), anchors included.
class {:filesingularpascalcase:}FormPage extends ConsumerStatefulWidget {
{:code:}
var table = gtree[0].project[0].tables[gtree[0].project[0].tableindex];
var fields = table.fields;
var pkField = fields.find(function (f) { return f.isprimary; });
var foreignkeys0 = table.foreignkeys || [];
// Business key: an incoming FK from another table wins over the generic
// single-column-UNIQUE guess (see %15_repository.dart for the full
// rationale) — this recordKey type must agree with every FK combobox
// elsewhere in the app that was generated against this exact column.
var allTables0 = gtree[0].project[0].tables;
var incomingKeyFieldName0 = null;
for (var ti0 = 0; ti0 < allTables0.length && !incomingKeyFieldName0; ti0++) {
  var otherFks0 = allTables0[ti0].foreignkeys || [];
  for (var fi0 = 0; fi0 < otherFks0.length; fi0++) {
    if (otherFks0[fi0].referencedtable === table.filename) {
      incomingKeyFieldName0 = otherFks0[fi0].referencedcolumn;
      break;
    }
  }
}
var keys0 = table.keys || [];
var uniqueConstraintSize0 = {};
keys0.forEach(function (k) {
  if (!k.isunique || k.isprimary) return;
  uniqueConstraintSize0[k.constraintname] = (uniqueConstraintSize0[k.constraintname] || 0) + 1;
});
var singleColumnUniqueNames0 = keys0.filter(function (k) {
  return k.isunique && !k.isprimary && uniqueConstraintSize0[k.constraintname] === 1;
}).map(function (k) { return k.name; });
var keyField =
  (incomingKeyFieldName0 && fields.find(function (f) { return f.name === incomingKeyFieldName0; })) ||
  fields.find(function (f) {
    return singleColumnUniqueNames0.indexOf(f.name) !== -1 && !foreignkeys0.some(function (fk) { return fk.name === f.name; });
  }) || pkField;
var keyIsString = !(keyField.phptype === 'int' || keyField.phptype === 'float') || keyField.type === 'ENUM';
var keyDartType = keyIsString ? 'String' : 'int';
var out = '';
out += '  const ' + table.filesingularpascalcase + 'FormPage({super.key, this.recordKey});\n\n';
out += '  /// `null` -> create a new record.\n';
out += '  final ' + keyDartType + '? recordKey;\n\n';
out += '  @override\n';
out += '  ConsumerState<' + table.filesingularpascalcase + 'FormPage> createState() => _' + table.filesingularpascalcase + 'FormPageState();\n';
sContentResult += out;
return sContentResult;
{:codeend:}
}

class _{:filesingularpascalcase:}FormPageState extends ConsumerState<{:filesingularpascalcase:}FormPage> {
  final _formKey = GlobalKey<FormState>();
{:code:}
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
  if (cleaned.length === 0 || /^[0-9]/.test(cleaned)) cleaned = fallbackPrefix + cleaned;
  return cleaned;
}

var table = gtree[0].project[0].tables[gtree[0].project[0].tableindex];
var fields = table.fields;
var entity = table.filesingularpascalcase;
var entityLower = table.filesingularcamelcase;
var foreignkeys = table.foreignkeys || [];

var pkField = fields.find(function (f) { return f.isprimary; });
// Business key: an incoming FK from another table wins (see %15_repository.dart).
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
var hasOwnNextKey = !keyIsString && keyField.name !== pkField.name;

function fkFor(f) {
  for (var i = 0; i < foreignkeys.length; i++) {
    if (foreignkeys[i].name === f.name) return foreignkeys[i];
  }
  return null;
}

function dartString(s) { return JSON.stringify(s === null || s === undefined ? '' : String(s)); }
// A Profil-customized caption (renamed in the Form Layout Designer, tier c
// only — tier b's auto-fallback placements never carry a real override)
// takes priority over Schema Translation; falls back to it otherwise, so the
// other, non-renamed fields on the same table keep using Schema Translation
// as normal.
function captionKeyExpr(f) {
  var schemaExpr = "tc(ref, " + dartString(table.filename + '.' + f.name) + ")";
  if (tier !== 'c') return schemaExpr;
  var p = placementByFieldName[f.name];
  if (!p) return schemaExpr;
  var labels = p.caption_labels || {};
  var langKeys = Object.keys(labels);
  if (langKeys.length > 0) {
    var mapLit = langKeys.map(function (k) { return dartString(k) + ': ' + dartString(labels[k]); }).join(', ');
    return '({' + mapLit + '}[ref.watch(activeLanguageProvider)] ?? ' + schemaExpr + ')';
  }
  if (p.caption_override) {
    return dartString(p.caption_override);
  }
  return schemaExpr;
}

// ── Form Layout Designer data (buttons + tier detection) ──
var layoutRows = table.layoutsingles || [];
var fieldPlacementRows = layoutRows.filter(function (r) { return r.control_type !== 'button'; });
var buttonRows = layoutRows.filter(function (r) { return r.control_type === 'button'; });
var hasFieldProfil = fieldPlacementRows.some(function (r) { return r.id > 0; });
var tier = !table.formedit ? 'a' : (hasFieldProfil ? 'c' : 'b');
var placementByFieldName = {};
fieldPlacementRows.forEach(function (r) { if (r.field_name) placementByFieldName[r.field_name] = r; });
var containerDesignWidth = (table.formedit && table.formedit.container && table.formedit.container.width)
  || (table.formedit && table.formedit.tab_container && table.formedit.tab_container.width)
  || 820;

// Editable fields: everything except the surrogate PK and generated columns.
var editable = fields.filter(function (f) {
  return !f.isprimary && !f.is_generated;
});

// TINYINT is only a boolean under the MySQL TINYINT(1) convention; any other
// width (e.g. bare `TINYINT UNSIGNED`) is a genuine small integer and must be
// treated like every other numeric column.
function isBoolField(f) { return f.type === 'TINYINT' && Number(f.size) === 1; }
var plainFields = editable.filter(function (f) { return f.type !== 'ENUM' && !isBoolField(f) && !(f.type === 'DATE' || f.type === 'DATETIME' || f.type === 'TIMESTAMP') && !fkFor(f); });
var enumFields = editable.filter(function (f) { return f.type === 'ENUM'; });
var boolFields = editable.filter(function (f) { return isBoolField(f); });
var dateFields = editable.filter(function (f) { return f.type === 'DATE' || f.type === 'DATETIME' || f.type === 'TIMESTAMP'; });
var fkFields = editable.filter(function (f) { return !!fkFor(f); });
// GENERATED (non-PK) columns: never user-edited, but if NOT NULL the model
// constructor still requires a value. Source it from the loaded record; for
// a brand-new record (no _model yet) the DB computes the real value on
// INSERT anyway (toParams() excludes generated columns), so any same-typed
// placeholder is fine here — it's discarded before the row is ever sent.
var generatedFields = fields.filter(function (f) { return !f.isprimary && f.is_generated; });
function generatedPlaceholder(f) {
  if (f.type === 'ENUM') return entity + (f.pascalcasenoprefix || f.pascalcase) + '.values.first';
  if (isBoolField(f)) return 'false';
  if (f.type === 'DATE' || f.type === 'DATETIME' || f.type === 'TIMESTAMP') return 'null';
  if (f.phptype === 'int') return '0';
  if (f.phptype === 'float') return '0';
  return "''";
}

// ── Per-field-type widget expressions (shared by every tier — only the
// WRAPPING differs: a flat Wrap child for tiers a/b, an AnchoredPlacement for
// tier c) ──
function plainFieldWidgetExpr(f) {
  var isLong = f.type === 'TEXT';
  var width = isLong ? 820 : (f.phptype === 'int' || f.phptype === 'float' ? 180 : 300);
  return '_field(_' + f.camelcase + ', ' + captionKeyExpr(f) +
    (f.notnull ? ', required: true' : '') +
    ', width: ' + width +
    (isLong ? ', maxLines: 4' : '') +
    ((f.phptype === 'int') ? ', keyboardType: TextInputType.number, inputFormatters: [FilteringTextInputFormatter.digitsOnly]' : '') +
    ((f.phptype === 'float') ? ', keyboardType: const TextInputType.numberWithOptions(decimal: true)' : '') +
    ')';
}
function enumFieldWidgetExpr(f) {
  var enumName = entity + (f.pascalcasenoprefix || f.pascalcase);
  return 'SizedBox(width: 220, child: DropdownButtonFormField<' + enumName + '>(' +
    'initialValue: _' + f.camelcase + ', ' +
    'decoration: InputDecoration(labelText: ' + captionKeyExpr(f) + '), ' +
    'items: [for (final v in ' + enumName + '.values) DropdownMenuItem(value: v, child: Text(v.label))], ' +
    'onChanged: (v) => setState(() => _' + f.camelcase + ' = v ?? _' + f.camelcase + '),' +
    '))';
}
function fkFieldWidgetExpr(f) {
  var fk = fkFor(f);
  var fkKeyIsString = f.type !== 'ENUM' && (f.phptype !== 'int' && f.phptype !== 'float');
  var fkDartType = fkKeyIsString ? 'String' : 'int';
  return 'LookupField<' + fkDartType + '>(' +
    'label: ' + captionKeyExpr(f) + ', ' +
    'width: 300, ' +
    'value: _' + f.camelcase + ', ' +
    'loading: ' + fk.referencedtablesingularcamelcase + 'Lookup.isLoading, ' +
    // Riverpod 3: AsyncValue.value is nullable and safe by default now
    // (returns null instead of throwing) — this is what `.valueOrNull` used
    // to be for in Riverpod 2.
    'options: ' + fk.referencedtablesingularcamelcase + 'Lookup.value ?? const [], ' +
    'onChanged: (v) => setState(() => _' + f.camelcase + ' = v), ' +
    'onAdd: () => _add' + fk.referencedtablesingularpascalcase + '(),' +
    ')';
}
function dateFieldWidgetExpr(f) {
  return '_dateField(' + captionKeyExpr(f) + ', _' + f.camelcase + ', (d) => setState(() => _' + f.camelcase + ' = d))';
}
function boolFieldWidgetExpr(f) {
  return 'SizedBox(width: 260, child: SwitchListTile(' +
    'contentPadding: EdgeInsets.zero, ' +
    'title: Text(' + captionKeyExpr(f) + '), ' +
    'value: _' + f.camelcase + ', ' +
    'onChanged: (v) => setState(() => _' + f.camelcase + ' = v),' +
    '))';
}

// ── Buttons: shared between tier b (simple row) and tier c (positioned) ──
function buttonLabelExpr(btn) {
  var fallbackKey =
    (btn.button_type === 'button_save') ? "s(ref, 'save')" :
    (btn.button_type === 'button_cancel') ? "s(ref, 'cancel')" :
    (btn.button_type === 'button_close') ? "s(ref, 'close')" :
    (btn.button_type === 'button_delete') ? "s(ref, 'delete')" :
    (btn.button_type === 'button_print') ? "s(ref, 'report_print')" :
    (btn.button_type === 'button_new') ? "s(ref, 'new')" :
    dartString(btn.label || 'Button');
  var fallback = btn.label ? dartString(btn.label) : fallbackKey;
  var labels = btn.button_labels || {};
  var langKeys = Object.keys(labels);
  if (langKeys.length === 0) return fallback;
  var mapLit = langKeys.map(function (k) { return dartString(k) + ': ' + dartString(labels[k]); }).join(', ');
  return '({' + mapLit + '}[ref.watch(activeLanguageProvider)] ?? ' + fallback + ')';
}
function buttonIconExpr(btn) {
  var map = {
    'button_save': 'Icons.save', 'button_cancel': 'Icons.close', 'button_close': 'Icons.close',
    'button_delete': 'Icons.delete_outline', 'button_print': 'Icons.print_outlined', 'button_new': 'Icons.add',
    'button_nav_first': 'Icons.first_page', 'button_nav_prev': 'Icons.chevron_left',
    'button_nav_next': 'Icons.chevron_right', 'button_nav_last': 'Icons.last_page',
  };
  return map[btn.button_type] || 'Icons.smart_button';
}
function buttonHandlerExpr(btn) {
  var action = (btn.action || '').toLowerCase();
  var type = btn.button_type || '';
  if (action === 'save' || type === 'button_save') return '_saving ? null : _save';
  if (action === 'cancel' || action === 'close' || type === 'button_cancel' || type === 'button_close') return '() => Navigator.of(context).pop()';
  if (action === 'delete' || type === 'button_delete') return '_isNew ? null : _deleteRecord';
  if (action === 'print' || type === 'button_print') return '_openReport';
  if (action === 'new' || type === 'button_new') return '_newRecord';
  if (type === 'button_nav_first') return '() => _navigate(first: true)';
  if (type === 'button_nav_prev') return '() => _navigate(delta: -1)';
  if (type === 'button_nav_next') return '() => _navigate(delta: 1)';
  if (type === 'button_nav_last') return '() => _navigate(last: true)';
  // button_custom / unrecognized: gives the user a clear, labeled spot to
  // wire up their own behavior instead of silently doing nothing.
  return "() { /* TODO: implement action " + dartString(action || type) + " */ }";
}
function buttonColorExpr(btn) {
  function hexToColor(hex) {
    if (!hex) return null;
    var clean = String(hex).replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(function (c) { return c + c; }).join('');
    return 'Color(0xFF' + clean.toUpperCase() + ')';
  }
  return { bg: hexToColor(btn.background_color), fg: hexToColor(btn.text_color) };
}
function navTooltipKey(type) {
  if (type === 'button_nav_first') return 'nav_first';
  if (type === 'button_nav_prev') return 'nav_prev';
  if (type === 'button_nav_next') return 'nav_next';
  if (type === 'button_nav_last') return 'nav_last';
  return null;
}
function buttonWidgetExpr(btn) {
  var colors = buttonColorExpr(btn);
  var navKey = navTooltipKey(btn.button_type);
  if (navKey) {
    // Record-navigation buttons are small square icon buttons in the
    // Designer (no text label) — an icon-only IconButton with a tooltip
    // matches that shape far better than a full-width FilledButton.icon.
    // Explicitly shrunk (Material's default IconButton wants ~48x48 of tap
    // target, which is what overflowed a narrow button rail/bar with 4 of
    // them side by side) — a fixed 32x32 footprint is closer to the
    // Designer's own 40x40 design size and leaves no slack to overflow.
    var tooltipExpr = "s(ref, '" + navKey + "')";
    return 'IconButton(' +
      'tooltip: ' + tooltipExpr + ', ' +
      'onPressed: ' + buttonHandlerExpr(btn) + ', ' +
      'iconSize: 18, ' +
      'style: IconButton.styleFrom(minimumSize: const Size(32, 32), padding: EdgeInsets.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap), ' +
      'icon: Icon(' + buttonIconExpr(btn) + (colors.fg ? (', color: ' + colors.fg) : '') + '),' +
      ')';
  }
  var styleParts = [];
  // A small rounded rectangle (not Material 3's default pill/stadium shape)
  // matches how the Designer's own Live Preview draws these buttons
  // (FormLivePreviewModal.tsx: `borderRadius: 4`) — there is no per-button
  // shape setting in the Designer to read here, this is just the one fixed
  // look it already renders everywhere else.
  styleParts.push('shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4))');
  if (colors.bg) styleParts.push('backgroundColor: ' + colors.bg);
  if (colors.fg) styleParts.push('foregroundColor: ' + colors.fg);
  var style = 'style: FilledButton.styleFrom(' + styleParts.join(', ') + '), ';
  return 'FilledButton.icon(' +
    'onPressed: ' + buttonHandlerExpr(btn) + ', ' +
    style +
    'icon: const Icon(' + buttonIconExpr(btn) + '), ' +
    'label: Text(' + buttonLabelExpr(btn) + '),' +
    ')';
}

var out = '';
if (dateFields.length > 0) {
  out += "  static final _dateFmt = DateFormat('yyyy-MM-dd');\n\n";
}

for (var i = 0; i < plainFields.length; i++) {
  out += '  final _' + plainFields[i].camelcase + ' = TextEditingController();\n';
}
out += '\n';
for (var i = 0; i < enumFields.length; i++) {
  var f = enumFields[i];
  var enumName = entity + (f.pascalcasenoprefix || f.pascalcase);
  out += '  ' + enumName + ' _' + f.camelcase + ' = ' + enumName + '.values.first;\n';
}
for (var i = 0; i < boolFields.length; i++) {
  out += '  bool _' + boolFields[i].camelcase + ' = false;\n';
}
for (var i = 0; i < dateFields.length; i++) {
  out += '  DateTime? _' + dateFields[i].camelcase + ';\n';
}
for (var i = 0; i < fkFields.length; i++) {
  var f = fkFields[i];
  var fk = fkFor(f);
  var fkKeyIsString = f.type !== 'ENUM' && (f.phptype !== 'int' && f.phptype !== 'float');
  out += '  ' + (fkKeyIsString ? 'String' : 'int') + '? _' + f.camelcase + '; // FK -> ' + fk.referencedtable + '.' + fk.referencedcolumn + '\n';
}

out += '\n  ' + entity + '? _model;\n';
out += '  bool _loaded = false;\n';
out += '  bool _saving = false;\n\n';
out += '  bool get _isNew => widget.recordKey == null;\n\n';

out += '  @override\n';
out += '  void initState() {\n';
out += '    super.initState();\n';
out += '    if (_isNew) {\n';
out += '      _loaded = true;\n';
if (hasOwnNextKey) {
  out += '      ref.read(' + entityLower + 'ControllerProvider).nextKey().then((n) {\n';
  out += '        if (mounted && _' + keyField.camelcase + '.text.isEmpty) _' + keyField.camelcase + '.text = \'$n\';\n';
  out += '      });\n';
}
out += '    }\n';
out += '  }\n\n';

out += '  void _populate(' + entity + ' m) {\n';
out += '    _model = m;\n';
for (var i = 0; i < plainFields.length; i++) {
  var f = plainFields[i];
  out += '    _' + f.camelcase + '.text = m.' + f.camelcase + (f.notnull ? '.toString()' : "?.toString() ?? ''") + ';\n';
}
for (var i = 0; i < enumFields.length; i++) {
  out += '    _' + enumFields[i].camelcase + ' = m.' + enumFields[i].camelcase + ';\n';
}
for (var i = 0; i < boolFields.length; i++) {
  out += '    _' + boolFields[i].camelcase + ' = m.' + boolFields[i].camelcase + ';\n';
}
for (var i = 0; i < dateFields.length; i++) {
  out += '    _' + dateFields[i].camelcase + ' = m.' + dateFields[i].camelcase + ';\n';
}
for (var i = 0; i < fkFields.length; i++) {
  out += '    _' + fkFields[i].camelcase + ' = m.' + fkFields[i].camelcase + ';\n';
}
out += '    _loaded = true;\n';
out += '  }\n\n';

out += '  @override\n';
out += '  void dispose() {\n';
if (plainFields.length > 0) {
  out += '    for (final c in [\n';
  for (var i = 0; i < plainFields.length; i++) {
    out += '      _' + plainFields[i].camelcase + ',\n';
  }
  out += '    ]) {\n      c.dispose();\n    }\n';
}
out += '    super.dispose();\n';
out += '  }\n\n';

out += '  @override\n';
out += '  Widget build(BuildContext context) {\n';
out += '    if (!_isNew && !_loaded) {\n';
out += '      final async = ref.watch(' + entityLower + 'ByKeyProvider(widget.recordKey!));\n';
out += '      return async.when(\n';
out += '        loading: () => _scaffold(const Center(child: CircularProgressIndicator())),\n';
out += '        error: (e, _) => _scaffold(Center(child: Text("${s(ref, \'error_prefix\')}$e"))),\n';
out += "        data: (m) {\n";
out += "          if (m == null) return _scaffold(Center(child: Text(s(ref, 'not_found'))));\n";
out += '          _populate(m);\n';
out += '          return _form();\n';
out += '        },\n';
out += '      );\n';
out += '    }\n';
out += '    return _form();\n';
out += '  }\n\n';

out += "  Widget _scaffold(Widget body) => Scaffold(\n        appBar: AppBar(title: Text(_isNew ? s(ref, 'new') : tc(ref, " + dartString(table.filename) + "))),\n        body: body,\n      );\n\n";

out += '  Widget _form() {\n';
for (var i = 0; i < fkFields.length; i++) {
  var f = fkFields[i];
  var fk = fkFor(f);
  out += '    final ' + fk.referencedtablesingularcamelcase + 'Lookup = ref.watch(' + fk.referencedtablesingularcamelcase + 'LookupProvider);\n';
}

// ── Button placement: follow the Designer's own geometry instead of a fixed
// spot. A button group that shares the container's vertical range but sits
// outside it horizontally -> a side rail (left/right, matching e.g. a
// nav+Save/Cancel/Print column placed beside the fields). A group above/below
// the container's vertical range -> a bar above/below the fields. Anything
// else (or tier a, which has no Designer button set at all) -> the AppBar,
// exactly as before.
var navButtonTypes = ['button_nav_first', 'button_nav_prev', 'button_nav_next', 'button_nav_last'];
var navButtonRows = buttonRows.filter(function (b) { return navButtonTypes.indexOf(b.button_type) !== -1; });
var otherButtonRows = buttonRows.filter(function (b) { return navButtonTypes.indexOf(b.button_type) === -1; });
var hasSaveButtonConfigured = buttonRows.some(function (b) {
  return b.button_type === 'button_save' || (b.action || '').toLowerCase() === 'save';
});

var buttonPosition = 'top';
if (tier !== 'a' && buttonRows.length > 0) {
  var containerBox = (table.formedit && table.formedit.container) || (table.formedit && table.formedit.tab_container);
  if (containerBox) {
    var bMinX = Math.min.apply(null, buttonRows.map(function (b) { return b.x; }));
    var bMaxX = Math.max.apply(null, buttonRows.map(function (b) { return b.x + b.width; }));
    var bMinY = Math.min.apply(null, buttonRows.map(function (b) { return b.y; }));
    var bMaxY = Math.max.apply(null, buttonRows.map(function (b) { return b.y + b.height; }));
    var overlapX = Math.min(bMaxX, containerBox.x + containerBox.width) - Math.max(bMinX, containerBox.x);
    var overlapY = Math.min(bMaxY, containerBox.y + containerBox.height) - Math.max(bMinY, containerBox.y);
    var hRatio = (bMaxX - bMinX) > 0 ? Math.max(0, overlapX) / (bMaxX - bMinX) : 0;
    var vRatio = (bMaxY - bMinY) > 0 ? Math.max(0, overlapY) / (bMaxY - bMinY) : 0;
    // Whichever axis the button group DOESN'T share with the container is
    // the axis it was placed along (beside it, or above/below it).
    if (vRatio > hRatio) {
      buttonPosition = (bMinX >= containerBox.x + containerBox.width / 2) ? 'right' : 'left';
    } else {
      buttonPosition = (bMinY >= containerBox.y + containerBox.height / 2) ? 'bottom' : 'top';
    }
  }
}

function saveFallbackExpr(stretch) {
  var btn = "FilledButton.icon(onPressed: _saving ? null : _save, icon: const Icon(Icons.save), label: Text(s(ref, 'save')))";
  return stretch ? ('Padding(padding: const EdgeInsets.only(bottom: 8), child: ' + btn + ')') : btn;
}

// AppBar `actions:` list — used for tier a's hardcoded button and for tier
// b/c when the Designer itself put the buttons at the top.
function buttonBarActionsExpr() {
  var s = '';
  for (var i = 0; i < buttonRows.length; i++) {
    s += '          Padding(padding: const EdgeInsets.only(right: 8), child: ' + buttonWidgetExpr(buttonRows[i]) + '),\n';
  }
  if (!hasSaveButtonConfigured) {
    s += '          Padding(padding: const EdgeInsets.only(right: 8), child: ' + saveFallbackExpr(false) + '),\n';
  }
  s += '          const SizedBox(width: 4),\n';
  return s;
}

// Right/left side rail: nav buttons (if any) as a compact centered row on
// top, everything else stacked full-width below — mirrors the Designer's own
// "nav row + stacked action buttons" column shape.
function buttonSidebarExpr() {
  var s = 'Container(\n              width: 168,\n              padding: const EdgeInsets.fromLTRB(12, 20, 20, 20),\n              child: Column(\n                crossAxisAlignment: CrossAxisAlignment.stretch,\n                children: [\n';
  if (navButtonRows.length > 0) {
    // Wrap (not Row): a Row of 4 IconButtons has no way to shrink below its
    // children's combined width, so it overflows the moment the rail is
    // narrower than that (or a 5th nav-type button is ever added) — Wrap
    // reflows onto a second line instead of throwing a RenderFlex overflow.
    s += '                  Wrap(\n                    alignment: WrapAlignment.center,\n                    spacing: 2,\n                    runSpacing: 2,\n                    children: [\n';
    for (var i = 0; i < navButtonRows.length; i++) {
      s += '                      ' + buttonWidgetExpr(navButtonRows[i]) + ',\n';
    }
    s += '                    ],\n                  ),\n';
    if (otherButtonRows.length > 0) s += '                  const SizedBox(height: 16),\n';
  }
  for (var i = 0; i < otherButtonRows.length; i++) {
    s += '                  Padding(padding: const EdgeInsets.only(bottom: 8), child: ' + buttonWidgetExpr(otherButtonRows[i]) + '),\n';
  }
  if (!hasSaveButtonConfigured) s += '                  ' + saveFallbackExpr(true) + ',\n';
  s += '                ],\n              ),\n            )';
  return s;
}

// Bottom bar: a right-aligned Wrap, same shape a Save/Cancel dialog footer
// would use.
function buttonBottomBarExpr() {
  var s = 'Padding(\n              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),\n              child: Wrap(\n                spacing: 8,\n                runSpacing: 8,\n                alignment: WrapAlignment.end,\n                children: [\n';
  for (var i = 0; i < navButtonRows.length; i++) s += '                  ' + buttonWidgetExpr(navButtonRows[i]) + ',\n';
  for (var i = 0; i < otherButtonRows.length; i++) s += '                  ' + buttonWidgetExpr(otherButtonRows[i]) + ',\n';
  if (!hasSaveButtonConfigured) s += '                  ' + saveFallbackExpr(false) + ',\n';
  s += '                ],\n              ),\n            )';
  return s;
}

out += '    return Scaffold(\n';
if (tier === 'a') {
  // No FormSet at all: the original single built-in Save button.
  out += "      appBar: AppBar(\n        title: Text(_isNew ? s(ref, 'new') : tc(ref, " + dartString(table.filename) + ")),\n";
  out += '        actions: [\n          Padding(\n            padding: const EdgeInsets.only(right: 12),\n            child: FilledButton.icon(\n              onPressed: _saving ? null : _save,\n              icon: _saving\n                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))\n                  : const Icon(Icons.save),\n';
  out += "              label: Text(s(ref, 'save')),\n            ),\n          ),\n        ],\n      ),\n";
} else if (buttonPosition === 'top') {
  out += "      appBar: AppBar(\n        title: Text(_isNew ? s(ref, 'new') : tc(ref, " + dartString(table.filename) + ")),\n";
  out += '        actions: [\n' + buttonBarActionsExpr() + '        ],\n      ),\n';
} else {
  out += "      appBar: AppBar(title: Text(_isNew ? s(ref, 'new') : tc(ref, " + dartString(table.filename) + "))),\n";
}

// Fields content — identical across every button placement, only the
// surrounding layout (AppBar / side rail / bottom bar) differs.
var fieldsExpr = 'ListView(\n          padding: const EdgeInsets.all(20),\n          children: [\n';
if (tier === 'c') {
  fieldsExpr += '            AnchorCanvas(\n              designWidth: ' + containerDesignWidth + ',\n              children: [\n';
  function emitPositioned(f, widgetExpr) {
    var p = placementByFieldName[f.name];
    if (p) {
      fieldsExpr += '                AnchoredPlacement(\n' +
        '                  x: ' + p.x + ', y: ' + p.y + ', width: ' + p.width + ', height: ' + p.height + ',\n' +
        (p.anchor_right !== null && p.anchor_right !== undefined ? '                  anchorRight: ' + p.anchor_right + ',\n' : '') +
        (p.anchor_bottom !== null && p.anchor_bottom !== undefined ? '                  anchorBottom: ' + p.anchor_bottom + ',\n' : '') +
        (p.anchor_width !== null && p.anchor_width !== undefined ? '                  anchorWidth: ' + p.anchor_width + ',\n' : '') +
        (p.anchor_height !== null && p.anchor_height !== undefined ? '                  anchorHeight: ' + p.anchor_height + ',\n' : '') +
        '                  builder: (context) => ' + widgetExpr + ',\n' +
        '                ),\n';
    } else {
      // No saved placement for this specific field (added to the schema after
      // the Profil was designed) — fall back to a safe, always-visible spot
      // rather than silently dropping the field.
      fieldsExpr += '                AnchoredPlacement(x: 0, y: 0, width: 300, height: 40, builder: (context) => ' + widgetExpr + '),\n';
    }
  }
  for (var i = 0; i < plainFields.length; i++) emitPositioned(plainFields[i], plainFieldWidgetExpr(plainFields[i]));
  for (var i = 0; i < enumFields.length; i++) emitPositioned(enumFields[i], enumFieldWidgetExpr(enumFields[i]));
  for (var i = 0; i < fkFields.length; i++) emitPositioned(fkFields[i], fkFieldWidgetExpr(fkFields[i]));
  for (var i = 0; i < dateFields.length; i++) emitPositioned(dateFields[i], dateFieldWidgetExpr(dateFields[i]));
  for (var i = 0; i < boolFields.length; i++) emitPositioned(boolFields[i], boolFieldWidgetExpr(boolFields[i]));
  fieldsExpr += '              ],\n            ),\n';
} else {
  fieldsExpr += '            ConstrainedBox(\n              constraints: const BoxConstraints(maxWidth: ' + containerDesignWidth + '),\n              child: Wrap(\n                spacing: 14,\n                runSpacing: 14,\n                children: [\n';
  for (var i = 0; i < plainFields.length; i++) fieldsExpr += '                  ' + plainFieldWidgetExpr(plainFields[i]) + ',\n';
  for (var i = 0; i < enumFields.length; i++) fieldsExpr += '                  ' + enumFieldWidgetExpr(enumFields[i]) + ',\n';
  for (var i = 0; i < fkFields.length; i++) fieldsExpr += '                  ' + fkFieldWidgetExpr(fkFields[i]) + ',\n';
  for (var i = 0; i < dateFields.length; i++) fieldsExpr += '                  ' + dateFieldWidgetExpr(dateFields[i]) + ',\n';
  for (var i = 0; i < boolFields.length; i++) fieldsExpr += '                  ' + boolFieldWidgetExpr(boolFields[i]) + ',\n';
  fieldsExpr += '                ],\n              ),\n            ),\n';
}
fieldsExpr += '          ],\n        )';

if (tier === 'a' || buttonPosition === 'top') {
  out += '      body: Form(\n        key: _formKey,\n        child: ' + fieldsExpr + ',\n      ),\n    );\n  }\n\n';
} else if (buttonPosition === 'bottom') {
  out += '      body: Form(\n        key: _formKey,\n        child: Column(\n          children: [\n            Expanded(child: ' + fieldsExpr + '),\n            ' + buttonBottomBarExpr() + ',\n          ],\n        ),\n      ),\n    );\n  }\n\n';
} else {
  var sidebarExpr = buttonSidebarExpr();
  var rowChildren = buttonPosition === 'left'
    ? sidebarExpr + ',\n            Expanded(child: ' + fieldsExpr + '),\n'
    : 'Expanded(child: ' + fieldsExpr + '),\n            ' + sidebarExpr + ',\n';
  out += '      body: Form(\n        key: _formKey,\n        child: Row(\n          crossAxisAlignment: CrossAxisAlignment.start,\n          children: [\n            ' + rowChildren + '          ],\n        ),\n      ),\n    );\n  }\n\n';
}

// FK "+ add" flow: pushes the referenced table's own generated form page and
// re-selects the returned key, mirroring address_form_page.dart's _addCountry().
for (var i = 0; i < fkFields.length; i++) {
  var f = fkFields[i];
  var fk = fkFor(f);
  var fkKeyIsString = f.type !== 'ENUM' && (f.phptype !== 'int' && f.phptype !== 'float');
  var fkDartType = fkKeyIsString ? 'String' : 'int';
  out += '  Future<void> _add' + fk.referencedtablesingularpascalcase + '() async {\n';
  out += '    final newKey = await Navigator.of(context).push<' + fkDartType + '>(\n';
  out += '      MaterialPageRoute(builder: (_) => const ' + fk.referencedtablesingularpascalcase + 'FormPage()),\n';
  out += '    );\n';
  out += '    if (newKey == null) return;\n';
  out += '    ref.invalidate(' + fk.referencedtablesingularcamelcase + 'LookupProvider);\n';
  out += '    if (mounted) setState(() => _' + f.camelcase + ' = newKey);\n';
  out += '  }\n\n';
}

out += '  Widget _field(\n    TextEditingController c,\n    String label, {\n    bool required = false,\n    double width = 300,\n    int maxLines = 1,\n    TextInputType? keyboardType,\n    List<TextInputFormatter>? inputFormatters,\n  }) {\n';
out += '    final field = TextFormField(\n      controller: c,\n      maxLines: maxLines,\n      keyboardType: keyboardType,\n      inputFormatters: inputFormatters,\n';
out += "      validator: required ? (v) => (v == null || v.trim().isEmpty) ? s(ref, 'required_field') : null : null,\n";
out += '      decoration: InputDecoration(labelText: label),\n    );\n';
out += '    return maxLines > 1 ? field : SizedBox(width: width, child: field);\n  }\n\n';

if (dateFields.length > 0) {
  out += '  Widget _dateField(String label, DateTime? value, ValueChanged<DateTime?> set) {\n';
  out += '    return SizedBox(\n      width: 200,\n      child: InputDecorator(\n        decoration: InputDecoration(\n          labelText: label,\n';
  out += '          suffixIcon: value == null\n              ? const Icon(Icons.calendar_today, size: 18)\n              : IconButton(icon: const Icon(Icons.clear, size: 18), onPressed: () => set(null)),\n        ),\n';
  out += '        child: InkWell(\n          onTap: () async {\n            final picked = await showDatePicker(\n              context: context,\n              initialDate: value ?? DateTime.now(),\n              firstDate: DateTime(1900),\n              lastDate: DateTime(2100),\n            );\n            if (picked != null) set(picked);\n          },\n';
  out += "          child: Text(value == null ? '—' : _dateFmt.format(value)),\n        ),\n      ),\n    );\n  }\n\n";
}

out += '  Future<void> _save() async {\n';
out += '    if (!_formKey.currentState!.validate()) return;\n';
out += '    setState(() => _saving = true);\n\n';
out += '    final draft = ' + entity + '(\n';
out += '      ' + pkField.camelcase + ': _model?.' + pkField.camelcase + ',\n';
for (var i = 0; i < generatedFields.length; i++) {
  var f = generatedFields[i];
  out += '      ' + f.camelcase + ': _model?.' + f.camelcase + ' ?? ' + generatedPlaceholder(f) + ',\n';
}
for (var i = 0; i < plainFields.length; i++) {
  var f = plainFields[i];
  if (f.phptype === 'int') {
    out += '      ' + f.camelcase + ': ' + (f.notnull ? 'int.parse(_' + f.camelcase + '.text)' : 'int.tryParse(_' + f.camelcase + '.text)') + ',\n';
  } else if (f.phptype === 'float') {
    out += '      ' + f.camelcase + ': ' + (f.notnull ? "(double.tryParse(_" + f.camelcase + ".text.replaceAll(',', '.')) ?? 0)" : "double.tryParse(_" + f.camelcase + ".text.replaceAll(',', '.'))") + ',\n';
  } else {
    out += '      ' + f.camelcase + ': ' + (f.notnull ? '_' + f.camelcase + '.text.trim()' : "_" + f.camelcase + ".text.trim().isEmpty ? null : _" + f.camelcase + '.text.trim()') + ',\n';
  }
}
for (var i = 0; i < enumFields.length; i++) {
  out += '      ' + enumFields[i].camelcase + ': _' + enumFields[i].camelcase + ',\n';
}
for (var i = 0; i < boolFields.length; i++) {
  out += '      ' + boolFields[i].camelcase + ': _' + boolFields[i].camelcase + ',\n';
}
for (var i = 0; i < dateFields.length; i++) {
  out += '      ' + dateFields[i].camelcase + ': _' + dateFields[i].camelcase + ',\n';
}
for (var i = 0; i < fkFields.length; i++) {
  var f = fkFields[i];
  // FK selection state is always nullable (Dropdown starts unset); force-unwrap
  // for NOT NULL FK columns since the model field itself is non-nullable there
  // (form validation is responsible for ensuring the user actually picked one).
  out += '      ' + f.camelcase + ': _' + f.camelcase + (f.notnull ? '!' : '') + ',\n';
}
out += '    );\n\n';
out += '    try {\n';
out += '      final saved = await ref.read(' + entityLower + 'ControllerProvider).save(draft);\n';
out += '      if (mounted) {\n';
out += "        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s(ref, 'saved'))));\n";
out += '        Navigator.of(context).pop(saved.' + keyField.camelcase + ');\n';
out += '      }\n';
out += '    } catch (e) {\n';
out += '      if (mounted) {\n';
out += '        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("${s(ref, \'error_prefix\')}$e")));\n';
out += '      }\n';
out += '    } finally {\n';
out += '      if (mounted) setState(() => _saving = false);\n';
out += '    }\n';
out += '  }\n';

// Buttons beyond Save only get generated when a FormSet actually configured
// them (tiers b/c) — avoids unused-method lint noise on tier-a tables.
if (tier !== 'a') {
  var hasDelete = buttonRows.some(function (b) { return b.button_type === 'button_delete' || (b.action || '').toLowerCase() === 'delete'; });
  var hasPrint = buttonRows.some(function (b) { return b.button_type === 'button_print' || (b.action || '').toLowerCase() === 'print'; });
  var hasNew = buttonRows.some(function (b) { return b.button_type === 'button_new' || (b.action || '').toLowerCase() === 'new'; });
  var hasNav = buttonRows.some(function (b) { return (b.button_type || '').indexOf('button_nav_') === 0; });

  if (hasDelete) {
    out += '\n  Future<void> _deleteRecord() async {\n';
    out += '    if (widget.recordKey == null) return;\n';
    out += '    try {\n';
    out += '      await ref.read(' + entityLower + 'ControllerProvider).delete(widget.recordKey!);\n';
    out += '      if (mounted) Navigator.of(context).pop();\n';
    out += '    } catch (e) {\n';
    out += '      if (mounted) {\n';
    out += '        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("${s(ref, \'error_prefix\')}$e")));\n';
    out += '      }\n';
    out += '    }\n';
    out += '  }\n';
  }
  if (hasPrint) {
    out += '\n  void _openReport() {\n';
    out += '    Navigator.of(context).push(\n';
    out += '      MaterialPageRoute(builder: (_) => const ' + entity + 'ReportPage()),\n';
    out += '    );\n';
    out += '  }\n';
    // report_page.dart isn't otherwise imported by the form page — add it only
    // when a print button actually needs it.
    out = out.replace("import '../model/{:filesingularlower:}.dart';\nimport '../state/{:filesingularlower:}_providers.dart';",
      "import '../model/{:filesingularlower:}.dart';\nimport '../state/{:filesingularlower:}_providers.dart';\nimport '{:filesingularlower:}_report_page.dart';");
  }
  if (hasNew) {
    out += '\n  void _newRecord() {\n';
    out += '    Navigator.of(context).pushReplacement(\n';
    out += '      MaterialPageRoute(builder: (_) => const ' + entity + 'FormPage()),\n';
    out += '    );\n';
    out += '  }\n';
  }
  if (hasNav) {
    out += '\n  // Record navigation (first/prev/next/last) walks the same cached list\n';
    out += '  // the list page already loads — no dedicated provider needed.\n';
    out += '  void _navigate({int? delta, bool first = false, bool last = false}) {\n';
    out += '    if (widget.recordKey == null) return;\n';
    out += '    final rows = ref.read(' + entityLower + 'ListProvider).value;\n';
    out += '    if (rows == null || rows.isEmpty) return;\n';
    out += '    final idx = rows.indexWhere((r) => r.' + keyField.camelcase + ' == widget.recordKey);\n';
    out += '    if (idx == -1) return;\n';
    out += '    int newIdx;\n';
    out += '    if (first) {\n';
    out += '      newIdx = 0;\n';
    out += '    } else if (last) {\n';
    out += '      newIdx = rows.length - 1;\n';
    out += '    } else {\n';
    out += '      newIdx = (idx + (delta ?? 0)).clamp(0, rows.length - 1);\n';
    out += '    }\n';
    out += '    if (newIdx == idx) return;\n';
    out += '    Navigator.of(context).pushReplacement(\n';
    out += '      MaterialPageRoute(builder: (_) => ' + entity + 'FormPage(recordKey: rows[newIdx].' + keyField.camelcase + ')),\n';
    out += '    );\n';
    out += '  }\n';
  }
}

sContentResult += out;
return sContentResult;
{:codeend:}
}
