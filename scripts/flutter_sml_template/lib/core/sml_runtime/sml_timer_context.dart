import 'dart:async';
import 'sml_window_context.dart';

/// `timer.*` (see supported.md's `timer` namespace, `lib_timer`) - built on
/// Dart's own real `Timer`/`Timer.periodic`.
///
/// Real corpus usage confirms `timer.start`'s SML shape is `(procedure,
/// delayMs)` -> an int handle (`set n = timer.start(CheckErrorLog, 500)`),
/// later passed to `timer.stop(n)` - NOT a name-keyed API. sml_to_dart.js's
/// translateExpr() resolves a STRING-named first argument
/// (`timer.start("CountDown", 100, 1)` - WinDev's own `Timer(name, delay)`
/// idiom, where the timer's name matches the procedure it calls each tick)
/// back to that same real procedure reference at translate time, so this
/// class only ever sees the callback form - never a name string.
class SmlTimerContext {
  final SmlWindowContext _ctx;
  const SmlTimerContext(this._ctx);

  /// Starts a one-shot or repeating timer, returning a fresh handle for
  /// `stop()`. `callback` may be sync or async (a translated SML procedure
  /// is often `Future<T> Function()`) - its return value is always
  /// discarded, matching a real Timer tick's fire-and-forget semantics.
  int start(FutureOr<void> Function() callback, int delayMs, {bool repeat = false}) {
    final id = _ctx.nextTimerId++;
    final duration = Duration(milliseconds: delayMs);
    _ctx.timers[id.toString()] =
        repeat ? Timer.periodic(duration, (_) => callback()) : Timer(duration, callback);
    return id;
  }

  void stop(int id) {
    _ctx.timers.remove(id.toString())?.cancel();
  }
}
