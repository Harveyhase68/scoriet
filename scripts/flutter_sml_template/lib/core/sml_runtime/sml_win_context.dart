import 'dart:io';
import 'package:flutter/material.dart';
import 'package:window_manager/window_manager.dart';
import '../window_frame.dart';
import '../../windows/window_modules.dart';
import 'sml_window_context.dart';

/// `win.*` (see supported.md's `win` namespace, `lib_window`) - opening and
/// closing windows. Built entirely on the app's EXISTING multi-window
/// mechanism (core/window_frame.dart's `openWindow()`/`openWindowModal()`)
/// - `windowNameBySourceName` (windows/window_modules.dart) bridges an SML
/// `win.open("WIN_IP")` call's WinDev unit name to Scoriet's own sanitized
/// window name that `openWindow`/[NavModule.id] actually use; a window
/// built by hand directly in the Designer (no WinDev import, so no
/// source_name) is instead matched directly against its own Scoriet name -
/// see [_resolveWindowId]'s own doc comment.
class SmlWinContext {
  final SmlWindowContext _ctx;
  const SmlWinContext(this._ctx);

  /// Two real ways SML code names a window: the ORIGINAL WinDev unit name
  /// (`windowNameBySourceName` - only populated for windows that came from
  /// a real WinDev import) - OR, confirmed real for a window built by hand
  /// directly in the Window Designer (never imported, so it has no WinDev
  /// source_name at all), Scoriet's OWN window name exactly as shown in the
  /// Designer/[NavModule.id] - `Open("win_test")` for a window literally
  /// named "win_test". Tried in that order; NEVER the Dart FILE name
  /// (`win_test_page` - the `_page.dart` suffix is purely a file-naming
  /// convention, not the window's own identity anywhere).
  String? _resolveWindowId(String windowSourceName) =>
      windowNameBySourceName[windowSourceName] ??
      (windowModules.any((m) => m.id == windowSourceName) ? windowSourceName : null);

  /// `Open(name, ...)` - real WinDev modal semantics: blocks the CALLING
  /// code until the opened window closes (see WindowModalSignal's own doc
  /// comment for the cross-process "it closed" signal this needs - two
  /// separate windows are two separate processes with no shared memory).
  ///
  /// `extraArgs` - WinDev's `Open(name, param1, param2, ...)` passes
  /// constructor-style parameters to the opened window's own `declarations`
  /// event (confirmed real and common - real corpus calls with up to 3).
  /// Wiring those through is a separate, larger, still out-of-scope
  /// prerequisite (the opened window's own StatefulWidget would need
  /// constructor parameters - see %1_page.dart's class doc comment) -
  /// accepted and ignored here so the CALL SITE compiles regardless of how
  /// many the real WinDev source passes, rather than failing to compile at
  /// all over an arg-count mismatch. Returns `true` unconditionally once the
  /// window has closed - real WinDev usage often gates on the result
  /// (`if (await ctx.win.open(...))`, checking whether the opened window's
  /// own `Close` accepted/cancelled) - a safe "assume success" default
  /// until that return-value plumbing (`Close(returnValue)`) exists.
  Future<bool> open(String windowSourceName, [dynamic p1, dynamic p2, dynamic p3]) async {
    final id = _resolveWindowId(windowSourceName);
    if (id == null) {
      // TODO: win.open - no generated window matches this name (neither a
      // WinDev unit name nor a Scoriet window name); never silently do
      // nothing without a trace, but also never crash the caller over a
      // data/naming mismatch.
      debugPrint('SmlWinContext.open: no window named "$windowSourceName" was generated');
      return false;
    }
    // `openWindowModal()` only blocks the CALLING SML CODE from continuing
    // to its next statement - the opened window is a genuinely separate OS
    // window/process, so there is no OS-level way to also disable input on
    // THIS window the way a same-process modal dialog could. `%1_page.dart`'s
    // own `build()` listens to this flag and covers THIS window's content
    // with an input-absorbing overlay for as long as it's true - see
    // SmlWindowContext.isBlockedByModal's own doc comment. `try`/`finally`
    // so a genuinely unresolvable [openWindowModal] (its own accepted
    // "child process killed some other way" limitation) doesn't leave this
    // window permanently blocked forever for no reason - though in that
    // case the caller itself never gets past this line anyway.
    _ctx.isBlockedByModal.value = true;
    try {
      await openWindowModal(id);
    } finally {
      _ctx.isBlockedByModal.value = false;
    }
    return true;
  }

  /// `OpenChild(name, ...)`/`OpenSister(name, ...)` - a genuinely
  /// independent window, both equal-standing - returns as soon as the
  /// window has been REQUESTED, never waiting for it to close (unlike
  /// [open] above).
  Future<bool> openChild(String windowSourceName, [dynamic p1, dynamic p2, dynamic p3]) async {
    final id = _resolveWindowId(windowSourceName);
    if (id == null) {
      debugPrint('SmlWinContext.openChild: no window named "$windowSourceName" was generated');
      return false;
    }
    await openWindow(id);
    return true;
  }

  Future<bool> openSibling(String windowSourceName, [dynamic p1, dynamic p2, dynamic p3]) =>
      openChild(windowSourceName, p1, p2, p3);

  /// `Close` - closes the window THIS context belongs to (its own running
  /// OS window), not an arbitrary other one by name; matches how a WinDev
  /// window's own `Close()` call (no argument) closes itself.
  ///
  /// `window_manager.close()` (a REAL close, not `WindowController`'s own
  /// show()/hide() - which this project's earlier round mistakenly believed
  /// was the only option `desktop_multi_window` (0.3.0) offered). Plain,
  /// UN-intercepted `close()` - no `setPreventClose()`/custom
  /// `WindowListener` here (a real modal `Open()` used to try exactly that,
  /// to actively signal its caller the instant it closed - crashed the
  /// whole app natively instead, see
  /// reference_open_modal_window_signal.md's own "found the next day"
  /// section; `core/window_frame.dart`'s `openWindowModal()` now POLLS for
  /// the same "did it close" fact instead, needing no cooperation from
  /// THIS method at all).
  ///
  /// `returnValues` - WinDev's `Close(value, ...)` passes this window's own
  /// "result" back to whichever `Open()` call is awaiting it (confirmed
  /// real: `win.close("", gsModifiedWindow)`) - same still-out-of-scope
  /// parameter-passing prerequisite as `open()`'s `extraArgs` above, so
  /// accepted and ignored for the same reason (a compiling call site now,
  /// real value propagation once window constructor parameters exist).
  Future<void> close([dynamic returnValue1, dynamic returnValue2]) async {
    await windowManager.close();
  }

  /// `EndProgram` - terminates the whole application, every window, no
  /// further Dart code runs after this - the simplest reliable way to do
  /// that in a Flutter desktop app is exiting the process directly rather
  /// than trying to individually close every other OS-level window first.
  Future<void> endProgram() async {
    exit(0);
  }

  /// `Use`/`WindowSize` - project-specific window sizing/activation not yet
  /// wired to a concrete generated mechanism.
  Future<void> use(String windowSourceName) async {
    // TODO: win.use - no direct equivalent modeled yet
  }

  Future<void> resize(String windowSourceName, double width, double height) async {
    // TODO: win.resize - resizing another already-open window by name is not wired yet
  }
}
