import 'package:flutter/material.dart';

import '../../core/ui/nav_module.dart';
import 'ui/{:filesingularlower:}_list_page.dart';

/// SCORIET: every generated entity exports one `<entity>Module`. It is the
/// single line that gets added to `app_modules.dart`.
final {:filecamelcase:}Module = NavModule(
  id: '{:filename:}',
  label: '{:filepascalcase:}',
  icon: Icons.table_rows_outlined,
  builder: (_) => const {:filesingularpascalcase:}ListPage(),
);
