import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/state/auth_providers.dart';
import '../../features/auth/ui/profile_page.dart';
import '../db/database.dart';
import '../i18n/locale_provider.dart';
import 'menu_tree.dart';
import 'nav_module.dart';

/// The main desktop window: a persistent navigation rail on the left and the
/// selected module's page on the right, plus a DB status bar at the bottom.
///
/// SCORIET: static file — the shell iterates the module list; it never needs
/// to change when a new entity is generated.
class AppShell extends ConsumerStatefulWidget {
  const AppShell({super.key, required this.modules});

  final List<NavModule> modules;

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  late String _selectedId =
      widget.modules.isNotEmpty ? widget.modules.first.id : '';

  @override
  Widget build(BuildContext context) {
    final modules = widget.modules;
    final current = modules.firstWhere(
      (m) => m.id == _selectedId,
      orElse: () => modules.first,
    );

    return Scaffold(
      body: Row(
        children: [
          _SideNav(
            selectedId: _selectedId,
            onSelected: (id) => setState(() => _selectedId = id),
          ),
          const VerticalDivider(width: 1),
          Expanded(
            child: KeyedSubtree(
              key: ValueKey(current.id),
              child: Builder(builder: current.builder),
            ),
          ),
        ],
      ),
      bottomNavigationBar: const _DbStatusBar(),
    );
  }
}

/// The left-hand navigation list.
///
/// SCORIET: static file. Renders [kMenuTree] — either the project's own Main
/// Menu (nested groups from the Form Menu Editor) or, when none is
/// configured, a flat entry per generated table. A plain scrollable
/// [ListView] rather than Flutter's built-in [NavigationRail]: with
/// dozens/hundreds of tables a rail's stacked icon-over-label destinations
/// run out of vertical space after a handful of entries and don't scroll on
/// their own.
///
/// Only one branch per level stays expanded at a time (opening a sibling
/// collapses the previous one) — keeps deep/wide menus from growing without
/// bound vertically.
class _SideNav extends ConsumerStatefulWidget {
  const _SideNav({required this.selectedId, required this.onSelected});

  final String selectedId;
  final ValueChanged<String> onSelected;

  static const _width = 260.0;

  @override
  ConsumerState<_SideNav> createState() => _SideNavState();
}

class _SideNavState extends ConsumerState<_SideNav> {
  final Set<MenuNode> _expanded = {};

  @override
  void initState() {
    super.initState();
    final ancestors = _findAncestors(kMenuTree, widget.selectedId, const []);
    if (ancestors != null) _expanded.addAll(ancestors);
  }

  List<MenuNode>? _findAncestors(
    List<MenuNode> nodes,
    String tableName,
    List<MenuNode> trail,
  ) {
    for (final node in nodes) {
      if (node.tableName == tableName) return trail;
      if (node.isGroup) {
        final found = _findAncestors(node.children, tableName, [
          ...trail,
          node,
        ]);
        if (found != null) return found;
      }
    }
    return null;
  }

  void _toggle(MenuNode node, List<MenuNode> siblings) {
    setState(() {
      final wasOpen = _expanded.contains(node);
      _expanded.removeWhere(siblings.contains);
      if (!wasOpen) _expanded.add(node);
    });
  }

  List<Widget> _buildNodes(
    BuildContext context,
    List<MenuNode> nodes,
    int depth,
  ) {
    final theme = Theme.of(context);
    final widgets = <Widget>[];
    for (final node in nodes) {
      if (!node.isGroup && node.tableName == null) {
        widgets.add(const Divider(height: 1));
        continue;
      }
      final padding = EdgeInsets.only(left: 16.0 + depth * 16, right: 16);
      if (node.isGroup) {
        final open = _expanded.contains(node);
        widgets.add(
          ListTile(
            dense: true,
            contentPadding: padding,
            leading: Icon(node.icon),
            title: Text(node.label, overflow: TextOverflow.ellipsis),
            trailing: Icon(open ? Icons.expand_less : Icons.expand_more),
            onTap: () => _toggle(node, nodes),
          ),
        );
        if (open) {
          widgets.addAll(_buildNodes(context, node.children, depth + 1));
        }
      } else {
        final isSelected = node.tableName == widget.selectedId;
        // A leaf always maps 1:1 to a table — its caption always has a
        // proper per-language translation via the schema captions, whether
        // this tree came from a custom Main Menu or the flat fallback.
        final label = tc(ref, node.tableName!);
        widgets.add(
          ListTile(
            dense: true,
            selected: isSelected,
            selectedTileColor: theme.colorScheme.secondaryContainer,
            contentPadding: padding,
            leading: Icon(node.icon),
            title: Text(label, overflow: TextOverflow.ellipsis),
            onTap: () => widget.onSelected(node.tableName!),
          ),
        );
      }
    }
    return widgets;
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: _SideNav._width,
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: FlutterLogo(size: 32),
          ),
          Expanded(
            child: ListView(
              children: _buildNodes(context, kMenuTree, 0),
            ),
          ),
          const Divider(height: 1),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: _AccountMenu(),
          ),
        ],
      ),
    );
  }
}

/// Avatar + name with a Profil / Abmelden menu, shown at the bottom of the
/// side nav.
class _AccountMenu extends ConsumerWidget {
  const _AccountMenu();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final scheme = Theme.of(context).colorScheme;

    return PopupMenuButton<String>(
      tooltip: user?.name ?? s(ref, 'account'),
      offset: const Offset(0, -96),
      onSelected: (value) {
        switch (value) {
          case 'profile':
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const ProfilePage()),
            );
          case 'logout':
            ref.read(authControllerProvider.notifier).logout();
        }
      },
      itemBuilder: (context) => [
        PopupMenuItem(
          enabled: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(user?.name ?? '',
                  style: const TextStyle(fontWeight: FontWeight.bold)),
              if (user != null)
                Text(user.email, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
        const PopupMenuDivider(),
        PopupMenuItem(
          value: 'profile',
          child: ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.person_outline),
            title: Text(s(ref, 'profile_menu_item')),
          ),
        ),
        PopupMenuItem(
          value: 'logout',
          child: ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.logout),
            title: Text(s(ref, 'logout')),
          ),
        ),
      ],
      child: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: scheme.primaryContainer,
            child: Text(
              user?.initials ?? '?',
              style: TextStyle(
                  color: scheme.onPrimaryContainer, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              user?.name ?? '',
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}

class _DbStatusBar extends ConsumerWidget {
  const _DbStatusBar();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final config = ref.watch(dbConfigProvider);
    final status = ref.watch(_dbPingProvider);

    final (color, text) = switch (status) {
      AsyncData(value: true) => (Colors.green, s(ref, 'db_connected')),
      AsyncData(value: false) => (Colors.red, s(ref, 'db_disconnected')),
      AsyncError() => (Colors.red, s(ref, 'db_error')),
      _ => (Colors.orange, s(ref, 'db_checking')),
    };

    return Material(
      color: theme.colorScheme.surfaceContainerHighest,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Row(
          children: [
            Icon(Icons.circle, size: 10, color: color),
            const SizedBox(width: 8),
            Text(
              'MySQL ${config.user}@${config.host}/${config.database} · $text',
              style: theme.textTheme.bodySmall,
            ),
            const Spacer(),
            Text('{:projectname:}', style: theme.textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

final _dbPingProvider = FutureProvider<bool>((ref) {
  return ref.watch(databaseProvider).ping();
});
