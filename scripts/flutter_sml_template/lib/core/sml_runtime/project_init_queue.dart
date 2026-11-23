import 'global_sync.dart';
import 'sml_window_context.dart';

/// Defers a window-scoped SML call (`dlg.info(...)`, `Message(...)`, any
/// `ui.*`/`win.*`/`rpt.*`/`timer.*` call) made from the PROJECT's own init
/// code (`ui_project_events`, event "init") until a real window/
/// [SmlWindowContext] exists.
///
/// Project init runs in `main()`, before `runApp()`, in EVERY engine (see
/// main.dart's own doc comment - every window is its own separate process,
/// so project init re-establishes globals fresh in each one) - there is no
/// live window/BuildContext at that point to show a dialog against or a
/// control to address. `sml_to_dart.js`'s translator detects a window-
/// scoped call specifically WHILE translating project init code (never for
/// ordinary window/procedure code, which already has a real `ctx`
/// unchanged) and rewrites it into a call to [add] instead of running it
/// immediately - confirmed real (`dlg.info("Bereits geladen: " +
/// AppGlobals.gsDB_IP)` in a real project's own init code).
///
/// Scope: only a window-scoped call used as its own STATEMENT (`call
/// dlg.info(...)`/bare `dlg.info(...)`) is deferred this way - a window-
/// scoped call's RETURN VALUE assigned into a variable inside project init
/// (`set x = dlg.yes_no(...)`) is NOT supported (no confirmed real case;
/// asking the user a yes/no question before any window has even opened
/// has no sensible "when does the answer actually arrive" semantics
/// anyway) and still compiles to the same `ctx`-undefined-style TODO any
/// other unhandled construct would.
class ProjectInitQueue {
  ProjectInitQueue._();

  /// A reserved [GlobalSync] key (double-underscore-wrapped so it can never
  /// collide with a real SML global - every real one is a plain WinDev-style
  /// identifier like `gsIni`/`gbDB_CS`, never shaped like this) tracking
  /// whether some window, in this app SESSION, already ran the queue - see
  /// [drain]'s own doc comment for why this can't just be a local `bool`.
  static const _drainedKey = '__ProjectInitQueue_drained__';

  static final List<Future<void> Function(SmlWindowContext ctx)> _pending = [];

  /// Called by the generated project-init translation - never by hand-
  /// written code.
  static void add(Future<void> Function(SmlWindowContext ctx) action) {
    _pending.add(action);
  }

  /// Call once, unconditionally, from EVERY window's own `_runWindowInit()`
  /// (see %1_page.dart).
  ///
  /// GOTCHA fixed 2026-09-03: a plain local `static bool _drained` here
  /// looked right but was WRONG - it only guards repeats WITHIN one
  /// process, and every window is its own separate Flutter engine/process
  /// (see main.dart's own doc comment), each running project init (and so
  /// re-queuing the SAME `dlg.info(...)`) completely independently. A local
  /// flag can never see that some OTHER window already drained its own
  /// copy of the queue - confirmed real: opening a second window showed the
  /// SAME "Bereits geladen: ..." dialog again. Fixed by tracking the
  /// "already drained" fact as an ordinary [GlobalSync] value instead of
  /// local process state - [GlobalSync.syncFromPeers] (already called,
  /// earlier in `main()`, before this window's own content ever builds)
  /// pulls this flag from any already-open peer the SAME way it pulls
  /// every real project global, so a SECOND (or fifth) window opened after
  /// the first one already learns "already shown" before it ever gets here
  /// - no new IPC/protocol needed, this reuses the exact one GlobalSync
  /// already has.
  static Future<void> drain(SmlWindowContext ctx) async {
    if (GlobalSync.get<bool>(_drainedKey, false)) {
      _pending.clear();
      return;
    }
    GlobalSync.set<bool>(_drainedKey, true);
    for (final action in _pending) {
      await action(ctx);
    }
    _pending.clear();
  }
}
