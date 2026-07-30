import 'core/ui/nav_module.dart';
{:for nmaxtables:}
import 'features/{:filename:}/{:filename:}_module.dart';
{:endfor:}

/// The registry of all entity modules shown in the navigation rail.
///
/// SCORIET: this is the ONE list Scoriet appends to when generating a new
/// table feature. Everything else about a feature is self-contained under
/// `features/<entity>/`.
final List<NavModule> appModules = <NavModule>[
{:for nmaxtables:}
  {:filecamelcase:}Module,
{:endfor:}
];
