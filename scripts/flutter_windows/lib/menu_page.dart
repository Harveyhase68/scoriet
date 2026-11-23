import 'package:flutter/material.dart';

import 'core/window_frame.dart';
import 'windows/window_modules.dart';

/// Lists every Window Designer window as a tappable entry. This is the
/// app's permanent home screen and its own OS window - it never navigates
/// away. Tapping an entry opens that window as its own separate, real OS
/// window (see core/window_frame.dart's `openWindow()`), sized to the
/// window's real design-time canvas size, with native title bar chrome -
/// draggable, resizable, minimizable, maximizable, and closable on its own,
/// independent of this menu window.
class MenuPage extends StatelessWidget {
  const MenuPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('{:dartstring(projectcaption):}')),
      body: windowModules.isEmpty
          ? const Center(child: Text('No windows yet.'))
          : ListView.separated(
              itemCount: windowModules.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final module = windowModules[index];
                return ListTile(
                  leading: Icon(module.icon),
                  title: Text(module.label),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    openWindow(module.id);
                  },
                );
              },
            ),
    );
  }
}
