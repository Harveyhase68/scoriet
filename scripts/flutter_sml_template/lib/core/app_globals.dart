import 'app_structs.dart';
import 'sml_runtime/global_sync.dart';
{:if project.globals_init_uses_str:}
import 'sml_runtime/lib_str.dart';
{:endif:}
{:if project.globals_init_uses_num:}
import 'sml_runtime/lib_num.dart';
{:endif:}
{:if project.globals_init_uses_arr:}
import 'sml_runtime/lib_arr.dart';
{:endif:}
{:if project.globals_init_uses_dt:}
import 'sml_runtime/lib_dt.dart';
{:endif:}
{:if project.globals_init_uses_crypt:}
import 'sml_runtime/lib_crypt.dart';
{:endif:}
{:if project.globals_init_uses_log:}
import 'sml_runtime/lib_log.dart';
{:endif:}
{:if project.globals_init_uses_json:}
import 'sml_runtime/lib_json.dart';
{:endif:}
{:if project.globals_init_uses_i18n:}
import 'sml_runtime/lib_i18n.dart';
{:endif:}
{:if project.globals_init_uses_sys:}
import 'sml_runtime/lib_sys.dart';
{:endif:}
{:if project.globals_init_uses_http:}
import 'sml_runtime/lib_http.dart';
{:endif:}
{:if project.globals_init_uses_file:}
import 'sml_runtime/lib_file.dart';
{:endif:}
{:if project.globals_init_uses_db:}
import 'sml_runtime/lib_db.dart';
{:endif:}
{:if project.globals_init_uses_sql:}
import 'sml_runtime/lib_sql.dart';
{:endif:}
{:if project.globals_init_uses_draw:}
import 'sml_runtime/lib_draw.dart';
{:endif:}
{:if project.globals_init_uses_ftp:}
import 'sml_runtime/lib_ftp.dart';
{:endif:}
{:if project.globals_init_uses_sock:}
import 'sml_runtime/lib_sock.dart';
{:endif:}

/// Every project-wide `var` declared in the Window Designer's "Globals"
/// editor (see UiProjectGlobal) - one get/set property pair per global,
/// reachable from any window/procedure as `AppGlobals.<name>` (see
/// sml_to_dart.js's bare-global-name handling in translateExpr()/
/// translateSet()) exactly as if it were a plain field - callers never know
/// or care that it's backed by [GlobalSync] underneath.
///
/// Backed by [GlobalSync], not a plain `static` field, because this
/// template's own windows are each a SEPARATE Flutter engine/OS process
/// (see GlobalSync's own doc comment for the full "why") - a plain field
/// would only be "global" within ONE window, not the whole app, unlike a
/// real WinDev global. [GlobalSync] itself has no per-variable code at all;
/// this get/set pair (one per global, mechanically generated from the SAME
/// loop that used to just emit a field) is the ONLY per-variable code, and
/// it's still just a name+type, not sync logic.
///
/// SCORIET: every field's DEFAULT (the value [GlobalSync.get] falls back to
/// before anything ever sets it) is a plain, language-appropriate zero
/// value (never the real SML default_value expression - see
/// UltimateTemplateController::defaultDartValue()), because a global's real
/// default can be an arbitrary - possibly ASYNC - SML expression (confirmed
/// real: this project's own `gsServer` defaults to
/// `sys.load_setting("SERVERIP", "")`), which can never legally sit inside a
/// getter's own default-value expression either. Call [AppGlobals.init]
/// once, before `runApp()` (see main.dart), to run those real default-value
/// expressions - exactly the same "translated SML, always-async, called
/// once at startup" shape as the project's own init event.
class AppGlobals {
  AppGlobals._();

{:for nmaxglobals:}
{:if global.dart_nullable:}
  static {:global.dart_type:}? get {:global.name:} => GlobalSync.get<{:global.dart_type:}?>('{:global.name:}', null);
  static set {:global.name:}({:global.dart_type:}? v) => GlobalSync.set<{:global.dart_type:}?>('{:global.name:}', v);
{:else:}
  static {:global.dart_type:} get {:global.name:} => GlobalSync.get<{:global.dart_type:}>('{:global.name:}', {:global.dart_default:});
  static set {:global.name:}({:global.dart_type:} v) => GlobalSync.set<{:global.dart_type:}>('{:global.name:}', v);
{:endif:}
{:endfor:}

  /// Runs every global's real SML default-value expression, in declaration
  /// order, exactly once. Always `Future<void> ... async` regardless of
  /// whether any individual default actually awaits anything - same
  /// "harmless if unused" reasoning as the generated per-control click
  /// handlers (see windows/%1_page.dart).
  static Future<void> init() async {
{:if project.globals_init_dart_code:}
{:project.globals_init_dart_code:}
{:endif:}
  }
}
