import 'dart:typed_data';

import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

/// A single column definition for a tabular report.
class ReportColumn<T> {
  const ReportColumn({
    required this.header,
    required this.value,
    this.alignRight = false,
    this.flex = 1,
  });

  final String header;
  final String Function(T row) value;
  final bool alignRight;
  final int flex;
}

/// Generic, entity-agnostic report/print builder.
///
/// SCORIET: static file — a generated entity report page just supplies the
/// title + [ReportColumn] list + rows and calls [printList]. No PDF code is
/// generated per entity.
class ReportService {
  static final _dateFmt = DateFormat('yyyy-MM-dd HH:mm');

  /// Opens the OS print/preview dialog with a paginated list report.
  static Future<void> printList<T>({
    required String title,
    required List<ReportColumn<T>> columns,
    required List<T> rows,
    String? subtitle,
    String Function(int page, int total)? pageLabel,
  }) {
    return Printing.layoutPdf(
      name: title,
      onLayout: (format) => buildListBytes(
        format: format,
        title: title,
        subtitle: subtitle,
        columns: columns,
        rows: rows,
        pageLabel: pageLabel,
      ),
    );
  }

  /// Same report as [printList] but returns raw bytes, for an inline
  /// [PdfPreview] widget (see the entity report page).
  ///
  /// [pageLabel] renders the footer's page indicator; this class has no
  /// Riverpod context of its own (static/entity-agnostic), so the caller —
  /// which does — supplies an already-translated builder. Defaults to
  /// English since that's the only language this file can assume.
  static Future<Uint8List> buildListBytes<T>({
    required PdfPageFormat format,
    required String title,
    required List<ReportColumn<T>> columns,
    required List<T> rows,
    String? subtitle,
    String Function(int page, int total)? pageLabel,
  }) async {
    final bytes = await _buildListPdf(
      format: format,
      title: title,
      subtitle: subtitle,
      columns: columns,
      rows: rows,
      pageLabel: pageLabel ?? (page, total) => 'Page $page / $total',
    );
    return Uint8List.fromList(bytes);
  }

  static Future<List<int>> _buildListPdf<T>({
    required PdfPageFormat format,
    required String title,
    required List<ReportColumn<T>> columns,
    required List<T> rows,
    String? subtitle,
    required String Function(int page, int total) pageLabel,
  }) async {
    final doc = pw.Document();

    doc.addPage(
      pw.MultiPage(
        pageFormat: format.landscape,
        margin: const pw.EdgeInsets.all(28),
        header: (context) => _header(title, subtitle, context),
        footer: (context) => _footer(context, pageLabel),
        build: (context) => [
          pw.TableHelper.fromTextArray(
            headerStyle: pw.TextStyle(
              fontWeight: pw.FontWeight.bold,
              fontSize: 9,
            ),
            cellStyle: const pw.TextStyle(fontSize: 9),
            headerDecoration: const pw.BoxDecoration(color: PdfColors.grey300),
            cellHeight: 20,
            columnWidths: {
              for (var i = 0; i < columns.length; i++)
                i: pw.FlexColumnWidth(columns[i].flex.toDouble()),
            },
            cellAlignments: {
              for (var i = 0; i < columns.length; i++)
                i: columns[i].alignRight
                    ? pw.Alignment.centerRight
                    : pw.Alignment.centerLeft,
            },
            headers: columns.map((c) => c.header).toList(),
            data: rows
                .map((r) => columns.map((c) => c.value(r)).toList())
                .toList(),
          ),
        ],
      ),
    );

    return doc.save();
  }

  static pw.Widget _header(String title, String? subtitle, pw.Context ctx) {
    return pw.Container(
      margin: const pw.EdgeInsets.only(bottom: 12),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text(title,
                  style: pw.TextStyle(
                      fontSize: 16, fontWeight: pw.FontWeight.bold)),
              pw.Text('{:projectname:} · ${_dateFmt.format(DateTime.now())}',
                  style: const pw.TextStyle(
                      fontSize: 9, color: PdfColors.grey700)),
            ],
          ),
          if (subtitle != null)
            pw.Text(subtitle,
                style:
                    const pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
          pw.Divider(thickness: 0.5),
        ],
      ),
    );
  }

  static pw.Widget _footer(
    pw.Context ctx,
    String Function(int page, int total) pageLabel,
  ) {
    return pw.Container(
      alignment: pw.Alignment.centerRight,
      margin: const pw.EdgeInsets.only(top: 8),
      child: pw.Text(
        pageLabel(ctx.pageNumber, ctx.pagesCount),
        style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey700),
      ),
    );
  }
}
