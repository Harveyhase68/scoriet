import 'dart:convert';

import 'package:desktop_multi_window/desktop_multi_window.dart';
import 'package:flutter/material.dart';
import 'package:window_manager/window_manager.dart';

import 'core/app_globals.dart';
import 'core/app_structs.dart';
import 'core/nav_module.dart';
import 'core/sml_runtime/global_sync.dart';
import 'core/sml_runtime/project_init_queue.dart';
import 'core/sml_runtime/sml_db_config.dart';
import 'core/sml_runtime/lib_db.dart';
// A REAL, literal .ini file (INIRead/INIWrite) - bare WinDev builtins, not a
// dotted namespace, so requiredSmlLibraries()'s scan can never gate this the
// way the block below gates everything else - always imported instead,
// exactly like app_globals.dart/app_structs.dart above (small,
// dependency-free, no real cost either way).
import 'core/sml_runtime/lib_ini.dart';
{:if uses_str:}
import 'core/sml_runtime/lib_str.dart';
{:endif:}
{:if uses_num:}
import 'core/sml_runtime/lib_num.dart';
{:endif:}
{:if uses_arr:}
import 'core/sml_runtime/lib_arr.dart';
{:endif:}
{:if uses_dt:}
import 'core/sml_runtime/lib_dt.dart';
{:endif:}
{:if uses_crypt:}
import 'core/sml_runtime/lib_crypt.dart';
{:endif:}
{:if uses_log:}
import 'core/sml_runtime/lib_log.dart';
{:endif:}
{:if uses_json:}
import 'core/sml_runtime/lib_json.dart';
{:endif:}
{:if uses_i18n:}
import 'core/sml_runtime/lib_i18n.dart';
{:endif:}
{:if uses_sys:}
import 'core/sml_runtime/lib_sys.dart';
{:endif:}
{:if uses_http:}
import 'core/sml_runtime/lib_http.dart';
{:endif:}
{:if uses_file:}
import 'core/sml_runtime/lib_file.dart';
{:endif:}
{:if uses_sql:}
import 'core/sml_runtime/lib_sql.dart';
{:endif:}
{:if uses_draw:}
import 'core/sml_runtime/lib_draw.dart';
{:endif:}
{:if uses_ftp:}
import 'core/sml_runtime/lib_ftp.dart';
{:endif:}
{:if uses_sock:}
import 'core/sml_runtime/lib_sock.dart';
{:endif:}
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

  // Registers THIS window's own incoming-message handler (see
  // GlobalSync's own doc comment for the full protocol) BEFORE any local
  // global default/init computation below runs, so another already-open
  // window can reach us to ask for our state (or tell us about a change)
  // from the earliest possible moment.
  await GlobalSync.registerHandler();

  // Every global's real SML default-value expression (`AppGlobals.init()`,
  // e.g. `gsServer` defaulting to `sys.load_setting(...)`) runs BEFORE the
  // project's own init event below - same "declare with a default, then
  // let init code override" order real WinDev itself uses.
  await AppGlobals.init();

  // Project initialization code (the Window Designer's own project-level
  // "init" event, `ui_project_events` - see AppGlobals for the fields it
  // assigns into) - runs UNCONDITIONALLY here, before either branch below,
  // for the exact same reason the SmlDb connection right after it does:
  // every window is its OWN separate Flutter engine (see this function's
  // own doc comment), so a global like `AppGlobals.gsIni` needs to be
  // (re)established fresh in EVERY engine that starts, not just a single
  // "main" one - there is no shared process memory to set it once and have
  // every window see it. `main()` is already `async`, so no extra
  // `Future`/`async` wrapping is needed here regardless of whether this
  // code itself awaits anything.
  {:if project.init_dart_code:}
{:project.init_dart_code:}
  {:endif:}

  // NOW that every LOCAL default/init computation above has finished, ask
  // any already-open window for its own CURRENT state and adopt it (a real
  // running window's live values - which may reflect actual runtime
  // changes no `.ini` file/default expression would ever reproduce - win
  // over this window's own freshly-computed first guess). Also flips
  // GlobalSync into broadcasting every FUTURE change to every other open
  // window, from this point on. See GlobalSync's own doc comment for why
  // this specific ordering (register -> compute locally -> sync -> start
  // broadcasting) matters.
  await GlobalSync.syncFromPeers();

  // Connect `db.*`/`sql.*` to the SAME database the Scoriet project itself
  // is configured for (see sml_db_config.dart) - every window opens as its
  // OWN Flutter engine (see this function's own doc comment above), so
  // every single relaunch of `main()` needs its own connection; there is
  // no shared engine to piggy-back on. A failed connection does not stop
  // the app from starting - most windows never call `db.*`/`sql.*` at all
  // (this project is REST-based, `http.*` is the real workhorse), so one
  // unreachable database shouldn't block every other window from opening.
  // Never silently swallowed either - see the debugPrint below.
  //
  // KNOWN SIMPLIFICATION: the connection string literals below are plain
  // text-substituted from the project's own settings with no escaping -
  // safe for every real value seen so far, but a password containing a
  // literal `'` would break this generated file. Revisit if that ever
  // happens for real (see lib_db.dart's own "never guess, wait for real
  // data" principle).
  try {
    await SmlDb.connectProject(const SmlDbConfig(
      type: '{:projectdbtype:}',
      host: '{:projectdbserver:}',
      port: {:projectdbport:},
      database: '{:projectdatabase:}',
      username: '{:projectdbusername:}',
      password: '{:projectdbpassword:}',
    ));
  } catch (error) {
    debugPrint('SmlDb.connectProject failed - db.*/sql.* calls will throw until this is fixed: $error');
  }

  await windowManager.ensureInitialized();

  final windowController = await WindowController.fromCurrentEngine();

  NavModule? module;
  if (windowController.arguments.isEmpty) {
    // The primary engine IS the app's own startup window now - there is no
    // separate menu/demo screen to fall back to. Resolves to whichever
    // window the Window Designer's "Set first project window" action
    // marked (`firstWindowId`, from `UiWindow.is_first_window`); when the
    // project has exactly one window, that one is used automatically even
    // if nothing was ever explicitly marked - the only sane choice when
    // there is nothing else to pick from. A project with several windows
    // and none marked falls through with `module` left `null`, which
    // `_WindowContentApp` already renders as an honest "Unknown window"
    // placeholder instead of guessing - see its own doc comment.
    final startupId = firstWindowId ?? (windowModules.length == 1 ? windowModules.first.id : null);
    for (final candidate in windowModules) {
      if (candidate.id == startupId) {
        module = candidate;
        break;
      }
    }
  } else {
    final argument = jsonDecode(windowController.arguments) as Map<String, dynamic>;
    final moduleId = argument['window_id'] as String?;
    for (final candidate in windowModules) {
      if (candidate.id == moduleId) {
        module = candidate;
        break;
      }
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
