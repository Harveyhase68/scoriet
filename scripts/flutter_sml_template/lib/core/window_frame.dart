import 'dart:convert';

import 'package:desktop_multi_window/desktop_multi_window.dart';

/// Opens a Window Designer window as its own real OS-level window - not a
/// widget drawn inside the app's main window, but a separate top-level
/// window with native chrome (title bar, minimize/maximize/close buttons,
/// draggable, resizable by dragging its edges), backed by its own Flutter
/// engine and its own run of `main.dart`'s entry point. That entry point
/// resolves [id] against the shared window registry (windows/window_modules.dart)
/// and sizes/titles/shows the new window from there - this only has to pass
/// the id along, plus keep the window hidden until then so it never flashes
/// at the wrong size first.
///
/// `OpenChild()`/`OpenSister()` (see SmlWinContext) - the opened window is
/// fully independent, this call returns as soon as it's been REQUESTED,
/// never waiting for it to close.
Future<void> openWindow(String id) async {
  await WindowController.create(
    WindowConfiguration(
      arguments: jsonEncode({'window_id': id}),
      hiddenAtLaunch: true,
    ),
  );
}

/// `Open()` (see SmlWinContext) - real WinDev modal semantics: blocks the
/// caller until the opened window closes.
///
/// Detects that by POLLING `WindowController.getAll()` (the SAME, already
/// proven-reliable primitive [[reference_global_sync_cross_window|GlobalSync]]
/// uses) until the child's own `windowId` is no longer in the list, rather
/// than a push-based "I closed" signal sent FROM the child (a real, tried
/// approach first - see reference_open_modal_window_signal.md's own "found
/// the next day" section): that needed `window_manager`'s
/// `setPreventClose`/`WindowListener`/manual `destroy()` on the CHILD side,
/// which crashed the whole app natively ("Lost connection to device", no
/// catchable Dart exception at all - a genuine native-level failure, not
/// something a `Future(...)` reentrancy deferral could fix, as a first
/// attempt at fixing it confirmed). Polling needs NONE of that - it only
/// ever calls the SAME `getAll()`/window-creation APIs already proven safe
/// everywhere else in this template, at the cost of a real WinDev
/// modal window's own close only being noticed within [_pollInterval],
/// not instantly.
const _pollInterval = Duration(milliseconds: 200);

Future<void> openWindowModal(String id) async {
  final controller = await WindowController.create(
    WindowConfiguration(
      arguments: jsonEncode({'window_id': id}),
      hiddenAtLaunch: true,
    ),
  );
  final childId = controller.windowId;
  while (true) {
    await Future.delayed(_pollInterval);
    final stillOpen = await WindowController.getAll();
    if (!stillOpen.any((w) => w.windowId == childId)) return;
  }
}
