import 'package:data_table_2/data_table_2.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/locale_provider.dart';
import '../model/{:filesingularlower:}.dart';
import '../state/{:filesingularlower:}_providers.dart';
import '{:filesingularlower:}_form_page.dart';
import '{:filesingularlower:}_report_page.dart';

/// Master list for `{:filename:}` — the SCORIET grid template.
///
/// Rendering follows what's actually configured in Scoriet's Form Layout
/// Designer for the `data_table` window, in the same three tiers as the
/// create/edit form:
///  - no FormSet at all                -> schema-default columns, built-in
///    refresh/print/new toolbar (unchanged from before this feature).
///  - FormSet, no saved column Profil   -> schema-default column order, but
///    the REAL configured button set (New/Delete/Close/nav/custom), placed
///    wherever the Designer put them (top/bottom/left/right of the grid).
///  - a saved column Profil exists      -> column order/width/caption exactly
///    as designed for this table.
class {:filesingularpascalcase:}ListPage extends ConsumerWidget {
  const {:filesingularpascalcase:}ListPage({super.key});

{:code:}
var table = gtree[0].project[0].tables[gtree[0].project[0].tableindex];
var fields = table.fields;
var entity = table.filesingularpascalcase;
var entityLower = table.filesingularcamelcase;

var pkField = fields.find(function (f) { return f.isprimary; });
var foreignkeys = table.foreignkeys || [];
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
var keyIsString = !(keyField.phptype === 'int' || keyField.phptype === 'float') || keyField.type === 'ENUM';
var keyDartType = keyIsString ? 'String' : 'int';

function dartString(s) { return JSON.stringify(s === null || s === undefined ? '' : String(s)); }

// ── Form Layout Designer data (columns + buttons + tier detection) ──
var columnRows = (table.layoutcolumns || []).slice().sort(function (a, b) { return (a.z_order || 0) - (b.z_order || 0); });
var buttonRows = table.layoutcolumnbuttons || [];
var hasColumnProfil = columnRows.some(function (r) { return r.id > 0; });
var tier = !table.formtable ? 'a' : (hasColumnProfil ? 'c' : 'b');

var fieldsByName = {};
fields.forEach(function (f) { fieldsByName[f.name] = f; });
var colByFieldName = {};
if (tier !== 'a') columnRows.forEach(function (c) { if (c.field_name) colByFieldName[c.field_name] = c; });

// A Profil-customized column caption takes priority over Schema Translation
// (tier c only — tier b's auto-fallback columns never carry a real
// override), exactly mirroring the create/edit form's captionKeyExpr().
function columnCaptionExpr(f) {
  var schemaExpr = "tc(ref, " + dartString(table.filename + '.' + f.name) + ")";
  if (tier !== 'c') return schemaExpr;
  var col = colByFieldName[f.name];
  if (!col) return schemaExpr;
  var labels = col.caption_labels || {};
  var langKeys = Object.keys(labels);
  if (langKeys.length > 0) {
    var mapLit = langKeys.map(function (k) { return dartString(k) + ': ' + dartString(labels[k]); }).join(', ');
    return '({' + mapLit + '}[ref.watch(activeLanguageProvider)] ?? ' + schemaExpr + ')';
  }
  if (col.caption_override) return dartString(col.caption_override);
  return schemaExpr;
}
// Only a REAL saved column Profil (tier c) carries a width the user actually
// chose for a grid column. Tier b's auto-generated fallback row width is
// inherited from autoGenerateFormLayout()'s CREATE_EDIT-shaped logic (one
// field stacked per row -> width = the full container width, currently
// always 622 for this project's data_table window) — meaningless as a
// column width and, taken literally across N columns, guaranteed to overflow
// DataTable2's fixed-width budget. Tier a/b keep the original relative
// ColumnSize.S/M sizing instead.
function columnWidthExpr(f) {
  if (tier !== 'c') return null;
  var col = colByFieldName[f.name];
  return (col && col.width) ? col.width : null;
}

// Grid columns: schema default (tier a — everything except the surrogate PK
// and long text/blob columns), or the Designer's own column set (order/width
// from the Blueprint window, tier b/c) — falling back to the schema default
// if a column Profil ever ends up empty (e.g. all its fields were since
// removed from the schema).
var gridFields;
if (tier === 'a') {
  gridFields = fields.filter(function (f) { return !f.isprimary && !f.isblob && f.type !== 'TEXT'; });
  if (gridFields.length === 0) gridFields = [keyField];
} else {
  gridFields = columnRows.map(function (c) { return fieldsByName[c.field_name]; }).filter(function (f) { return !!f; });
  if (gridFields.length === 0) {
    gridFields = fields.filter(function (f) { return !f.isprimary && !f.isblob && f.type !== 'TEXT'; });
    if (gridFields.length === 0) gridFields = [keyField];
  }
}

function cellExpr(f) {
  var access = 'row.' + f.camelcase;
  if (f.type === 'ENUM') return access + '.label';
  if (f.type === 'TINYINT') return access + " ? s(ref, 'yes') : s(ref, 'no')";
  if (f.type === 'DATE' || f.type === 'DATETIME' || f.type === 'TIMESTAMP') {
    return access + "?.toIso8601String().split('T').first ?? '—'";
  }
  if (f.notnull) return access + '.toString()';
  return access + "?.toString() ?? '—'";
}

// ── Buttons: same geometry-based placement as the create/edit form — the
// data_table window uses the identical button vocabulary/coordinate system,
// so a button group beside the grid's container renders as a side rail,
// above/below it as a top (AppBar) or bottom bar. ──
var navButtonTypes = ['button_nav_first', 'button_nav_prev', 'button_nav_next', 'button_nav_last'];
var navButtonRows = buttonRows.filter(function (b) { return navButtonTypes.indexOf(b.button_type) !== -1; });
var otherButtonRows = buttonRows.filter(function (b) { return navButtonTypes.indexOf(b.button_type) === -1; });
var hasNewButtonConfigured = buttonRows.some(function (b) { return b.button_type === 'button_new' || (b.action || '').toLowerCase() === 'new'; });
var hasPrintButtonConfigured = buttonRows.some(function (b) { return b.button_type === 'button_print' || (b.action || '').toLowerCase() === 'print'; });

function buttonLabelExpr(btn) {
  var fallbackKey =
    (btn.button_type === 'button_new') ? "s(ref, 'new')" :
    (btn.button_type === 'button_delete') ? "s(ref, 'delete')" :
    (btn.button_type === 'button_close') ? "s(ref, 'close')" :
    (btn.button_type === 'button_print') ? "s(ref, 'report_print')" :
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
    'button_new': 'Icons.add', 'button_delete': 'Icons.delete_outline', 'button_close': 'Icons.close',
    'button_print': 'Icons.print_outlined',
    'button_nav_first': 'Icons.first_page', 'button_nav_prev': 'Icons.chevron_left',
    'button_nav_next': 'Icons.chevron_right', 'button_nav_last': 'Icons.last_page',
  };
  return map[btn.button_type] || 'Icons.smart_button';
}
function navTooltipKey(type) {
  if (type === 'button_nav_first') return 'nav_first';
  if (type === 'button_nav_prev') return 'nav_prev';
  if (type === 'button_nav_next') return 'nav_next';
  if (type === 'button_nav_last') return 'nav_last';
  return null;
}
function buttonHandlerExpr(btn) {
  var action = (btn.action || '').toLowerCase();
  var type = btn.button_type || '';
  if (action === 'new' || type === 'button_new') return '() => _openForm(context, ref, null)';
  if (action === 'print' || type === 'button_print') return '() => _openReport(context)';
  if (action === 'close' || action === 'cancel' || type === 'button_close' || type === 'button_cancel') return '() => Navigator.of(context).pop()';
  // delete / nav_* / custom / anything else: no natural page-level meaning on
  // a plain list view (no row-selection or pagination model here) — render
  // faithfully at the Designer's position/caption, wire to a clearly marked
  // TODO instead of fabricating behavior.
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
function buttonWidgetExpr(btn) {
  var colors = buttonColorExpr(btn);
  var navKey = navTooltipKey(btn.button_type);
  if (navKey) {
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

var buttonPosition = 'top';
if (tier !== 'a' && buttonRows.length > 0) {
  var containerBox = (table.formtable && table.formtable.container) || (table.formtable && table.formtable.tab_container);
  if (containerBox) {
    var bMinX = Math.min.apply(null, buttonRows.map(function (b) { return b.x; }));
    var bMaxX = Math.max.apply(null, buttonRows.map(function (b) { return b.x + b.width; }));
    var bMinY = Math.min.apply(null, buttonRows.map(function (b) { return b.y; }));
    var bMaxY = Math.max.apply(null, buttonRows.map(function (b) { return b.y + b.height; }));
    var overlapX = Math.min(bMaxX, containerBox.x + containerBox.width) - Math.max(bMinX, containerBox.x);
    var overlapY = Math.min(bMaxY, containerBox.y + containerBox.height) - Math.max(bMinY, containerBox.y);
    var hRatio = (bMaxX - bMinX) > 0 ? Math.max(0, overlapX) / (bMaxX - bMinX) : 0;
    var vRatio = (bMaxY - bMinY) > 0 ? Math.max(0, overlapY) / (bMaxY - bMinY) : 0;
    if (vRatio > hRatio) {
      buttonPosition = (bMinX >= containerBox.x + containerBox.width / 2) ? 'right' : 'left';
    } else {
      buttonPosition = (bMinY >= containerBox.y + containerBox.height / 2) ? 'bottom' : 'top';
    }
  }
}

function newFallbackExpr(stretch) {
  var btn = "FilledButton.icon(onPressed: () => _openForm(context, ref, null), icon: const Icon(Icons.add), label: Text(s(ref, 'new')))";
  return stretch ? ('Padding(padding: const EdgeInsets.only(bottom: 8), child: ' + btn + ')') : btn;
}

function appBarDesignerActionsExpr() {
  var s = '';
  for (var i = 0; i < buttonRows.length; i++) {
    s += '          Padding(padding: const EdgeInsets.only(right: 8), child: ' + buttonWidgetExpr(buttonRows[i]) + '),\n';
  }
  if (!hasNewButtonConfigured) {
    s += '          Padding(padding: const EdgeInsets.only(right: 8), child: ' + newFallbackExpr(false) + '),\n';
  }
  return s;
}
function buttonSidebarExpr() {
  var s = 'Container(\n              width: 168,\n              padding: const EdgeInsets.fromLTRB(12, 20, 20, 20),\n              child: Column(\n                crossAxisAlignment: CrossAxisAlignment.stretch,\n                children: [\n';
  if (navButtonRows.length > 0) {
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
  if (!hasNewButtonConfigured) s += '                  ' + newFallbackExpr(true) + ',\n';
  s += '                ],\n              ),\n            )';
  return s;
}
function buttonBottomBarExpr() {
  var s = 'Padding(\n              padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),\n              child: Wrap(\n                spacing: 8,\n                runSpacing: 8,\n                alignment: WrapAlignment.end,\n                children: [\n';
  for (var i = 0; i < navButtonRows.length; i++) s += '                  ' + buttonWidgetExpr(navButtonRows[i]) + ',\n';
  for (var i = 0; i < otherButtonRows.length; i++) s += '                  ' + buttonWidgetExpr(otherButtonRows[i]) + ',\n';
  if (!hasNewButtonConfigured) s += '                  ' + newFallbackExpr(false) + ',\n';
  s += '                ],\n              ),\n            )';
  return s;
}

var out = '';
out += '  @override\n';
out += '  Widget build(BuildContext context, WidgetRef ref) {\n';
out += '    final async = ref.watch(' + entityLower + 'ListProvider);\n\n';
out += '    return Scaffold(\n';
out += '      appBar: AppBar(\n';
out += "        title: Text(tc(ref, " + dartString(table.filename) + ")),\n";
out += '        actions: [\n';
out += "          IconButton(\n            tooltip: s(ref, 'refresh'),\n            icon: const Icon(Icons.refresh),\n            onPressed: () => ref.invalidate(" + entityLower + "ListProvider),\n          ),\n";

if (tier === 'a') {
  // No FormSet at all: the original built-in print/new toolbar, unchanged.
  out += "          IconButton(\n            tooltip: s(ref, 'report_print'),\n            icon: const Icon(Icons.print_outlined),\n            onPressed: () => _openReport(context),\n          ),\n";
  out += "          const SizedBox(width: 8),\n";
  out += "          FilledButton.icon(\n            onPressed: () => _openForm(context, ref, null),\n            icon: const Icon(Icons.add),\n            label: Text(s(ref, 'new')),\n          ),\n";
  out += "          const SizedBox(width: 12),\n";
} else if (buttonPosition === 'top') {
  if (!hasPrintButtonConfigured) {
    out += "          IconButton(\n            tooltip: s(ref, 'report_print'),\n            icon: const Icon(Icons.print_outlined),\n            onPressed: () => _openReport(context),\n          ),\n          const SizedBox(width: 8),\n";
  }
  out += appBarDesignerActionsExpr();
  out += '          const SizedBox(width: 4),\n';
} else {
  // Buttons live in a side rail or bottom bar instead — Print (if the
  // Designer didn't configure its own) stays reachable in the AppBar.
  if (!hasPrintButtonConfigured) {
    out += "          IconButton(\n            tooltip: s(ref, 'report_print'),\n            icon: const Icon(Icons.print_outlined),\n            onPressed: () => _openReport(context),\n          ),\n          const SizedBox(width: 8),\n";
  }
}
out += '        ],\n';
out += '      ),\n';

var mainColumnExpr = 'Column(\n            children: [\n              _SearchBar(),\n              const Divider(height: 1),\n              Expanded(\n                child: async.when(\n                  loading: () => const Center(child: CircularProgressIndicator()),\n                  error: (e, _) => _ErrorView(\n                    message: \'$e\',\n                    onRetry: () => ref.invalidate(' + entityLower + 'ListProvider),\n                  ),\n                  data: (rows) => rows.isEmpty\n                      ? Center(child: Text(s(ref, \'no_records\')))\n                      : _grid(context, ref, rows),\n                ),\n              ),\n            ],\n          )';

if (tier === 'a' || buttonPosition === 'top') {
  out += '      body: ' + mainColumnExpr.replace('Column(\n            children:', 'Column(\n        children:') + ',\n    );\n  }\n\n';
} else if (buttonPosition === 'bottom') {
  out += '      body: Column(\n        children: [\n';
  out += '          _SearchBar(),\n          const Divider(height: 1),\n';
  out += '          Expanded(\n            child: async.when(\n              loading: () => const Center(child: CircularProgressIndicator()),\n              error: (e, _) => _ErrorView(\n                message: \'$e\',\n                onRetry: () => ref.invalidate(' + entityLower + 'ListProvider),\n              ),\n              data: (rows) => rows.isEmpty\n                  ? Center(child: Text(s(ref, \'no_records\')))\n                  : _grid(context, ref, rows),\n            ),\n          ),\n';
  out += '          ' + buttonBottomBarExpr() + ',\n';
  out += '        ],\n      ),\n    );\n  }\n\n';
} else {
  var sidebarExpr = buttonSidebarExpr();
  var rowChildren = buttonPosition === 'left'
    ? sidebarExpr + ',\n            Expanded(child: ' + mainColumnExpr + '),\n'
    : 'Expanded(child: ' + mainColumnExpr + '),\n            ' + sidebarExpr + ',\n';
  out += '      body: Row(\n        crossAxisAlignment: CrossAxisAlignment.start,\n        children: [\n            ' + rowChildren + '        ],\n      ),\n    );\n  }\n\n';
}

// DataTable2's `minWidth` is its own "virtual full table width" — the point
// beyond which it scrolls horizontally instead of squeezing columns — so it
// must reflect whatever the columns actually add up to, or a genuinely wide
// tier-c column set (each width chosen deliberately in the Designer) can
// still exceed a guessed constant and hit the exact same
// "combined width of columns of fixed width is greater than available
// parent width" assertion. Tier a/b never set a fixedWidth (see
// columnWidthExpr above), so their relative S/M columns are unaffected by
// this and keep the original 900 floor.
var fixedColumnWidthSum = 0;
for (var i = 0; i < gridFields.length; i++) {
  var w = columnWidthExpr(gridFields[i]);
  if (w) fixedColumnWidthSum += w;
}
// +120: trailing per-row delete-icon column + horizontal margins/spacing.
var gridMinWidth = tier === 'c' ? Math.max(900, fixedColumnWidthSum + 120) : 900;

out += '  Widget _grid(BuildContext context, WidgetRef ref, List<' + entity + '> rows) {\n';
out += '    return Padding(\n';
out += '      padding: const EdgeInsets.all(12),\n';
out += '      child: DataTable2(\n';
out += '        columnSpacing: 12,\n';
out += '        horizontalMargin: 12,\n';
out += '        minWidth: ' + gridMinWidth + ',\n';
out += '        showCheckboxColumn: false,\n';
out += '        columns: [\n';
for (var i = 0; i < gridFields.length; i++) {
  var f = gridFields[i];
  var w = columnWidthExpr(f);
  var sizeOrWidth = w ? ('fixedWidth: ' + w + '.0') : ((i === 0) ? 'size: ColumnSize.S' : 'size: ColumnSize.M');
  out += '          DataColumn2(label: Text(' + columnCaptionExpr(f) + '), ' + sizeOrWidth + '),\n';
}
out += "          DataColumn2(label: Text(''), size: ColumnSize.S, numeric: true),\n";
out += '        ],\n';
out += '        rows: [\n';
out += '          for (final row in rows)\n';
out += '            DataRow2(\n';
out += '              onTap: () => _openForm(context, ref, row.' + keyField.camelcase + '),\n';
out += '              cells: [\n';
for (var i = 0; i < gridFields.length; i++) {
  out += '                DataCell(Text(' + cellExpr(gridFields[i]) + ')),\n';
}
out += '                DataCell(\n';
out += '                  IconButton(\n';
out += "                    tooltip: s(ref, 'delete'),\n";
out += '                    icon: const Icon(Icons.delete_outline, size: 20),\n';
out += '                    onPressed: () => _confirmDelete(context, ref, row),\n';
out += '                  ),\n';
out += '                ),\n';
out += '              ],\n';
out += '            ),\n';
out += '        ],\n';
out += '      ),\n';
out += '    );\n';
out += '  }\n\n';

out += '  void _openForm(BuildContext context, WidgetRef ref, ' + keyDartType + '? key) {\n';
out += '    Navigator.of(context).push(\n';
out += '      MaterialPageRoute(builder: (_) => ' + entity + 'FormPage(recordKey: key)),\n';
out += '    );\n';
out += '  }\n\n';

out += '  void _openReport(BuildContext context) {\n';
out += '    Navigator.of(context).push(\n';
out += '      MaterialPageRoute(builder: (_) => const ' + entity + 'ReportPage()),\n';
out += '    );\n';
out += '  }\n\n';

out += '  Future<void> _confirmDelete(\n      BuildContext context, WidgetRef ref, ' + entity + ' row) async {\n';
out += '    final ok = await showDialog<bool>(\n';
out += '      context: context,\n';
out += '      builder: (ctx) => AlertDialog(\n';
out += "        title: Text(s(ref, 'delete_confirm_title')),\n";
out += "        content: Text(s(ref, 'delete_confirm_content').replaceFirst('{key}', row." + keyField.camelcase + ".toString())),\n";
out += '        actions: [\n';
out += "          TextButton(\n            onPressed: () => Navigator.pop(ctx, false),\n            child: Text(s(ref, 'cancel')),\n          ),\n";
out += "          FilledButton(\n            onPressed: () => Navigator.pop(ctx, true),\n            child: Text(s(ref, 'delete')),\n          ),\n";
out += '        ],\n';
out += '      ),\n';
out += '    );\n';
out += '    if (ok != true) return;\n';
out += '    try {\n';
out += '      await ref.read(' + entityLower + 'ControllerProvider).delete(row.' + keyField.camelcase + (keyField.name === pkField.name ? '!' : '') + ');\n';
out += '    } catch (e) {\n';
out += '      if (context.mounted) {\n';
out += "        ScaffoldMessenger.of(context)\n            .showSnackBar(SnackBar(content: Text('\${s(ref, 'error_prefix')}\$e')));\n";
out += '      }\n';
out += '    }\n';
out += '  }\n';

sContentResult += out;
return sContentResult;
{:codeend:}
}

class _SearchBar extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: TextField(
        decoration: InputDecoration(
          prefixIcon: const Icon(Icons.search),
          hintText: s(ref, 'search_hint'),
        ),
        onChanged: (v) =>
            ref.read({:filesingularcamelcase:}SearchProvider.notifier).state = v,
      ),
    );
  }
}

class _ErrorView extends ConsumerWidget {
  const _ErrorView({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, size: 40, color: Colors.red),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(message, textAlign: TextAlign.center),
          ),
          FilledButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: Text(s(ref, 'retry')),
          ),
        ],
      ),
    );
  }
}
