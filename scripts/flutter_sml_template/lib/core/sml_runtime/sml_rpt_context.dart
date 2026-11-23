import 'sml_window_context.dart';

/// `rpt.*` (see supported.md's `rpt` namespace, `lib_report`) - report
/// printing/preview. NOT implemented this round (see the Flutter SML
/// Template README's scope table): printing a WinDev report has no
/// equivalent yet on the Scoriet side (report generation is the Report
/// Designer's own, separate template, not something the Window Designer's
/// generated app can render today). Every function still exists, so
/// generated code referencing `rpt.*` compiles - it just does nothing yet,
/// clearly marked, rather than being silently dropped from the namespace
/// table entirely.
class SmlRptContext {
  final SmlWindowContext _ctx;
  const SmlRptContext(this._ctx);

  void print(String reportName) {
    // TODO: rpt.print - report generation/rendering not implemented yet
  }

  void write(String reportName) {
    // TODO: rpt.write - report generation/rendering not implemented yet
  }

  /// `iPreview` - `dynamic`, not `String` - confirmed real usage passes a
  /// numeric preview-mode flag (`ctx.rpt.preview(100)`), not a report name
  /// (WinDev's report functions work against an ambient "current report"
  /// context, set separately - same reasoning as [destination]'s own `int`
  /// parameter). Not implemented either way (see class doc comment).
  void preview(dynamic modeOrReportName) {
    // TODO: rpt.preview - report generation/rendering not implemented yet
  }

  void destination(int mode) {
    // TODO: rpt.destination - report generation/rendering not implemented yet
  }

  /// `bShowDialog` - confirmed real usage passes a boolean
  /// (`ctx.rpt.configure(false)`, from a WIN_Menu.sml "Configure Print..."
  /// menu item's `select` event). Not implemented either way (see class
  /// doc comment) - WinDev's real print-setup dialog has no Flutter
  /// equivalent yet.
  void configure(bool showDialog) {
    // TODO: rpt.configure - report generation/rendering not implemented yet
  }
}
