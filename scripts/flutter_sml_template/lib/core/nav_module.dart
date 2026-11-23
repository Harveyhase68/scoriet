import 'package:flutter/material.dart';

/// One entry in the windows menu.
///
/// SCORIET: every generated window exposes exactly one `NavModule` and
/// registers it in `windows/window_modules.dart`. Adding a window in the
/// Window Designer = adding one entry to that list. [builder] builds the
/// window's CONTENT ONLY (not a full Scaffold/page) - the menu opens it as
/// a modal sized to [canvasWidth]/[canvasHeight] (see core/window_frame.dart
/// - `showWindow()`), so windows compare at their real designed size
/// instead of all stretching to fill whatever screen the app happens to run
/// on.
class NavModule {
  const NavModule({
    required this.id,
    required this.label,
    required this.icon,
    required this.canvasWidth,
    required this.canvasHeight,
    required this.builder,
  });

  /// Stable identifier - the window's name.
  final String id;

  /// Human-readable label shown in the menu.
  final String label;

  final IconData icon;

  /// The window's own design-time canvas size, from the Window Designer.
  final double canvasWidth;
  final double canvasHeight;

  /// Builds the window's content (a Stack of positioned controls sized to
  /// canvasWidth x canvasHeight) - not a full page.
  final WidgetBuilder builder;
}
