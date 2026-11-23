import 'package:flutter/material.dart';

/// One item in a window's own menu bar (WinDev's `ui { menu "_Menu" {
/// menu_item ... } }` / the Window Designer's UiWindowMenu), used by
/// [buildSmlMenuBar] below. A submenu (children.isNotEmpty) has no
/// [onSelect] of its own - WinDev menus follow the same convention every
/// desktop menu does, a parent entry only opens its children, it never
/// ALSO runs an action. The whole tree is generated as a plain Dart
/// literal per window (see UltimateTemplateController::menuBarDartLiteral())
/// - arbitrary depth is handled by real Dart recursion below, not by the
/// text template (which can't express an unbounded nested loop).
class SmlMenuBarItem {
  final String caption;
  final VoidCallback? onSelect;
  final List<SmlMenuBarItem> children;

  const SmlMenuBarItem({
    required this.caption,
    this.onSelect,
    this.children = const [],
  });
}

/// A real Flutter Material menu bar (MenuBar/SubmenuButton/MenuItemButton -
/// the same nested-flyout mechanics any native desktop app menu has,
/// arbitrary depth supported natively by these widgets) built from a
/// window's own [SmlMenuBarItem] tree.
Widget buildSmlMenuBar(List<SmlMenuBarItem> items) {
  return MenuBar(children: items.map(_buildMenuBarItem).toList());
}

Widget _buildMenuBarItem(SmlMenuBarItem item) {
  // MenuAcceleratorLabel is Flutter's own built-in widget for exactly
  // WinDev/VB6/Win32's "&"-prefixed mnemonic convention: it parses the '&'
  // itself and renders the following character underlined (only while
  // Alt is held, matching real desktop menu behaviour), rather than
  // showing the literal '&'. No text munging needed on the SML/gtree side
  // - the caption already arrives with WinDev's own '&' markers intact.
  if (item.children.isNotEmpty) {
    return SubmenuButton(
      menuChildren: item.children.map(_buildMenuBarItem).toList(),
      child: MenuAcceleratorLabel(item.caption),
    );
  }
  return MenuItemButton(onPressed: item.onSelect, child: MenuAcceleratorLabel(item.caption));
}
