import 'package:flutter/material.dart';

import '../core/nav_module.dart';
{:for nmaxuiwindows:}
import '{:window.name:}_page.dart';
{:endfor:}

/// The registry of every window designed in Scoriet's Window Designer.
///
/// SCORIET: this is the ONE list Scoriet appends to when a new window_file
/// is generated. Everything about a window's content is self-contained in
/// its own `<name>_page.dart`. canvasWidth/canvasHeight are the window's own
/// design-time size, used by the menu (see menu_page.dart) to open it as a
/// correctly-sized modal instead of a full-screen page.
final List<NavModule> windowModules = <NavModule>[
{:for nmaxuiwindows:}
  NavModule(
    id: '{:window.name:}',
    label: '{:dartstring(window.display_name):}',
    icon: Icons.window_outlined,
    canvasWidth: {:window.canvas_width:}.toDouble(),
    canvasHeight: {:window.canvas_height:}.toDouble(),
    builder: (_) => const {:pascalcase(window.name):}Content(),
  ),
{:endfor:}
];
