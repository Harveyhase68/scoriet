import 'package:flutter/material.dart';

import '../../features/auth/auth_gate.dart';
import 'app_shell.dart';
import 'db_bootstrap_gate.dart';
import 'nav_module.dart';

/// The single, fixed startup composition root.
///
/// SCORIET: static file. `app.dart` always points `home:` at this widget and
/// never has to change again when a new startup check is added — new gates
/// are slotted in right here, in order, instead of each gate patching
/// `app.dart`'s `home:` directly (which is what happens when two gates are
/// added independently and both try to own it).
///
/// Order matters: outer gates run first. Database bootstrap runs before auth
/// — a login can't be checked against a database that doesn't exist yet.
class StartupGate extends StatelessWidget {
  const StartupGate({super.key, required this.modules});

  final List<NavModule> modules;

  @override
  Widget build(BuildContext context) {
    return DbBootstrapGate(
      child: AuthGate(
        child: AppShell(modules: modules),
      ),
    );
  }
}
