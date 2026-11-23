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
Future<void> openWindow(String id) async {
  await WindowController.create(
    WindowConfiguration(
      arguments: jsonEncode({'window_id': id}),
      hiddenAtLaunch: true,
    ),
  );
}
