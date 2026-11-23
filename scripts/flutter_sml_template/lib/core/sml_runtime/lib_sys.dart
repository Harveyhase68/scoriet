import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// `sys.*` (see supported.md's `sys` namespace, `lib_sys`) - runtime,
/// environment, settings, exceptions. A mix of pure/stateless functions
/// (platform checks) and real persistence (settings, via
/// `shared_preferences` - the closest portable equivalent to WinDev's
/// `LoadParameter`/`SaveParameter` .ini-style storage).
///
/// `call_native`/`address_of` (Win32 DLL calls) are deliberately NOT
/// implemented - supported.md's own "What is deliberately not mapped"
/// table lists these as having no portable meaning, so this runtime
/// matches that decision rather than fabricating a fake implementation.
class SmlSys {
  const SmlSys._();

  static Future<SharedPreferences> get _prefs => SharedPreferences.getInstance();

  static Future<String> loadSetting(String key, String defaultValue) async {
    final prefs = await _prefs;
    return prefs.getString(key) ?? defaultValue;
  }

  static Future<void> saveSetting(String key, String value) async {
    final prefs = await _prefs;
    await prefs.setString(key, value);
  }

  static Future<void> deleteSetting(String key) async {
    final prefs = await _prefs;
    await prefs.remove(key);
  }

  static String appInfo() => Platform.operatingSystem;

  static Map<String, String> environment() => Platform.environment;

  /// `ErrorInfo(detailFlag)` - confirmed real called with ONE argument, a
  /// detail-level selector (`errMessage`/`errFullDetails` - see
  /// sml_constants.dart), from inside a `catch` block - WinDev's own
  /// `ErrorInfo()` reads an IMPLICIT "last caught error" the language
  /// tracks globally, which this runtime does not model (Round-1 scope: no
  /// generated `catch` block currently records its caught value anywhere
  /// `ErrorInfo()` could read it back from) - accepts and ignores whichever
  /// flag/value is passed so every real call site compiles, returning a
  /// placeholder rather than guessing at error text this runtime has no way
  /// to recover.
  static String errorInfo([dynamic detailFlagOrError, String part = '']) =>
      detailFlagOrError?.toString() ?? '';

  static bool isTestMode() => kDebugMode;
  static bool is64Bit() => true; // every modern Flutter desktop/mobile target is 64-bit
  static bool isAndroid() => !kIsWeb && Platform.isAndroid;
  static bool isBrowser() => kIsWeb;
  static bool isIos() => !kIsWeb && Platform.isIOS;
  static bool isLinux() => !kIsWeb && Platform.isLinux;
  static bool isWindows() => !kIsWeb && Platform.isWindows;

  /// `LanceAppliAssociee`/`LaunchAppliAssociate` - opens a file/URL with the
  /// OS's own default handler. Implemented for Windows (this template's own
  /// target platform, see windows/runner/) via the `start` shell command;
  /// other platforms fall through to a TODO rather than guessing a command.
  static Future<void> openWithDefaultApp(String path) async {
    if (Platform.isWindows) {
      await Process.run('cmd', ['/c', 'start', '', path]);
      return;
    }
    if (Platform.isMacOS) {
      await Process.run('open', [path]);
      return;
    }
    if (Platform.isLinux) {
      await Process.run('xdg-open', [path]);
      return;
    }
    // TODO: sys.open_with_default_app - no launcher wired for this platform
  }

  /// `ExeRun` - runs an external command; returns its stdout.
  static Future<String> run(String command) async {
    final parts = command.split(' ');
    final result = await Process.run(parts.first, parts.skip(1).toList());
    return result.stdout.toString();
  }

  /// `ThreadPause` - a real, non-blocking delay (never `sleep()` from
  /// dart:io, which would freeze the whole isolate/UI thread).
  static Future<void> sleep(int milliseconds) => Future.delayed(Duration(milliseconds: milliseconds));

  /// `Multitask` - WinDev yields to its own message loop; Flutter's event
  /// loop already yields between frames on its own, so this is a real (if
  /// minimal) yield-a-tick rather than a true no-op, for the rare case
  /// where a tight WinDev loop genuinely depended on yielding control.
  /// `Multitask([nDuration])` - [nDuration] is a confirmed real optional
  /// argument (`sys.yield(-1)`, WinDev's "yield with no time limit") -
  /// accepted for real call-site compatibility but not differentiated
  /// (this runtime always yields exactly one event-loop tick, same as the
  /// zero-arg form - see the doc comment above).
  static Future<void> yield_([dynamic duration]) => Future.delayed(Duration.zero);

  static void raise(String message) => throw Exception(message);

  /// `ExceptionPropagate` - re-throwing the current error; the generator
  /// wires this to Dart's own `rethrow` directly inside a catch block
  /// rather than calling this function (rethrow is a statement, not an
  /// expression) - kept here only so a bare `sys.rethrow()` reference still
  /// compiles if the translator ever emits one outside that context.
  static Never rethrow_(Object error) => throw error;

  static void disableExceptions() {
    // TODO: sys.disable_exceptions - Dart has no global exception-handler arm/disarm switch
  }

  static void enableExceptions() {
    // TODO: sys.enable_exceptions - Dart has no global exception-handler arm/disarm switch
  }

  static void callNative(String library, String function, List<dynamic> args) {
    // Deliberately not implemented - see class doc comment.
    throw UnsupportedError('SmlSys.callNative: Windows API/DLL calls have no portable Dart equivalent');
  }

  /// `CallByName` - confirmed real as a 2-argument call (`procedureName`,
  /// a `trt*` trigger-type selector - see sml_constants.dart), NOT the
  /// "name + argument list" shape this might suggest at a glance; WinDev's
  /// own `CallByName` here simulates a UI EVENT (a click, a value change,
  /// ...) on the named control/procedure rather than invoking an arbitrary
  /// procedure with arguments. Calling a procedure by its runtime string
  /// name needs a real dispatch table this Round-1 scope doesn't build
  /// (same "no real usage shape to design the general case against" as
  /// [callNative]'s own TODO).
  static dynamic callByName(String procedureName, dynamic triggerType) {
    // TODO: sys.call_by_name - simulating a named control/procedure's event needs a dispatch table
    return null;
  }
}
