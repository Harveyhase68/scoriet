import 'sml_constants.dart';
import 'sml_window_context.dart';

/// `ui.*` (see supported.md's `ui` namespace, `lib_ui`) - every function
/// here takes a control name, so it needs the owning window's live control
/// registry rather than being a stateless static class (see
/// SmlWindowContext/SmlControlBinding).
///
/// Round-1 scope (see the Flutter SML Template README): `get`/`set` are
/// fully generic and real, working for ANY control via SmlControlBinding's
/// own property table. `table_add`/`table_clear`/`table_count`/
/// `table_selected`/`table_select` and their `looper_*` equivalents are now
/// ALSO real, backed by SmlWindowContext.rowData/selectedRow - confirmed
/// common real usage: `set n = ui.table_add("Table")` /
/// `set n = ui.looper_add("LOOP_Main")`, then addressing the new row as
/// `Table[n - 1].Column` / `LOOP_Main[n - 1].Field` (see
/// sml_to_dart.js's row-indexed access handling in translateExpr()). What's
/// still NOT real: the VISUAL widget doesn't read this data yet to render
/// rows (control_widgets.dart's Table/Looper rendering is still a fixed
/// preview-row-count placeholder) and `table_selected`/`table_select` are
/// not wired to an actual tap/selection gesture - both need the
/// control-rendering layer to grow a real data source, a separate, larger
/// prerequisite. `list_*` remain honest TODO stubs (no comparable "always a
/// name-only call" real corpus evidence was found for those, unlike
/// table_add/looper_add).
class SmlUiContext {
  final SmlWindowContext _ctx;
  const SmlUiContext(this._ctx);

  /// `ui.get("ControlName", "Property")` - `controlName == uiWindow`
  /// (from `ui.get(ui.WINDOW, ...)`) reads the WINDOW's own property bag
  /// instead of a control's (see SmlWindowContext.windowProperties).
  dynamic get(String controlName, String property) {
    if (controlName == uiWindow) {
      return _ctx.windowProperties[property];
    }
    return _ctx.binding(controlName)?.getProperty(property);
  }

  /// `call ui.set("ControlName", "Property", value)` - same `uiWindow`
  /// special-case as `get` above.
  void set(String controlName, String property, dynamic value) {
    if (controlName == uiWindow) {
      _ctx.windowProperties[property] = value;
      return;
    }
    _ctx.binding(controlName)?.setProperty(property, value);
  }

  /// `ControlExist`/`ChampExiste` -> `ui.exists`
  bool exists(String controlName) => _ctx.binding(controlName) != null;

  /// `WinInput` -> `ui.current_window` - the name of the window this
  /// context belongs to (set by the generator, one per generated page).
  String currentWindow() => _ctx.windowName;

  /// `ControlAt(windowName, index)` - the name of the Nth control
  /// registered on the given window, or `""` when out of range - WinDev's
  /// own "enumerate every control on a window" idiom, confirmed real
  /// (`RADFindControl`'s own loop calls `ui.control_at(ui.current_window(),
  /// nSubscript - 1)` repeatedly until it gets `""` back, to search every
  /// control for one bound to a given field). `index` is already 0-based
  /// by the time SML sees it (ADR-004 - the real call site's own `- 1`
  /// converts FROM the loop's 1-based counter), matching `controls`'s own
  /// Dart-`Map` iteration order - real as far as "some stable, complete
  /// enumeration of this window's controls" goes, though that order is
  /// whatever this window's own generated code happened to register
  /// bindings in, not necessarily WinDev's original design-time tab order.
  /// `windowName` is accepted for signature compatibility with the real
  /// 2-arg call (always `ui.current_window()` in every confirmed real use)
  /// but not otherwise consulted - this SmlUiContext instance only ever
  /// has its OWN window's controls to offer regardless of which name is
  /// passed.
  String controlAt(String windowName, int index) {
    if (index < 0 || index >= _ctx.controls.length) { return ''; }
    return _ctx.controls.keys.elementAt(index);
  }

  /// `FileToScreen`/`ScreenToFile` - WinDev's RAD "linked file" auto-
  /// binding: a form window declares which database TABLE it edits, and
  /// every control whose name matches a field name auto-binds to it;
  /// `FileToScreen()` copies the current record INTO those controls,
  /// `ScreenToFile()` copies the controls' values back into the pending
  /// record buffer. Confirmed real (RAD-generated `RADDisplay`/`RADSave`
  /// call these with ZERO arguments - the "which table, which controls"
  /// binding is entirely implicit). Not implemented - building it for real
  /// needs the window's own linked-table + control/field-name-mapping data,
  /// a separate, larger prerequisite (same category as Table/Looper visual
  /// rendering) - kept here only so a real call site still compiles.
  void fileToScreen() {
    // TODO: ui.file_to_screen - RAD linked-file auto-binding not implemented yet
  }

  void screenToFile() {
    // TODO: ui.screen_to_file - RAD linked-file auto-binding not implemented yet
  }

  // ---- Table/Looper row data - real (see class doc comment for what's
  // still NOT real: visual rendering and selection gestures) ----

  int _addRow(String controlName) {
    final rows = _ctx.rowsFor(controlName);
    rows.add(<String, dynamic>{});
    return rows.length;
  }

  /// `Name[index].Field` - the shared read/write target for both
  /// `table_add`/`looper_add`'d rows (see sml_to_dart.js's translateExpr()).
  Map<String, dynamic> row(String controlName, int index) =>
      _ctx.row(controlName, index);

  /// `ui.table_add("Name")` - real corpus is always the 1-arg,
  /// return-value-used form (`set n = ui.table_add("Table")`).
  int tableAdd(String controlName) => _addRow(controlName);

  void tableClear(String controlName) => _ctx.rowsFor(controlName).clear();

  int tableCount(String controlName) => _ctx.rowsFor(controlName).length;

  int tableSelected(String controlName) => _ctx.selectedRow[controlName] ?? -1;

  void tableSelect(String controlName, int rowIndex) {
    _ctx.selectedRow[controlName] = rowIndex;
  }

  /// `mode` (a `ta*` refresh-scope constant - see sml_constants.dart) is
  /// accepted and ignored - confirmed real 2-arg call
  /// (`ui.table_refresh("TABLE", taCurrentSelection)`), but there is no
  /// real per-row rendering yet to selectively refresh (see class doc
  /// comment) regardless of which scope is requested.
  void tableRefresh(String controlName, [dynamic mode]) {
    // TODO: ui.table_refresh - forces a visual redraw; no real rendering
    // reads this row data yet (see class doc comment), so nothing to do.
  }

  /// `Redraw` - WinDev's generic "force this control to repaint now" call,
  /// confirmed real (`ui.redraw("Projekt_Fortschritt")`, immediately after
  /// updating a progress-table row's cell values in-place) - same "nothing
  /// to actually redraw yet" reasoning as [tableRefresh] above.
  void redraw(String controlName) {
    // TODO: ui.redraw - see tableRefresh()'s own doc comment.
  }

  /// `TableEdit`/`IsEdited`-style "is this table control currently in
  /// inline-edit mode" check - confirmed real
  /// (`if ui.table_editing("TABLE") == false { ... }`, RAD-generated
  /// auto-refresh guard: don't refresh out from under the user while
  /// they're mid-edit). No real inline-editing UI exists yet for a Table
  /// control (see class doc comment) - always `false` is the honest
  /// answer for "is the user editing" when there is no edit mode to be in.
  bool tableEditing(String controlName) => false;

  /// `ui.looper_add("Name")` - same shape/behaviour as `table_add` above,
  /// real corpus confirms the identical 1-arg, return-value-used form.
  int looperAdd(String controlName) => _addRow(controlName);

  void looperClear(String controlName) => _ctx.rowsFor(controlName).clear();

  int looperCount(String controlName) => _ctx.rowsFor(controlName).length;

  void listAdd(String controlName, String item) {
    // TODO: ui.list_add - list-style controls have no real data source yet
  }

  /// `ui.cell_link(value)` - WinDev's combo/list "hidden value" pairing
  /// helper: the caller composes `ctx.ui.cellLink(underlyingValue) +
  /// displayText` and passes the result to `list_add`/`table_add`, encoding
  /// an item's real value alongside what the user sees. Returns "" for now
  /// (same "no real data source yet" TODO as the list/table/looper methods
  /// above) - a real list/combo data binding needs to decide its own
  /// value/display encoding before this can do anything meaningful.
  String cellLink(dynamic value) => '';

  void listClear(String controlName) {
    // TODO: ui.list_clear - list-style controls have no real data source yet
  }

  int listCount(String controlName) {
    // TODO: ui.list_count - list-style controls have no real data source yet
    return 0;
  }

  int listSelected(String controlName) {
    // TODO: ui.list_selected - list-style controls have no real data source yet
    return -1;
  }

  void listSelect(String controlName, dynamic value) {
    // TODO: ui.list_select - list-style controls have no real data source yet
  }

  /// `ui.list_find(controlName, value)` - searches a list-style control's
  /// items for `value`, returning the found index or -1 (same not-found
  /// sentinel as `SmlArr.find` - see lib_arr.dart) when not found.
  /// TODO: list-style controls have no real data source yet.
  int listFind(String controlName, dynamic value) {
    return -1;
  }

  /// `RetourSaisie` -> `ui.return_to_input(controlName)` - returns input
  /// focus to the given control (used after a validation failure so the
  /// user can correct it). TODO: not yet wired to Flutter's FocusNode /
  /// focus-request machinery - needs each bindable control to expose a
  /// FocusNode via SmlControlBinding first.
  void returnToInput(String controlName) {
    // TODO: ui.return_to_input - focus management not wired up yet
  }
}
