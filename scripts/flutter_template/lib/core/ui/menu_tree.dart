/// SCORIET: generated from the project's Main Menu (Form Menu Editor), if one
/// is configured there — group/child hierarchy, icons and labels come
/// straight from that tree. Falls back to one flat entry per generated
/// table (same order as `app_modules.dart`) when no Main Menu is set up.
{:code:}
function iconFor(name) {
  var map = {
    'pi-table': 'Icons.table_chart',
    'pi-home': 'Icons.home',
    'pi-cog': 'Icons.settings',
    'pi-users': 'Icons.people',
    'pi-user': 'Icons.person',
    'pi-folder': 'Icons.folder',
    'pi-file': 'Icons.description',
    'pi-chart-bar': 'Icons.bar_chart',
    'pi-chart-line': 'Icons.show_chart',
    'pi-shopping-cart': 'Icons.shopping_cart',
    'pi-inbox': 'Icons.inbox',
    'pi-envelope': 'Icons.email',
    'pi-calendar': 'Icons.calendar_today',
    'pi-clock': 'Icons.access_time',
    'pi-tag': 'Icons.label',
    'pi-bookmark': 'Icons.bookmark',
    'pi-star': 'Icons.star',
    'pi-heart': 'Icons.favorite',
    'pi-globe': 'Icons.public',
    'pi-database': 'Icons.storage',
    'pi-wrench': 'Icons.build',
    'pi-sliders-h': 'Icons.tune',
    'pi-list': 'Icons.list',
    'pi-th-large': 'Icons.grid_view',
    'pi-minus': 'Icons.remove',
    'pi-arrows-alt': 'Icons.open_with'
  };
  return map[name] || 'Icons.circle';
}

function dartString(s) {
  return JSON.stringify(s === null || s === undefined ? '' : String(s));
}

function buildNode(item, byParent) {
  var kids = byParent[item.id] || [];
  var childrenSrc = kids.length > 0
    ? (', children: [' + kids.map(function (k) { return buildNode(k, byParent); }).join(', ') + ']')
    : '';
  var tableSrc = item.table_name ? (', tableName: ' + dartString(item.table_name)) : '';
  // No leading `const` here — these literals already sit inside the `const
  // List<MenuNode>` below, so Dart treats them as const implicitly; writing
  // it out again trips the `unnecessary_const` lint.
  return 'MenuNode(label: ' + dartString(item.label) + ', icon: ' + iconFor(item.icon) + tableSrc + childrenSrc + ')';
}

var project = gtree[0].project[0];
var tablesgen = project.tablesgen || [];
var allTables = project.tables || [];

// The main-menu tree is computed project-wide server-side and copied
// identically onto every table entry — read it off the first one that has it.
var menuItems = [];
for (var ti = 0; ti < allTables.length; ti++) {
  if (allTables[ti].nmaxlayoutmenus > 0) {
    menuItems = allTables[ti].layoutmenus;
    break;
  }
}

var nodesSrc;
if (menuItems.length > 0) {
  var byParent = {};
  var roots = [];
  menuItems.forEach(function (m) {
    if (m.parent_id === null || m.parent_id === undefined) {
      roots.push(m);
    } else {
      if (!byParent[m.parent_id]) byParent[m.parent_id] = [];
      byParent[m.parent_id].push(m);
    }
  });
  nodesSrc = roots.map(function (r) { return buildNode(r, byParent); }).join(',\n  ');
} else {
  var leaves = [];
  for (var gi = 0; gi < tablesgen.length; gi++) {
    var table = allTables[tablesgen[gi]];
    leaves.push('const MenuNode(label: ' + dartString(table.filepascalcase) + ', icon: Icons.table_rows_outlined, tableName: ' + dartString(table.filename) + ')');
  }
  nodesSrc = leaves.join(',\n  ');
}

var out = "import 'package:flutter/material.dart';\n\n";
out += "/// A single entry in the app's navigation menu — either a group\n";
out += "/// (has [children], no [tableName]) or a leaf that opens one entity's\n";
out += "/// module (has [tableName], matching [NavModule.id]).\n";
out += "class MenuNode {\n";
out += "  const MenuNode({\n";
out += "    required this.label,\n";
out += "    required this.icon,\n";
out += "    this.tableName,\n";
out += "    this.children = const [],\n";
out += "  });\n\n";
out += "  final String label;\n";
out += "  final IconData icon;\n\n";
out += "  /// Matches [NavModule.id] for a leaf; null for a group or separator.\n";
out += "  final String? tableName;\n\n";
out += "  final List<MenuNode> children;\n\n";
out += "  bool get isGroup => children.isNotEmpty;\n";
out += "}\n\n";
out += "const List<MenuNode> kMenuTree = [\n  " + nodesSrc + "\n];\n";

sContentResult = out;
return sContentResult;
{:codeend:}
