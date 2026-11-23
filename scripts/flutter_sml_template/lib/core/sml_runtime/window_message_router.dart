import 'package:flutter/services.dart';
import 'package:desktop_multi_window/desktop_multi_window.dart';

/// The ONE per-window incoming-message dispatcher every engine registers.
///
/// `desktop_multi_window`'s `WindowController.setWindowMethodHandler` only
/// accepts ONE handler per window - calling it a second time (from a
/// second, independent feature) would silently REPLACE the first
/// registration rather than add a second listener. [GlobalSync] (variable
/// sync) and [WindowModalSignal] (`Open()`'s "the window I opened just
/// closed" signal) both need to receive cross-window messages in the SAME
/// window - this class is the ONE shared registration point both plug
/// into, keyed by method name, so neither can ever clobber the other's
/// handler.
class WindowMessageRouter {
  WindowMessageRouter._();

  static final Map<String, Future<dynamic> Function(MethodCall call)> _handlers = {};
  static bool _registered = false;

  /// Registers `handler` to run whenever an incoming call's `call.method`
  /// equals `method` - call once per method name, from whichever feature
  /// owns it. Idempotent about the underlying `setWindowMethodHandler`
  /// registration itself (only ever calls it once, the first time ANY
  /// feature registers) - safe to call from multiple independent features'
  /// own setup code in any order.
  static Future<void> registerHandler(
    String method,
    Future<dynamic> Function(MethodCall call) handler,
  ) async {
    _handlers[method] = handler;
    if (_registered) return;
    _registered = true;
    final self = await WindowController.fromCurrentEngine();
    await self.setWindowMethodHandler(_dispatch);
  }

  static Future<dynamic> _dispatch(MethodCall call) async {
    final handler = _handlers[call.method];
    if (handler == null) return null;
    return handler(call);
  }
}
