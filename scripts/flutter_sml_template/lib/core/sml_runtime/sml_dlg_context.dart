import 'package:flutter/material.dart';
import 'sml_window_context.dart';

/// `dlg.*` (see supported.md's `dlg` namespace, `lib_dialog`) - dialog boxes
/// need a live BuildContext, so this is a method group on SmlWindowContext
/// rather than a stateless static class.
///
/// WinDev's Info/Error/Warning/YesNo/OKCancel/Confirm all BLOCK execution
/// until the user dismisses them - the generator always awaits these (see
/// sml_to_dart.js's ASYNC_FUNCTIONS), matching that blocking semantics as
/// closely as Flutter's own dialog model allows.
class SmlDlgContext {
  final SmlWindowContext _ctx;
  const SmlDlgContext(this._ctx);

  /// `Info(message[, detail])` - confirmed real with an optional second
  /// argument (154 occurrences project-wide), same shape as `Error` below -
  /// appended on its own line when present, rather than silently dropped.
  Future<void> info(String message, [dynamic detail]) =>
      _showMessageDialog('Information', detail != null ? '$message\n$detail' : message);

  /// `Error(message[, detail])` - confirmed real with an optional second
  /// argument (this project's own generic error handler passes
  /// `SmlSys.errorInfo(...)` alongside a fixed message) - appended on its
  /// own line when present, rather than silently dropped.
  Future<void> error(String message, [dynamic detail]) =>
      _showMessageDialog('Error', detail != null ? '$message\n$detail' : message);

  Future<void> warning(String message) => _showMessageDialog('Warning', message);

  Future<void> _showMessageDialog(String title, String message) {
    return showDialog<void>(
      context: _ctx.context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('OK'))],
      ),
    );
  }

  /// `YesNo([bDefaultButton, ]message)` - confirmed real with an optional
  /// LEADING boolean argument selecting the default button (52 two-arg call
  /// sites in this project's own corpus, e.g. `dlg.yesNo(false, "Do you
  /// want to delete the record?")`) - accepted for real call-site
  /// compatibility but not modeled (Dart's AlertDialog has no notion of a
  /// keyboard-focused default action), a cosmetic difference only. Detected
  /// by arity, not type: when a second argument is given, the first is
  /// always the default-button flag and the second the real message -
  /// WinDev's own argument order at every real 2-arg call site here.
  Future<bool> yesNo(dynamic messageOrDefaultButton, [String? message]) async {
    final resolvedMessage = message ?? messageOrDefaultButton as String;
    final result = await showDialog<bool>(
      context: _ctx.context,
      builder: (context) => AlertDialog(
        content: Text(resolvedMessage),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('No')),
          TextButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Yes')),
        ],
      ),
    );
    return result ?? false;
  }

  Future<bool> okCancel(String message) async {
    final result = await showDialog<bool>(
      context: _ctx.context,
      builder: (context) => AlertDialog(
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('OK')),
        ],
      ),
    );
    return result ?? false;
  }

  Future<bool> confirm(String message) => okCancel(message);

  /// `ToastDisplay` -> a transient SnackBar, closest Flutter equivalent.
  Future<void> toast(String message) async {
    final messenger = ScaffoldMessenger.maybeOf(_ctx.context);
    messenger?.showSnackBar(SnackBar(content: Text(message)));
  }

  /// `Dialog` (a custom WinDev dialog window) - which window/layout to open
  /// is project-specific and not something this generic runtime can infer;
  /// honest TODO rather than a guess.
  Future<dynamic> custom(String windowName) async {
    // TODO: dlg.custom - opening a custom dialog window is project-specific,
    // wire this to the actual generated window once identified.
    return null;
  }
}
