import 'package:flutter/foundation.dart';

/// `log.*` (see supported.md's `log` namespace, `lib_log`) - tracing and
/// logging. Stateless, built on `debugPrint` (safe in release builds,
/// unlike a raw `print`, and won't get truncated on Android's log buffer).
class SmlLog {
  const SmlLog._();

  static void trace(Object? message) => debugPrint('[TRACE] $message');
  static void info(Object? message) => debugPrint('[INFO] $message');
  static void error(Object? message) => debugPrint('[ERROR] $message');

  /// `dbgAssert` - logs rather than halting execution (WinDev's own debug
  /// assert is a development-time aid, not meant to crash a shipped app).
  static void assertLog(bool condition, Object? message) {
    if (!condition) {
      debugPrint('[ASSERT FAILED] $message');
    }
  }
}
