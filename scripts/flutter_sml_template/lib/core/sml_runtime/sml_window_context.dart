import 'dart:async';
import 'package:flutter/material.dart';
import 'package:desktop_multi_window/desktop_multi_window.dart';
import 'sml_control_binding.dart';
import 'sml_ui_context.dart';
import 'sml_dlg_context.dart';
import 'sml_win_context.dart';
import 'sml_rpt_context.dart';
import 'sml_timer_context.dart';

/// The live, per-window handle every generated event handler and local
/// procedure receives as `ctx` - the thing that lets translated SML code
/// reach a live BuildContext and this window's own controls, since neither
/// exists for a stateless namespace like SmlStr/SmlNum (see
/// sml_to_dart.js's WINDOW_SCOPED_NAMESPACES: ui/dlg/win/rpt/timer all read
/// through here instead of being static calls).
///
/// One instance per generated window State, created once in `initState()`
/// and kept for the window's whole lifetime. `controls` is populated by the
/// generator with exactly the controls that unit's `ui { }` list declares
/// (see SmlControlBinding) - a control that never appears in any SML code
/// simply never gets an entry, no different from how a plain rudimentary
/// control already worked before this integration.
class SmlWindowContext {
  final BuildContext Function() _contextGetter;
  final Map<String, SmlControlBinding> controls;
  final String windowName;
  final WindowController? ownWindowController;
  final Map<String, Timer> timers = {};

  /// Backs `SmlTimerContext.start()`'s WinDev-style int handle - each call
  /// gets a fresh id, keyed into [timers] as a string.
  int nextTimerId = 1;

  /// Backs `ui.set(ui.WINDOW, "property", value)`/`ui.get(ui.WINDOW, ...)`
  /// (see SmlUiContext.get/set and sml_constants.dart's `uiWindow`) - the
  /// standard WinDev modal-dialog idiom of tracking a "modified"/
  /// "returned_value"/"plane" flag ON THE WINDOW ITSELF rather than on any
  /// one control. Deliberately a plain untyped bag (WinDev itself imposes
  /// no fixed property set here) rather than dedicated fields.
  final Map<String, dynamic> windowProperties = {};

  /// Backs the `Name[index].Field` row-indexed read/write idiom (see
  /// SmlUiContext.row and sml_to_dart.js's translateExpr()) - real and
  /// common for BOTH `table` controls (`Table[ui.table_selected("Table") -
  /// 1].iArtNum`) and `looper` elements (`LOOP_Main[n - 1].FavButton`) in
  /// the real corpus, so ONE shared per-window store (keyed by the
  /// control's/looper's own name) serves both uniformly - WinDev addresses
  /// them identically through `ui.*`. Each row is a plain `{fieldName:
  /// value}` map, NOT typed to any particular struct - a Table/Looper's
  /// "columns" are only known from its row-template controls, which vary
  /// per instance.
  final Map<String, List<Map<String, dynamic>>> rowData = {};

  /// The rows for [name], creating an empty list on first use.
  List<Map<String, dynamic>> rowsFor(String name) =>
      rowData.putIfAbsent(name, () => <Map<String, dynamic>>[]);

  /// The row map at [index] for [name] - auto-extends with empty rows if
  /// [index] is beyond the current length (WinDev's own Table semantics
  /// allow writing `TableName[N].Column := X` on a row that doesn't exist
  /// yet, unlike a Looper's rows, which are only ever appended via
  /// `ui.looper_add`; the auto-extend is harmless for a Looper too since
  /// `looperAdd` always appends before this is ever indexed).
  Map<String, dynamic> row(String name, int index) {
    final rows = rowsFor(name);
    while (rows.length <= index) {
      rows.add(<String, dynamic>{});
    }
    return rows[index];
  }

  /// Which row is currently selected, per `table`/`looper` name - backs
  /// `ui.table_selected`/`ui.table_select` (see SmlUiContext). Real, plain
  /// state - NOT yet wired to an actual visual widget's tap/selection
  /// events (the rendering side is still the documented "no real data
  /// source yet" TODO - see control_widgets.dart), so this only reflects
  /// what SML code itself sets programmatically.
  final Map<String, int> selectedRow = {};

  /// Fixed status-bar strip height in logical pixels - measured against a
  /// real WinDev window by the user (23px). Real WinDev status bars ADD
  /// this to the window's own total height (the client area above it keeps
  /// its full designed size) rather than overlapping existing controls -
  /// window_modules.dart's own NavModule.canvasHeight adds this SAME
  /// constant when `has_status_bar` is set, so the OS window is requested
  /// (and `_WindowSizeCorrector` in main.dart corrects to) exactly designed
  /// height + this, and %1_page.dart's build() gives the status bar row
  /// exactly this many pixels below the untouched, full-height main
  /// content - both sides MUST stay in sync, hence one shared constant
  /// instead of two separately-hardcoded numbers.
  static const double statusBarHeight = 23.0;

  /// Backs WLanguage's `Message(text)` - confirmed real and DISTINCT from
  /// `Info()`/`dlg.info` (which pops up its own modal dialog): `Message()`
  /// writes/replaces the text shown in the window's OWN status bar, no
  /// dialog at all. Only meaningful for a window whose Window Designer
  /// "Status Bar" option is enabled (`window.has_status_bar` in the gtree -
  /// see %1_page.dart's own conditional status-bar widget); calling it on a
  /// window with no status bar just updates state nothing ever displays,
  /// which is harmless (matches WinDev's own behaviour: a window's
  /// StatusBar property being off doesn't make `Message()` itself an
  /// error). A `ValueNotifier` (not a plain field) so the status bar
  /// widget can listen and repaint on every call without the whole window
  /// needing `setState()`.
  final ValueNotifier<String> statusBarText = ValueNotifier<String>('');

  /// `Message(text)` - see [statusBarText]'s own doc comment. Real WinDev
  /// `Message()` replaces the ENTIRE status bar line, not just its text - a
  /// mini progress bar left over from an earlier `ProgressBar()` call must
  /// disappear too, or the bar would keep showing a now-stale percentage
  /// next to unrelated text. `progressBar()` itself never needs the mirror
  /// image of this (it always sets [statusBarText] itself, so there's no
  /// "leftover text" case to clean up there).
  void message(String text) {
    statusBarText.value = text;
    progressBarValue.value = null;
  }

  /// Backs WLanguage's `ProgressBar(nCurrent, nMax, sCaption, color)` -
  /// confirmed real, same status bar as [statusBarText]/[message] but with
  /// a small filled bar drawn to the LEFT of the caption text (WinDev's own
  /// "show a mini progress indicator plus a message" idiom - not a modal
  /// dialog, same non-blocking status-bar family as `Message()`). `null`
  /// hides the bar (never set by SML yet - no confirmed real call clears
  /// it, so nothing calls this with null itself; it exists so the status
  /// bar widget below has an honest "not shown" state before the first
  /// real call and after this window is first built).
  final ValueNotifier<double?> progressBarValue = ValueNotifier<double?>(null);

  /// The progress bar's own fill colour - WinDev's 4th `ProgressBar(...)`
  /// argument (a named colour constant like `LightGreen`, packed as a full
  /// ARGB int by sml_constants.dart - see its own doc comment on why that's
  /// a full 32-bit value, not a 24-bit one forced to opaque here).
  final ValueNotifier<Color> progressBarColor = ValueNotifier<Color>(const Color(0xFF3B82F6));

  /// `ProgressBar(nCurrent, nMax, sCaption, color)` - see
  /// [progressBarValue]/[progressBarColor]'s own doc comments. [nMax] of 0
  /// is treated as "no real range given" (an empty/hidden bar, `0.0`)
  /// rather than dividing by zero - not a confirmed real WinDev shape, just
  /// a safe fallback for it.
  void progressBar(int current, int max, String caption, [dynamic color]) {
    statusBarText.value = caption;
    progressBarValue.value = max > 0 ? (current / max).clamp(0.0, 1.0) : 0.0;
    if (color is int) {
      progressBarColor.value = Color(color);
    }
  }

  // ignore: prefer_initializing_formals - the field is private and the
  // public constructor parameter name (`contextGetter`) is deliberately
  // different, so an initializing formal (`this._contextGetter`) isn't
  // usable here (it would force callers to pass a private-named argument).
  SmlWindowContext({
    required BuildContext Function() contextGetter,
    required this.controls,
    required this.windowName,
    this.ownWindowController,
  }) : _contextGetter = contextGetter;

  BuildContext get context => _contextGetter();

  SmlControlBinding? binding(String name) => controls[name];

  late final SmlUiContext ui = SmlUiContext(this);
  late final SmlDlgContext dlg = SmlDlgContext(this);
  late final SmlWinContext win = SmlWinContext(this);
  late final SmlRptContext rpt = SmlRptContext(this);
  late final SmlTimerContext timer = SmlTimerContext(this);

  /// True while THIS window has a real WinDev `Open(...)` call in flight
  /// (see [SmlWinContext.open]) - the opened window is a genuinely separate
  /// real OS window/process, so there is no OS-level way to disable THIS
  /// window's own input the way a real modal dialog owned by the SAME
  /// process could; %1_page.dart's own `build()` listens to this and
  /// covers this window's own content with an input-absorbing (and
  /// lightly dimmed, so it's visually obvious why clicks don't do
  /// anything) overlay for as long as it's true, which is the practical
  /// effect WinDev's own modal `Open()` is actually for - the CALLING
  /// window shouldn't be usable until the opened one closes.
  final ValueNotifier<bool> isBlockedByModal = ValueNotifier<bool>(false);

  /// Cancels every still-running timer this window started - call from the
  /// generated State's own `dispose()` so a window that opened a repeating
  /// timer never leaks it after the window closes.
  void dispose() {
    for (final t in timers.values) {
      t.cancel();
    }
    timers.clear();
    statusBarText.dispose();
    progressBarValue.dispose();
    progressBarColor.dispose();
    isBlockedByModal.dispose();
  }
}
