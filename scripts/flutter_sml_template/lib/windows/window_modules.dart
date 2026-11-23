import 'package:flutter/material.dart';

import '../core/nav_module.dart';
import '../core/sml_runtime/sml_window_context.dart';
{:for nmaxuiwindows:}
import '{:window.name:}_page.dart';
{:endfor:}

/// The registry of every window designed in Scoriet's Window Designer.
///
/// SCORIET: this is the ONE list Scoriet appends to when a new window_file
/// is generated. Everything about a window's content is self-contained in
/// its own `<name>_page.dart`. canvasWidth/canvasHeight are the window's own
/// design-time size, requested as the real OS window's size when it opens
/// (see core/window_frame.dart's `openWindow()` and main.dart's own
/// `WindowOptions`).
final List<NavModule> windowModules = <NavModule>[
{:for nmaxuiwindows:}
  NavModule(
    id: '{:window.name:}',
    label: '{:dartstring(window.display_name):}',
    icon: Icons.window_outlined,
    canvasWidth: {:window.canvas_width:}.toDouble(),
    // See SmlWindowContext.statusBarHeight's own doc comment - the status
    // bar ADDS to the window's total height rather than overlapping
    // existing controls, so the OS window this size requests must already
    // include it.
    canvasHeight: ({:window.canvas_height:}{:if window.has_status_bar:} + SmlWindowContext.statusBarHeight{:endif:}).toDouble(),
    builder: (_) => const {:pascalcase(window.name):}Content(),
  ),
{:endfor:}
];

/// Which window's [NavModule.id] the app launches directly into instead of
/// a menu/demo screen - the ONE window the Window Designer's "Set first
/// project window" action marked (`UiWindow.is_first_window`), or `null` if
/// none is marked. `main.dart`'s own primary-engine branch falls back to
/// "the only window" itself when this is `null` and exactly one window
/// exists - see its own doc comment.
const String? firstWindowId = {:if firstwindowname:}'{:firstwindowname:}'{:else:}null{:endif:};

/// SML code-behind (win.open/win.open_child/win.close, see
/// core/sml_runtime/sml_win_context.dart) always names a window by its
/// original WinDev unit name (e.g. "WIN_IP") - never by Scoriet's own
/// sanitized machine name ("win_ip") used as [NavModule.id]/[openWindow]'s
/// argument above. This is the lookup that bridges the two; a window that
/// wasn't WinDev-imported (no source_name) simply never appears here, which
/// is correct - such a window has no SML code that could reference it by a
/// WinDev name in the first place.
final Map<String, String> windowNameBySourceName = <String, String>{
{:for nmaxuiwindows:}
{:if window.source_name:}
  '{:dartstring(window.source_name):}': '{:window.name:}',
{:endif:}
{:endfor:}
};
