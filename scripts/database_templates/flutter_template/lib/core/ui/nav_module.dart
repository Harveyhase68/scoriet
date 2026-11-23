import 'package:flutter/material.dart';

/// A top-level entity module shown in the navigation rail.
///
/// SCORIET: every generated entity feature exposes exactly one `NavModule`
/// and registers it in `app_modules.dart`. Adding a table = adding one
/// entry to that list.
class NavModule {
  const NavModule({
    required this.id,
    required this.label,
    required this.icon,
    required this.builder,
  });

  /// Stable identifier, usually the table name.
  final String id;

  /// Human-readable label shown in the rail.
  final String label;

  final IconData icon;

  /// Builds the module's landing page (typically the list/grid).
  final WidgetBuilder builder;
}
