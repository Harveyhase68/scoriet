import 'package:flutter/material.dart';

import 'app_modules.dart';
import 'core/theme/app_theme.dart';
import 'core/ui/startup_gate.dart';

/// Root widget. SCORIET: static file.
///
/// `home:` always points at [StartupGate] — never at an individual gate
/// directly. New startup checks (auth, licensing, ...) are added inside
/// [StartupGate], not here.
class AppRoot extends StatelessWidget {
  const AppRoot({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '{:projectname:}',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      home: StartupGate(modules: appModules),
    );
  }
}
