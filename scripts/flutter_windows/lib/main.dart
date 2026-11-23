import 'dart:convert';

import 'package:desktop_multi_window/desktop_multi_window.dart';
import 'package:flutter/material.dart';
import 'package:window_manager/window_manager.dart';

import 'core/nav_module.dart';
import 'menu_page.dart';
import 'windows/window_modules.dart';

/// desktop_multi_window relaunches this SAME entry point for every window it
/// opens (main window and every Window Designer window alike) - each gets
/// its own OS-level top-level window with its own independent Flutter
/// engine. `WindowController.fromCurrentEngine()` is how a relaunch finds
/// out which one it is: the main window always gets back an empty
/// `arguments` string, every other window gets back the JSON it was created
/// with in core/window_frame.dart's `openWindow()` (the Window Designer
/// window's id). That id is resolved against [windowModules] here so the
/// new window can size and title itself correctly BEFORE it is ever shown -
/// see `_WindowSizeCorrector` below for why sizing needs a second pass and
/// why the window stays hidden until then.
Future<void> main(List<String> args) async {
  WidgetsFlutterBinding.ensureInitialized();
  await windowManager.ensureInitialized();

  final windowController = await WindowController.fromCurrentEngine();
  if (windowController.arguments.isEmpty) {
    runApp(const WindowsApp());
    return;
  }

  final argument = jsonDecode(windowController.arguments) as Map<String, dynamic>;
  final moduleId = argument['window_id'] as String?;
  NavModule? module;
  for (final candidate in windowModules) {
    if (candidate.id == moduleId) {
      module = candidate;
      break;
    }
  }

  final options = WindowOptions(
    size: Size(module?.canvasWidth ?? 800, module?.canvasHeight ?? 600),
    center: true,
    title: module?.label ?? 'Window',
  );
  // Deliberately no show()/focus() here - `_WindowSizeCorrector` does that
  // once it has measured and corrected the real content size (see below).
  await windowManager.waitUntilReadyToShow(options);

  runApp(_WindowContentApp(module: module));
}

class WindowsApp extends StatelessWidget {
  const WindowsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Windows',
      theme: ThemeData(colorSchemeSeed: Colors.blue, useMaterial3: true),
      home: const MenuPage(),
    );
  }
}

/// Hosts one Window Designer window's content as its own real OS window -
/// native title bar and all (draggable, resizable, minimizable,
/// maximizable, closable, all for free from the OS - no custom chrome
/// needed). [module] was already resolved above, before this window was
/// ever shown.
///
/// The body hands its content widget directly to `Builder` with no
/// scrollable wrapper in between - a `SingleChildScrollView` gives its
/// child UNBOUNDED constraints along the scroll axis, which would make the
/// content's own `LayoutBuilder` (see `windows/<name>_page.dart`) unable to
/// see the window's actual live size, breaking anchored controls' resize
/// tracking. Scaffold's body constraints are already bounded to the real
/// window's client area, which is exactly what that LayoutBuilder needs.
class _WindowContentApp extends StatelessWidget {
  const _WindowContentApp({required this.module});

  final NavModule? module;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: ThemeData(colorSchemeSeed: Colors.blue, useMaterial3: true),
      home: Scaffold(
        body: module == null
            ? const Center(child: Text('Unknown window'))
            : _WindowSizeCorrector(module: module!, child: Builder(builder: module!.builder)),
      ),
    );
  }
}

/// Corrects the OS window's size once, right after its first real layout
/// pass, then shows it.
///
/// window_manager's `WindowOptions.size` sets the WHOLE native window rect
/// (title bar included - on Windows it goes straight to a raw Win32
/// `SetWindowPos` on the window rect, not the client rect), so requesting
/// exactly canvasWidth x canvasHeight leaves the actual Flutter content
/// area shorter by the title bar's height. That height isn't a constant
/// this code can just know upfront - it depends on the OS theme/DPI - so
/// instead of guessing a fixed offset, this measures the REAL content size
/// after the first frame and grows the window by whatever the shortfall
/// turns out to be. Correct on any Windows theme/DPI setting, and a no-op
/// on a platform where `size:` already means the content area.
class _WindowSizeCorrector extends StatefulWidget {
  const _WindowSizeCorrector({required this.module, required this.child});

  final NavModule module;
  final Widget child;

  @override
  State<_WindowSizeCorrector> createState() => _WindowSizeCorrectorState();
}

class _WindowSizeCorrectorState extends State<_WindowSizeCorrector> {
  bool _corrected = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _correctSizeThenShow());
  }

  Future<void> _correctSizeThenShow() async {
    if (_corrected) return;
    _corrected = true;

    final measured = MediaQuery.sizeOf(context);
    final deficitWidth = widget.module.canvasWidth - measured.width;
    final deficitHeight = widget.module.canvasHeight - measured.height;
    if (deficitWidth.abs() > 0.5 || deficitHeight.abs() > 0.5) {
      await windowManager.setSize(
        Size(widget.module.canvasWidth + deficitWidth, widget.module.canvasHeight + deficitHeight),
      );
    }
    await windowManager.show();
    await windowManager.focus();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
