import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../db/database.dart';
import '../db/db_bootstrap.dart';
import '../db/db_config.dart';
import '../i18n/locale_provider.dart';

enum _BootstrapState { checking, ready, creating, error }

/// SCORIET: static file — shown before [child]. If the configured database
/// doesn't exist yet, offers to create it (every table + foreign key from
/// the schema) instead of just failing with a raw connection error.
///
/// Takes a [child] rather than building a specific widget (e.g. `AppShell`)
/// itself, so it stays a self-contained, reusable gate — see [StartupGate]
/// for where gates are composed in order.
class DbBootstrapGate extends ConsumerStatefulWidget {
  const DbBootstrapGate({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<DbBootstrapGate> createState() => _DbBootstrapGateState();
}

class _DbBootstrapGateState extends ConsumerState<DbBootstrapGate> {
  _BootstrapState _state = _BootstrapState.checking;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    setState(() => _state = _BootstrapState.checking);
    final config = ref.read(dbConfigProvider);
    try {
      final exists = await databaseExists(config);
      if (!mounted) return;
      if (exists) {
        setState(() => _state = _BootstrapState.ready);
      } else {
        // Stay on the checking/spinner state behind the dialog; the dialog's
        // own choice (create / continue anyway / quit) decides the next state.
        await _promptCreate(config);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _state = _BootstrapState.error;
        _errorMessage = '$e';
      });
    }
  }

  Future<void> _promptCreate(DbConfig config) async {
    final content = s(ref, 'db_not_found_content')
        .replaceFirst('{db}', config.database)
        .replaceFirst('{host}', config.host);
    final choice = await showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Text(s(ref, 'db_not_found_title')),
        content: Text(content),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, 'quit'),
            child: Text(s(ref, 'quit_app')),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, 'no'),
            child: Text(s(ref, 'no')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, 'yes'),
            child: Text(s(ref, 'yes')),
          ),
        ],
      ),
    );

    if (!mounted) return;
    switch (choice) {
      case 'yes':
        await _createDatabase(config);
        break;
      case 'no':
        // User declined — proceed anyway; every screen already handles a
        // missing/unreachable database gracefully (error view + retry).
        setState(() => _state = _BootstrapState.ready);
        break;
      case 'quit':
      default:
        SystemNavigator.pop();
        break;
    }
  }

  Future<void> _createDatabase(DbConfig config) async {
    setState(() => _state = _BootstrapState.creating);
    try {
      await createDatabaseAndSchema(config);
      if (!mounted) return;
      setState(() => _state = _BootstrapState.ready);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _state = _BootstrapState.error;
        _errorMessage = '$e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    switch (_state) {
      case _BootstrapState.ready:
        return widget.child;
      case _BootstrapState.creating:
        return _StatusScaffold(
          message: s(ref, 'db_creating'),
          showProgress: true,
        );
      case _BootstrapState.error:
        return _StatusScaffold(
          message: '${s(ref, 'db_connection_failed_prefix')}$_errorMessage',
          showProgress: false,
          onRetry: _check,
        );
      case _BootstrapState.checking:
        return _StatusScaffold(
          message: s(ref, 'db_checking_connection'),
          showProgress: true,
        );
    }
  }
}

class _StatusScaffold extends ConsumerWidget {
  const _StatusScaffold({
    required this.message,
    required this.showProgress,
    this.onRetry,
  });

  final String message;
  final bool showProgress;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (showProgress) const CircularProgressIndicator(),
            if (showProgress) const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(message, textAlign: TextAlign.center),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: Text(s(ref, 'retry')),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
