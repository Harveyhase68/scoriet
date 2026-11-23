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

  // A single table row can only ever be as wide as the page; splitting that
  // width across N columns means each column's share shrinks as N grows,
  // which eventually forces cell text to wrap into so many lines that a row
  // no longer fits on any page at all (the `pdf` package then gives up with
  // a TooManyPagesException — no page format is wide/tall enough to make an
  // unbounded number of table columns fit forever). Past this threshold the
  // report switches from a spreadsheet-style row to one bordered "detail
  // card" per record (label: value pairs that wrap freely): a record's
  // height then only ever depends on its own content, never on how many
  // sibling columns it has to share page width with, so it can't overflow
  // a page the way a shrinking table column can. No data is dropped either
  // way — wide tables just render taller instead of narrower.
  static const _maxTableColumns = 12;

  static Future<List<int>> _buildListPdf<T>({
    required PdfPageFormat format,
    required String title,
    required List<ReportColumn<T>> columns,
    required List<T> rows,
    String? subtitle,
    required String Function(int page, int total) pageLabel,
  }) async {
    final doc = pw.Document();
    final useCards = columns.length > _maxTableColumns;

    doc.addPage(
      pw.MultiPage(
        pageFormat: format.landscape,
        margin: const pw.EdgeInsets.all(28),
        header: (context) => _header(title, subtitle, context),
        footer: (context) => _footer(context, pageLabel),
        build: (context) => useCards
            ? _buildCards(columns, rows)
            : [_buildTable(columns, rows)],
      ),
    );

    return doc.save();
  }

  static pw.Widget _buildTable<T>(
    List<ReportColumn<T>> columns,
    List<T> rows,
  ) {
    return pw.TableHelper.fromTextArray(
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
      data: rows.map((r) => columns.map((c) => c.value(r)).toList()).toList(),
    );
  }

  static List<pw.Widget> _buildCards<T>(
    List<ReportColumn<T>> columns,
    List<T> rows,
  ) {
    return [
      for (final row in rows)
        pw.Container(
          margin: const pw.EdgeInsets.only(bottom: 10),
          padding: const pw.EdgeInsets.all(8),
          decoration: pw.BoxDecoration(
            border: pw.Border.all(color: PdfColors.grey400, width: 0.5),
            borderRadius: const pw.BorderRadius.all(pw.Radius.circular(3)),
          ),
          child: pw.Wrap(
            spacing: 18,
            runSpacing: 6,
            children: [
              for (final c in columns)
                pw.Container(
                  width: 220,
                  child: pw.RichText(
                    text: pw.TextSpan(
                      children: [
                        pw.TextSpan(
                          text: '${c.header}: ',
                          style: pw.TextStyle(
                            fontWeight: pw.FontWeight.bold,
                            fontSize: 8,
                            color: PdfColors.grey700,
                          ),
                        ),
                        pw.TextSpan(
                          text: c.value(row),
                          style: const pw.TextStyle(fontSize: 8),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
    ];
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
