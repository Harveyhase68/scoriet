import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:printing/printing.dart';

import '../../../core/i18n/locale_provider.dart';
import '../../../core/report/report_service.dart';
import '../model/{:filesingularlower:}.dart';
import '../state/{:filesingularlower:}_providers.dart';

/// Print / PDF report for `{:filename:}` — the SCORIET report template.
///
/// Per entity, only [_columns] and the title change; the preview + print
/// toolbar come from the shared [ReportService] / [PdfPreview].
class {:filesingularpascalcase:}ReportPage extends ConsumerWidget {
  const {:filesingularpascalcase:}ReportPage({super.key});

{:code:}
var table = gtree[0].project[0].tables[gtree[0].project[0].tableindex];
var fields = table.fields;
var entity = table.filesingularpascalcase;
var entityLower = table.filesingularcamelcase;

function dartString(s) { return JSON.stringify(s === null || s === undefined ? '' : String(s)); }
function captionKeyExpr(f) { return "tc(ref, " + dartString(table.filename + '.' + f.name) + ")"; }

// Column set + order follow the project's Report Pattern (report_visible /
// report_sort_order) — the same curation mechanism every other generated
// stack's report exposes via `{:if item.report_visible:}`. Without it, a
// report just dumps every non-blob/non-TEXT column into one fixed-width
// PDF table; a wide master table (e.g. `customers` with 40+ fields) squeezes
// each column so far that wrapped text overflows the row height and the pdf
// package throws TooManyPagesException — no page format is wide/tall enough
// to make an unbounded number of columns fit forever. Falls back to the
// unfiltered set only when the pattern hasn't been curated for this table
// (report_visible defaults to true for every field until someone opens the
// Report Pattern Designer and trims it).
var reportFields = fields.filter(function (f) {
  return !f.isprimary && !f.isblob && f.type !== 'TEXT' && f.report_visible;
});
if (reportFields.length === 0) reportFields = fields.filter(function (f) { return !f.isprimary; });
reportFields = reportFields.slice().sort(function (a, b) {
  var oa = a.report_sort_order, ob = b.report_sort_order;
  if (oa === null || oa === undefined) return ob === null || ob === undefined ? 0 : 1;
  if (ob === null || ob === undefined) return -1;
  return oa - ob;
});

function valueExpr(f) {
  var access = 'r.' + f.camelcase;
  if (f.type === 'ENUM') return access + '.label';
  if (f.type === 'TINYINT' && Number(f.size) === 1) return access + " ? s(ref, 'yes') : s(ref, 'no')";
  if (f.type === 'DATE' || f.type === 'DATETIME' || f.type === 'TIMESTAMP') {
    return access + "?.toIso8601String().split('T').first ?? ''";
  }
  if (f.notnull) return access + '.toString()';
  return access + " ?.toString() ?? ''";
}

var out = '';
out += '  static List<ReportColumn<' + entity + '>> _columns(WidgetRef ref) => [\n';
for (var i = 0; i < reportFields.length; i++) {
  var f = reportFields[i];
  var flex = (f.phptype === 'int' || f.phptype === 'float' || f.type === 'TINYINT') ? 1 : 2;
  out += '        ReportColumn(header: ' + captionKeyExpr(f) + ', value: (r) => ' + valueExpr(f) + ', flex: ' + flex + '),\n';
}
out += '      ];\n\n';

out += '  @override\n';
out += '  Widget build(BuildContext context, WidgetRef ref) {\n';
out += '    final async = ref.watch(' + entityLower + 'ListProvider);\n';
out += '    final tableLabel = tc(ref, ' + dartString(table.filename) + ');\n\n';
out += '    return Scaffold(\n';
out += "      appBar: AppBar(title: Text('\$tableLabel — Report')),\n";
out += '      body: async.when(\n';
out += '        loading: () => const Center(child: CircularProgressIndicator()),\n';
out += '        error: (e, _) => Center(child: Text("${s(ref, \'error_prefix\')}$e")),\n';
out += '        data: (rows) => PdfPreview(\n';
out += '          canChangePageFormat: true,\n';
out += '          canDebug: false,\n';
out += "          pdfFileName: '" + table.filename + ".pdf',\n";
out += '          build: (format) => ReportService.buildListBytes<' + entity + '>(\n';
out += '            format: format,\n';
out += '            title: tableLabel,\n';
out += "            subtitle: s(ref, 'records_count').replaceFirst('{count}', '\${rows.length}'),\n";
out += "            pageLabel: (page, total) => s(ref, 'page_of').replaceFirst('{page}', '\$page').replaceFirst('{total}', '\$total'),\n";
out += '            columns: _columns(ref),\n';
out += '            rows: rows,\n';
out += '          ),\n';
out += '        ),\n';
out += '      ),\n';
out += '    );\n';
out += '  }\n';

sContentResult += out;
return sContentResult;
{:codeend:}
}
