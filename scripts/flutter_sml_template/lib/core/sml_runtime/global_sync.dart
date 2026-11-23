import 'dart:async';
import 'package:flutter/services.dart';
import 'package:desktop_multi_window/desktop_multi_window.dart';
import 'window_message_router.dart';

/// Cross-window synchronization for [AppGlobals] (`app_globals.dart`).
///
/// Real WinDev keeps ONE process for the whole app - a project global is
/// genuinely shared, for the app's entire lifetime, across every window.
/// This template's own windows are each a SEPARATE Flutter engine/OS
/// process (`core/window_frame.dart`'s `openWindow()`, via
/// `desktop_multi_window`) - a plain `static` field is only "global" within
/// ONE window's own process, not the whole app, which silently breaks any
/// SML code that expects a global set in one window to still be there after
/// that window is closed and reopened, or visible to a DIFFERENT window
/// already open at the same time. Confirmed real (2026-09-02): a project's
/// own init code reads/writes `gsDB_IP` from an `.ini` file, and a window's
/// own button click also reads/writes it - neither ever saw the other's
/// value once they were running in different windows.
///
/// This class is the ONE place that problem is solved, generically, for
/// EVERY global - `app_globals.dart`'s own per-field getter/setter pair is
/// template-generated (a mechanical loop over the project's declared
/// globals), never hand-written per variable; the actual sync PROTOCOL
/// below never changes no matter how many globals a project declares.
///
/// Protocol (a full mesh - no designated "hub" window):
///  - [registerHandler] - call once, EARLY in `main()`, before any local
///    default/init computation runs. Registers through
///    [WindowMessageRouter] (this window's own shared per-window message
///    dispatcher - see its own doc comment for why a shared router exists
///    at all) to receive two kinds of incoming calls:
///    `globalSet` (another window changed a value - apply it locally) and
///    `globalSnapshotRequest` (another window is starting up and wants
///    OUR current full state - reply with it). Writes made before
///    [syncFromPeers] runs are NOT broadcast (see [set]'s own doc comment
///    for why).
///  - Local default/init computation runs as normal (`AppGlobals.init()`,
///    the project's own init event, ...) - exactly as if this were the
///    only window, since at this point it might be.
///  - [syncFromPeers] - call once, AFTER all local computation above. Asks
///    every OTHER currently-open window (`WindowController.getAll()`) for
///    its own current snapshot, one at a time, and adopts the FIRST one
///    that actually answers - an already-running window's live state
///    (which may include real runtime changes no `.ini` file/default
///    expression would ever reproduce) wins over this window's own
///    freshly-computed local guess. If nobody answers (this is the only
///    window open), the local computation stands as-is. Also flips
///    [set] into broadcasting mode from this point on.
///
/// Known limitation, accepted rather than engineered around: two windows
/// opening at the exact same moment could each see the other as a "peer"
/// before either has finished its own local computation, pulling
/// incomplete state from one another. Rare in the real, one-window-at-a-
/// time-via-menu usage this template targets - not worth a full
/// distributed-consensus protocol for.
class GlobalSync {
  GlobalSync._();

  static final Map<String, dynamic> _values = {};
  static String? _selfId;
  static bool _broadcastEnabled = false;

  /// Call once, EARLY in `main()` - see the class doc comment for the full
  /// ordering this fits into. Registers through [WindowMessageRouter] (NOT
  /// `WindowController.setWindowMethodHandler` directly) - that channel
  /// only accepts one handler per window, and [WindowModalSignal] (`Open()`'s
  /// close signal) needs its OWN slot in the SAME window.
  static Future<void> registerHandler() async {
    final self = await WindowController.fromCurrentEngine();
    _selfId = self.windowId;
    await WindowMessageRouter.registerHandler('globalSet', _handleGlobalSet);
    await WindowMessageRouter.registerHandler('globalSnapshotRequest', _handleSnapshotRequest);
  }

  /// Call once, AFTER local default/init computation has already run - see
  /// the class doc comment.
  static Future<void> syncFromPeers() async {
    final peers = await WindowController.getAll();
    for (final peer in peers) {
      if (peer.windowId == _selfId) continue;
      try {
        final snapshot = await WindowController.fromWindowId(peer.windowId)
            .invokeMethod<Map>('globalSnapshotRequest');
        if (snapshot != null) {
          _values.addAll(Map<String, dynamic>.from(snapshot));
        }
        break; // one answering peer's live state is authoritative enough
      } on PlatformException {
        continue; // that peer closed/never registered - try the next one
      }
    }
    _broadcastEnabled = true;
  }

  /// `AppGlobals`'s own getter wrappers call this - never used directly by
  /// generated SML code.
  static T get<T>(String name, T defaultValue) =>
      _values.containsKey(name) ? _values[name] as T : defaultValue;

  /// `AppGlobals`'s own setter wrappers call this - never used directly by
  /// generated SML code. Updates the LOCAL cache synchronously (every
  /// existing SML-generated read of `AppGlobals.<name>` stays a plain,
  /// synchronous property access - no `await` ripple through the whole
  /// translator) and, once [syncFromPeers] has run, fires the broadcast to
  /// every other open window in the background (never awaited here - a
  /// slow/unreachable peer must never make an ordinary global assignment
  /// block). Before [syncFromPeers] runs, a write only updates the local
  /// cache - broadcasting a not-yet-reconciled startup value could
  /// overwrite an already-running peer's genuinely current state with this
  /// window's own stale first guess.
  static void set<T>(String name, T value) {
    _values[name] = value;
    if (_broadcastEnabled) {
      unawaited(_broadcast(name, value));
    }
  }

  static Future<void> _broadcast(String name, dynamic value) async {
    final peers = await WindowController.getAll();
    for (final peer in peers) {
      if (peer.windowId == _selfId) continue;
      try {
        await WindowController.fromWindowId(peer.windowId)
            .invokeMethod('globalSet', {'name': name, 'value': value});
      } on PlatformException {
        // That peer closed between getAll() and invokeMethod() - an
        // inherently racy snapshot, not a real error.
      }
    }
  }

  static Future<dynamic> _handleGlobalSet(MethodCall call) async {
    final args = call.arguments as Map;
    _values[args['name'] as String] = args['value'];
    return null;
  }

  static Future<dynamic> _handleSnapshotRequest(MethodCall call) async {
    return Map<String, dynamic>.from(_values);
  }
}
