import 'app_globals.dart';
import 'app_structs.dart';
import 'sml_runtime/sml_constants.dart';
import 'sml_runtime/sml_window_context.dart';
// Bare WinDev builtin (INIRead/INIWrite), not a dotted namespace - always
// imported, same reasoning as main.dart's own copy of this same import.
import 'sml_runtime/lib_ini.dart';
{:if uses_str:}
import 'sml_runtime/lib_str.dart';
{:endif:}
{:if uses_num:}
import 'sml_runtime/lib_num.dart';
{:endif:}
{:if uses_arr:}
import 'sml_runtime/lib_arr.dart';
{:endif:}
{:if uses_dt:}
import 'sml_runtime/lib_dt.dart';
{:endif:}
{:if uses_crypt:}
import 'sml_runtime/lib_crypt.dart';
{:endif:}
{:if uses_log:}
import 'sml_runtime/lib_log.dart';
{:endif:}
{:if uses_json:}
import 'sml_runtime/lib_json.dart';
{:endif:}
{:if uses_i18n:}
import 'sml_runtime/lib_i18n.dart';
{:endif:}
{:if uses_sys:}
import 'sml_runtime/lib_sys.dart';
{:endif:}
{:if uses_http:}
import 'sml_runtime/lib_http.dart';
{:endif:}
{:if uses_file:}
import 'sml_runtime/lib_file.dart';
{:endif:}
{:if uses_db:}
import 'sml_runtime/lib_db.dart';
{:endif:}
{:if uses_sql:}
import 'sml_runtime/lib_sql.dart';
{:endif:}
{:if uses_draw:}
import 'sml_runtime/lib_draw.dart';
{:endif:}
{:if uses_ftp:}
import 'sml_runtime/lib_ftp.dart';
{:endif:}
{:if uses_sock:}
import 'sml_runtime/lib_sock.dart';
{:endif:}

/// Every project-wide SML procedure (see UiProcedure, `window_id IS NULL`) -
/// callable from any window or from another global procedure, unlike a
/// window's own local procedures (State methods on that window's page).
///
/// SCORIET: a global procedure that itself needs a live window
/// (calls ui./win./dlg./rpt./timer., directly or transitively through
/// another global procedure it calls - see sml_to_dart.js's
/// computeWindowContextMap()) takes an explicit leading `SmlWindowContext
/// ctx` parameter, since - unlike a window event/local procedure - it has
/// no implicit one of its own. Every call site (from window code or from
/// another such procedure) passes its own `ctx` along automatically (see
/// translateExpr()'s bare-call handling) - never something the SML author
/// has to think about.
///
/// `is_private` (WinDev's unit-local visibility) is NOT modelled as Dart
/// library privacy (a leading `_`) this round - every global procedure is a
/// plain top-level function, reachable from every window's page file that
/// imports this one. A real private/public split would need renaming at
/// both the declaration AND every call site; deferred until a project
/// actually needs the distinction enforced.
{:for nmaxglobalprocedures:}
{:if globalprocedure.needs_async:}
Future<{:globalprocedure.dart_return_type:}> {:globalprocedure.name:}({:if globalprocedure.needs_window_context:}SmlWindowContext ctx, {:endif:}{:globalprocedure.dartparamsignature:}) async {
{:if globalprocedure.dart_code:}
{:globalprocedure.dart_code:}
{:endif:}
{:if globalprocedure.dartdefaultreturn:}
  // WLanguage itself implicitly returns the declared type's default value
  // if a function reaches its end with no explicit RESULT - Dart requires
  // an explicit return on every path, so this is appended unconditionally
  // (harmless dead code, not an error, when every real path above already
  // returns) rather than guessed at per-procedure.
  return {:globalprocedure.dartdefaultreturn:};
{:endif:}
}
{:else:}
{:globalprocedure.dart_return_type:} {:globalprocedure.name:}({:if globalprocedure.needs_window_context:}SmlWindowContext ctx, {:endif:}{:globalprocedure.dartparamsignature:}) {
{:if globalprocedure.dart_code:}
{:globalprocedure.dart_code:}
{:endif:}
{:if globalprocedure.dartdefaultreturn:}
  return {:globalprocedure.dartdefaultreturn:};
{:endif:}
}
{:endif:}

{:endfor:}
