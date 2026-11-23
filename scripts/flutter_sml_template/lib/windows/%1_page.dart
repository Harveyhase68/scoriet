import 'package:flutter/material.dart';

import '../core/control_widgets.dart';
import '../core/app_globals.dart';
import '../core/app_structs.dart';
import '../core/global_procedures.dart';
import '../core/sml_runtime/sml_window_context.dart';
import '../core/sml_runtime/sml_control_binding.dart';
import '../core/sml_runtime/sml_constants.dart';
import '../core/sml_runtime/project_init_queue.dart';
{:if window.nmaxmenus:}
import '../core/sml_runtime/sml_menu_bar.dart';
{:endif:}
// Bare WinDev builtin (INIRead/INIWrite), not a dotted namespace - always
// imported, same reasoning as main.dart's own copy of this same import.
import '../core/sml_runtime/lib_ini.dart';
{:if window.uses_str:}
import '../core/sml_runtime/lib_str.dart';
{:endif:}
{:if window.uses_num:}
import '../core/sml_runtime/lib_num.dart';
{:endif:}
{:if window.uses_arr:}
import '../core/sml_runtime/lib_arr.dart';
{:endif:}
{:if window.uses_dt:}
import '../core/sml_runtime/lib_dt.dart';
{:endif:}
{:if window.uses_crypt:}
import '../core/sml_runtime/lib_crypt.dart';
{:endif:}
{:if window.uses_log:}
import '../core/sml_runtime/lib_log.dart';
{:endif:}
{:if window.uses_json:}
import '../core/sml_runtime/lib_json.dart';
{:endif:}
{:if window.uses_i18n:}
import '../core/sml_runtime/lib_i18n.dart';
{:endif:}
{:if window.uses_sys:}
import '../core/sml_runtime/lib_sys.dart';
{:endif:}
{:if window.uses_http:}
import '../core/sml_runtime/lib_http.dart';
{:endif:}
{:if window.uses_file:}
import '../core/sml_runtime/lib_file.dart';
{:endif:}
{:if window.uses_db:}
import '../core/sml_runtime/lib_db.dart';
{:endif:}
{:if window.uses_sql:}
import '../core/sml_runtime/lib_sql.dart';
{:endif:}
{:if window.uses_draw:}
import '../core/sml_runtime/lib_draw.dart';
{:endif:}
{:if window.uses_ftp:}
import '../core/sml_runtime/lib_ftp.dart';
{:endif:}
{:if window.uses_sock:}
import '../core/sml_runtime/lib_sock.dart';
{:endif:}

/// Generated from the Window Designer window "{:windowname:}".
///
/// SCORIET: every control sits at its designed x/y/width/height, moving or
/// stretching per its Window Designer anchor setting when the window is
/// resized (see the per-control comment below), and renders as a widget
/// matched to its type (see core/control_widgets.dart). Business logic -
/// event handlers, local procedures - is generated from this window's SML
/// code-behind (see the Window Designer's Code Editor) via
/// scripts/flutter_sml_template/lib/generator/sml_to_dart.js; a control/
/// event with no SML code behind it still renders, just inertly, exactly
/// as it did before this integration existed. Only `import`s for runtime
/// libraries this window's OWN code actually calls are emitted above (see
/// `window.uses_<namespace>`, computed in UltimateTemplateController.php).
///
/// This is CONTENT ONLY (no Scaffold/AppBar) - it runs inside its own real
/// OS window, opened via core/window_frame.dart's `openWindow()` and sized
/// by main.dart's window_manager setup. The LayoutBuilder below hands every
/// root-level control/element the window's LIVE (actually resized) size,
/// which is what makes the anchor stretch below track the user dragging the
/// OS window's edges - and every nested LayoutBuilder inside a
/// container/tab does the SAME thing one level down, so a container/tab
/// anchored to stretch with the window correctly resizes its own content
/// too, not just its own outer box.
///
/// Containers (group_box/plain container) and tabs (tab_container) are ONE
/// level deep only - a container nested inside another container, or inside
/// a tab_panel, isn't reachable yet (its data exists in the gtree, the
/// template engine just doesn't loop into it) - same documented scope limit
/// as UltimateTemplateEngine.php's nmaxelements/nmaxtabs support. SML
/// control bindings/event wiring share that SAME scope limit this round:
/// only this window's own TOP-LEVEL controls (window.controls) get a real
/// SmlControlBinding/event handler - a control nested inside a container/
/// tab/looper still renders (unwired) exactly as before. A genuine,
/// documented follow-up, not a silent gap - see the template README.
class {:pascalcase(windowname):}Content extends StatefulWidget {
  const {:pascalcase(windowname):}Content({super.key});

  @override
  State<{:pascalcase(windowname):}Content> createState() => _{:pascalcase(windowname):}ContentState();
}

class _{:pascalcase(windowname):}ContentState extends State<{:pascalcase(windowname):}Content> {
  final Map<String, SmlControlBinding> _controls = {};
  late final SmlWindowContext ctx;

{:for nmaxcontrols:}
{:if control.control_type eq "text":}
  final TextEditingController _ctrl{:pascalcase(control.source_name):} = TextEditingController();
{:elseif control.control_type eq "textarea":}
  final TextEditingController _ctrl{:pascalcase(control.source_name):} = TextEditingController();
{:elseif control.control_type eq "password":}
  final TextEditingController _ctrl{:pascalcase(control.source_name):} = TextEditingController();
{:elseif control.control_type eq "number":}
  final TextEditingController _ctrl{:pascalcase(control.source_name):} = TextEditingController();
{:elseif control.control_type eq "decimal":}
  final TextEditingController _ctrl{:pascalcase(control.source_name):} = TextEditingController();
{:elseif control.control_type eq "currency":}
  final TextEditingController _ctrl{:pascalcase(control.source_name):} = TextEditingController();
{:elseif control.control_type eq "email":}
  final TextEditingController _ctrl{:pascalcase(control.source_name):} = TextEditingController();
{:elseif control.control_type eq "phone":}
  final TextEditingController _ctrl{:pascalcase(control.source_name):} = TextEditingController();
{:elseif control.control_type eq "autocomplete":}
  final TextEditingController _ctrl{:pascalcase(control.source_name):} = TextEditingController();
{:elseif control.control_type eq "dropdown":}
  final TextEditingController _ctrl{:pascalcase(control.source_name):} = TextEditingController();
{:elseif control.control_type eq "multiselect":}
  final TextEditingController _ctrl{:pascalcase(control.source_name):} = TextEditingController();
{:elseif control.control_type eq "checkbox":}
  bool _val{:pascalcase(control.source_name):} = false;
{:elseif control.control_type eq "switch":}
  bool _val{:pascalcase(control.source_name):} = false;
{:endif:}
{:endfor:}

  // Window-level state, from this window's own SML "declarations" event
  // (see UltimateTemplateController::translateDeclarationsToFields()) -
  // visible to every event handler/local procedure below, exactly like
  // WinDev's own declarations semantics. Each field starts at a plain
  // zero-value default; a real SML initializer expression (which may
  // itself `await` something) runs separately from _runWindowInit() below.
{:if window.declarations_fields_dart:}
{:window.declarations_fields_dart:}
{:endif:}

  @override
  void initState() {
    super.initState();
    ctx = SmlWindowContext(
      contextGetter: () => context,
      controls: _controls,
      windowName: '{:dartstring(window.source_name):}',
    );

{:for nmaxcontrols:}
{:if control.control_type eq "text":}
    _controls['{:dartstring(control.source_name):}'] = SmlControlBinding.text(_ctrl{:pascalcase(control.source_name):});
{:elseif control.control_type eq "textarea":}
    _controls['{:dartstring(control.source_name):}'] = SmlControlBinding.text(_ctrl{:pascalcase(control.source_name):});
{:elseif control.control_type eq "password":}
    _controls['{:dartstring(control.source_name):}'] = SmlControlBinding.text(_ctrl{:pascalcase(control.source_name):});
{:elseif control.control_type eq "number":}
    _controls['{:dartstring(control.source_name):}'] = SmlControlBinding.text(_ctrl{:pascalcase(control.source_name):});
{:elseif control.control_type eq "decimal":}
    _controls['{:dartstring(control.source_name):}'] = SmlControlBinding.text(_ctrl{:pascalcase(control.source_name):});
{:elseif control.control_type eq "currency":}
    _controls['{:dartstring(control.source_name):}'] = SmlControlBinding.text(_ctrl{:pascalcase(control.source_name):});
{:elseif control.control_type eq "email":}
    _controls['{:dartstring(control.source_name):}'] = SmlControlBinding.text(_ctrl{:pascalcase(control.source_name):});
{:elseif control.control_type eq "phone":}
    _controls['{:dartstring(control.source_name):}'] = SmlControlBinding.text(_ctrl{:pascalcase(control.source_name):});
{:elseif control.control_type eq "autocomplete":}
    _controls['{:dartstring(control.source_name):}'] = SmlControlBinding.text(_ctrl{:pascalcase(control.source_name):});
{:elseif control.control_type eq "dropdown":}
    _controls['{:dartstring(control.source_name):}'] = SmlControlBinding.text(_ctrl{:pascalcase(control.source_name):});
{:elseif control.control_type eq "multiselect":}
    _controls['{:dartstring(control.source_name):}'] = SmlControlBinding.text(_ctrl{:pascalcase(control.source_name):});
{:elseif control.control_type eq "checkbox":}
    _controls['{:dartstring(control.source_name):}'] = SmlControlBinding.value(_val{:pascalcase(control.source_name):}, onChanged: () => setState(() {}));
{:elseif control.control_type eq "switch":}
    _controls['{:dartstring(control.source_name):}'] = SmlControlBinding.value(_val{:pascalcase(control.source_name):}, onChanged: () => setState(() {}));
{:endif:}
{:endfor:}

    // `initState()` itself can never be `async` (Flutter's own State API
    // fixes its signature to `void`) - the translated declarations/init
    // code may contain real `await`s (e.g. a control's initial value
    // loaded from settings), so it runs in a separate async method
    // instead. Deferred to AFTER the first frame (`addPostFrameCallback`),
    // not fired directly from initState() - confirmed real: a `dlg.*` call
    // in declarations/init code (`showDialog` under the hood, which walks
    // up to the nearest `Navigator`) throws when run synchronously/one-
    // microtask-removed from initState(), BEFORE this widget is actually
    // mounted into the tree - and since that exception is never caught,
    // it silently aborts the REST of `_runWindowInit()` too (confirmed
    // real: a `ctx.ui.set(...)` textually AFTER a throwing `dlg.info(...)`
    // in the same function never ran either, even though ui.set() itself
    // has no such requirement). `addPostFrameCallback` guarantees a fully
    // mounted, laid-out widget - the same guarantee `_WindowSizeCorrector`
    // in main.dart already relies on for its own post-frame measurement.
    WidgetsBinding.instance.addPostFrameCallback((_) => _runWindowInit());
  }

  Future<void> _runWindowInit() async {
    // Runs any window-scoped call the PROJECT's own init code deferred
    // (e.g. `dlg.info(...)`) - see ProjectInitQueue's own doc comment for
    // why project init can't run these itself. A no-op after the very
    // first window that reaches this, on this window or any other, so a
    // queued dialog is shown once per app SESSION, not once per window
    // opened. Runs before this window's OWN init code below, matching
    // project init's own conceptual place in the startup order.
    await ProjectInitQueue.drain(ctx);
{:if window.declarations_init_dart:}
{:window.declarations_init_dart:}
{:endif:}
{:for nmaxevents:}
{:if event.event_name eq "init":}
{:if event.dart_code:}
{:event.dart_code:}
{:endif:}
{:endif:}
{:endfor:}
  }

  @override
  void dispose() {
    ctx.dispose();
{:for nmaxcontrols:}
{:if control.control_type eq "text":}
    _ctrl{:pascalcase(control.source_name):}.dispose();
{:elseif control.control_type eq "textarea":}
    _ctrl{:pascalcase(control.source_name):}.dispose();
{:elseif control.control_type eq "password":}
    _ctrl{:pascalcase(control.source_name):}.dispose();
{:elseif control.control_type eq "number":}
    _ctrl{:pascalcase(control.source_name):}.dispose();
{:elseif control.control_type eq "decimal":}
    _ctrl{:pascalcase(control.source_name):}.dispose();
{:elseif control.control_type eq "currency":}
    _ctrl{:pascalcase(control.source_name):}.dispose();
{:elseif control.control_type eq "email":}
    _ctrl{:pascalcase(control.source_name):}.dispose();
{:elseif control.control_type eq "phone":}
    _ctrl{:pascalcase(control.source_name):}.dispose();
{:elseif control.control_type eq "autocomplete":}
    _ctrl{:pascalcase(control.source_name):}.dispose();
{:elseif control.control_type eq "dropdown":}
    _ctrl{:pascalcase(control.source_name):}.dispose();
{:elseif control.control_type eq "multiselect":}
    _ctrl{:pascalcase(control.source_name):}.dispose();
{:endif:}
{:endfor:}
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // designCanvasWidth/Height are the window's fixed DESIGN-time size from
    // the Window Designer - used only below to compute each anchored
    // control's/element's fixed edge inset (see the anchor comment below),
    // never to size the Stack itself. Not `static const` - Dart const
    // expressions can't call instance methods like .toDouble().
    final designCanvasWidth = {:window.canvas_width:}.toDouble();
    final designCanvasHeight = {:window.canvas_height:}.toDouble();
    final mainContent = LayoutBuilder(
      builder: (context, constraints) {
        return SizedBox(
          width: constraints.maxWidth,
          height: constraints.maxHeight,
          child: Stack(
            children: [
              // Background Image (if set) takes priority over the plain
              // Background Color - see buildWindowBackground's own comment.
              ...[
                buildWindowBackground(
                  '{:dartstring(window.background_color):}',
                  '{:dartstring(window.background_image):}',
                ),
              ].whereType<Widget>(),
{:for nmaxcontrols:}
              // {:control.control_type:}: {:dartstring(control.caption):}
              //
              // Four independent anchor axes, matching the Window Designer's
              // Horizontal/Vertical anchor dropdowns (mutually exclusive per
              // axis - a control is either "Right"/"Bottom" anchored (MOVES
              // with that edge, size unchanged) or "Width"/"Height" anchored
              // (STRETCHES that dimension), never both at once on the same
              // axis):
              // - anchor_width set: left + right both fixed insets from the
              //   design-time edges -> Flutter computes width as the gap
              //   between them, so the box gets wider/narrower with the
              //   window (stretch).
              // - anchor_right set (anchor_width not set): right is a fixed
              //   inset, width stays at its design-time value -> Flutter
              //   computes left as (containerWidth - right - width), so the
              //   box's left edge slides to keep pace with the window's
              //   right edge (pure move, no resize).
              // - neither set: left + width both fixed (pinned top-left,
              //   design-time size, matches WinDev's "no anchor" default).
              // anchor_bottom/anchor_height mirror the same three cases on
              // the vertical axis. The insets themselves are FIXED, computed
              // once from the ORIGINAL design-time canvas size - not a
              // weighted 0-100 percentage as WinDev models it (that needs a
              // dedicated layout widget); "any positive value = fully
              // anchored" is a deliberate simplification, good enough to see
              // controls move/stretch in the right direction and by roughly
              // the right amount.
              Positioned(
{:if control.anchor_width:}
                left: {:control.x:}.toDouble(),
                right: (designCanvasWidth - {:control.x:} - {:control.width:}).toDouble(),
{:elseif control.anchor_right:}
                right: (designCanvasWidth - {:control.x:} - {:control.width:}).toDouble(),
                width: {:control.width:}.toDouble(),
{:else:}
                left: {:control.x:}.toDouble(),
                width: {:control.width:}.toDouble(),
{:endif:}
{:if control.anchor_height:}
                top: {:control.y:}.toDouble(),
                bottom: (designCanvasHeight - {:control.y:} - {:control.height:}).toDouble(),
{:elseif control.anchor_bottom:}
                bottom: (designCanvasHeight - {:control.y:} - {:control.height:}).toDouble(),
                height: {:control.height:}.toDouble(),
{:else:}
                top: {:control.y:}.toDouble(),
                height: {:control.height:}.toDouble(),
{:endif:}
                child: SizedBox.expand(
                  child: buildRudimentaryControl(
                    '{:control.control_type:}',
                    '{:dartstring(control.caption):}',
                    iconData: '{:dartstring(control.icon_data):}',
                    iconStateCount: {:control.icon_state_count:},
                    iconPositionH: '{:dartstring(control.icon_position_horizontal):}',
                    iconPositionV: '{:dartstring(control.icon_position_vertical):}',
                    captionVisible: {:control.caption_visible:},
                    labelPosition: '{:control.label_position:}',
                    labelWidth: {:control.label_width:}.toDouble(),
                    alignH: '{:control.caption_position_horizontal:}',
                    alignV: '{:control.caption_position_vertical:}',
                    backgroundColor: '{:dartstring(control.control_background_color):}',
                    textColor: '{:dartstring(control.control_text_color):}',
                    backgroundImage: '{:dartstring(control.background_image):}',
                    backgroundImageStates: {:control.background_image_states:},
                    tableColumns: [
{:for nmaxcolumns:}
                      TableColumnSpec(caption: '{:dartstring(column.caption):}', width: {:column.width:}.toDouble()),
{:endfor:}
                    ],
                    optionLabels: [
{:for nmaxoptions:}
                      '{:dartstring(option.caption):}',
{:endfor:}
                    ],
{:if control.control_type eq "button":}
                    onPressed: _on{:pascalcase(control.source_name):}Click,
{:endif:}
{:if control.control_type eq "text":}
                    controller: _ctrl{:pascalcase(control.source_name):},
{:elseif control.control_type eq "textarea":}
                    controller: _ctrl{:pascalcase(control.source_name):},
{:elseif control.control_type eq "password":}
                    controller: _ctrl{:pascalcase(control.source_name):},
{:elseif control.control_type eq "number":}
                    controller: _ctrl{:pascalcase(control.source_name):},
{:elseif control.control_type eq "decimal":}
                    controller: _ctrl{:pascalcase(control.source_name):},
{:elseif control.control_type eq "currency":}
                    controller: _ctrl{:pascalcase(control.source_name):},
{:elseif control.control_type eq "email":}
                    controller: _ctrl{:pascalcase(control.source_name):},
{:elseif control.control_type eq "phone":}
                    controller: _ctrl{:pascalcase(control.source_name):},
{:elseif control.control_type eq "autocomplete":}
                    controller: _ctrl{:pascalcase(control.source_name):},
{:elseif control.control_type eq "dropdown":}
                    controller: _ctrl{:pascalcase(control.source_name):},
{:elseif control.control_type eq "multiselect":}
                    controller: _ctrl{:pascalcase(control.source_name):},
{:endif:}
{:if control.control_type eq "checkbox":}
                    checkboxValue: _val{:pascalcase(control.source_name):},
                    onCheckboxChanged: (v) => setState(() => _val{:pascalcase(control.source_name):} = v),
{:elseif control.control_type eq "switch":}
                    checkboxValue: _val{:pascalcase(control.source_name):},
                    onCheckboxChanged: (v) => setState(() => _val{:pascalcase(control.source_name):} = v),
{:endif:}
                  ),
                ),
              ),
{:endfor:}
{:for nmaxelements:}
              // element: {:element.element_type:} "{:dartstring(element.caption):}"
              // Same anchor rules as controls above (right/bottom = move,
              // width/height = stretch, neither = fixed), against the SAME
              // window-level design size - a container is positioned exactly
              // like a control from the window's point of view.
              Positioned(
{:if element.anchor_width:}
                left: {:element.x:}.toDouble(),
                right: (designCanvasWidth - {:element.x:} - {:element.width:}).toDouble(),
{:elseif element.anchor_right:}
                right: (designCanvasWidth - {:element.x:} - {:element.width:}).toDouble(),
                width: {:element.width:}.toDouble(),
{:else:}
                left: {:element.x:}.toDouble(),
                width: {:element.width:}.toDouble(),
{:endif:}
{:if element.anchor_height:}
                top: {:element.y:}.toDouble(),
                bottom: (designCanvasHeight - {:element.y:} - {:element.height:}).toDouble(),
{:elseif element.anchor_bottom:}
                bottom: (designCanvasHeight - {:element.y:} - {:element.height:}).toDouble(),
                height: {:element.height:}.toDouble(),
{:else:}
                top: {:element.y:}.toDouble(),
                height: {:element.height:}.toDouble(),
{:endif:}
                child: SizedBox.expand(
{:if element.element_type eq "tab_container":}
                  child: DefaultTabController(
                    length: {:element.nmaxtabs:},
                    // Builder hands `TabStripWithNav` a context that's
                    // actually a DESCENDANT of the DefaultTabController
                    // above, which DefaultTabController.of(context) needs -
                    // the outer build()'s own `context` parameter is an
                    // ANCESTOR of it instead, so it can't see this tab
                    // controller at all.
                    child: Builder(builder: (context) {
                      final tabController = DefaultTabController.of(context);
                      return Column(
                      children: [
                        TabStripWithNav(
                          controller: tabController,
                          labels: const [
{:for nmaxtabs:}
                            '{:dartstring(tab.caption):}',
{:endfor:}
                          ],
                          stripHeight: {:element.tab_strip_height:}.toDouble(),
                          activeBackgroundColor: '{:dartstring(element.tab_active_background_color):}',
                          inactiveBackgroundColor: '{:dartstring(element.tab_inactive_background_color):}',
                          activeTextColor: '{:dartstring(element.tab_active_text_color):}',
                          inactiveTextColor: '{:dartstring(element.tab_inactive_text_color):}',
                          fontFamily: '{:dartstring(element.tab_font_family):}',
                          fontSize: {:element.tab_font_size:} > 0 ? {:element.tab_font_size:}.toDouble() : null,
                          fontBold: {:element.tab_font_bold:},
                          fontItalic: {:element.tab_font_italic:},
                          fontUnderline: {:element.tab_font_underline:},
                          fontStrikeout: {:element.tab_font_strikeout:},
                        ),
                        Expanded(
                          // The tab_container's own content-area background -
                          // sits behind whichever page is currently showing,
                          // separate from the tab strip's own colors above
                          // (see the Window Designer's Appearance section:
                          // "Content Background" vs. the Tab Strip colors).
                          child: ColoredBox(
                            color: hexToColorOrTransparent('{:dartstring(element.background_color):}'),
                            child: TabBarView(
                            children: [
{:for nmaxtabs:}
                              // tab: "{:dartstring(tab.caption):}" - designTabWidth/Height are
                              // ONLY the fixed anchor-inset base (matching designCanvasWidth/
                              // Height's role above); LayoutBuilder hands the Stack the LIVE
                              // available size, so if the tab_container itself is anchored to
                              // stretch with the window, this tab page's content stretches too
                              // (not just the tab_container's own outer box).
                              LayoutBuilder(builder: (context, tabConstraints) {
                                final designTabWidth = {:tab.width:}.toDouble();
                                final designTabHeight = {:tab.height:}.toDouble();
                                return SizedBox(
                                  width: tabConstraints.maxWidth,
                                  height: tabConstraints.maxHeight,
                                  child: Stack(
                                    children: [
{:for nmaxcontrols:}
                                      Positioned(
{:if control.anchor_width:}
                                        left: {:control.x:}.toDouble(),
                                        right: (designTabWidth - {:control.x:} - {:control.width:}).toDouble(),
{:elseif control.anchor_right:}
                                        right: (designTabWidth - {:control.x:} - {:control.width:}).toDouble(),
                                        width: {:control.width:}.toDouble(),
{:else:}
                                        left: {:control.x:}.toDouble(),
                                        width: {:control.width:}.toDouble(),
{:endif:}
{:if control.anchor_height:}
                                        top: {:control.y:}.toDouble(),
                                        bottom: (designTabHeight - {:control.y:} - {:control.height:}).toDouble(),
{:elseif control.anchor_bottom:}
                                        bottom: (designTabHeight - {:control.y:} - {:control.height:}).toDouble(),
                                        height: {:control.height:}.toDouble(),
{:else:}
                                        top: {:control.y:}.toDouble(),
                                        height: {:control.height:}.toDouble(),
{:endif:}
                                        child: SizedBox.expand(
                                          child: buildRudimentaryControl(
                                            '{:control.control_type:}',
                                            '{:dartstring(control.caption):}',
                                            iconData: '{:dartstring(control.icon_data):}',
                                            iconStateCount: {:control.icon_state_count:},
                                            iconPositionH: '{:dartstring(control.icon_position_horizontal):}',
                                            iconPositionV: '{:dartstring(control.icon_position_vertical):}',
                                            captionVisible: {:control.caption_visible:},
                                            labelPosition: '{:control.label_position:}',
                                            labelWidth: {:control.label_width:}.toDouble(),
                                            alignH: '{:control.caption_position_horizontal:}',
                                            alignV: '{:control.caption_position_vertical:}',
                                            backgroundColor: '{:dartstring(control.control_background_color):}',
                                            textColor: '{:dartstring(control.control_text_color):}',
                                            backgroundImage: '{:dartstring(control.background_image):}',
                    backgroundImageStates: {:control.background_image_states:},
                                            tableColumns: [
{:for nmaxcolumns:}
                                              TableColumnSpec(caption: '{:dartstring(column.caption):}', width: {:column.width:}.toDouble()),
{:endfor:}
                                            ],
                                            optionLabels: [
{:for nmaxoptions:}
                                              '{:dartstring(option.caption):}',
{:endfor:}
                                            ],
                                          ),
                                        ),
                                      ),
{:endfor:}
                                    ],
                                  ),
                                );
                              }),
{:endfor:}
                            ],
                            ),
                          ),
                        ),
                      ],
                      );
                    }),
                  ),
{:elseif element.element_type eq "looper":}
                  // A looper is a single-column, vertically scrolling
                  // repeater (WinDev's "Looper" control) - the for-nmaxcontrols
                  // loop below walks the SAME controls once per generated row
                  // (the row template gtree flattens its one-and-only child
                  // row's controls straight onto the looper's own element
                  // node - see UltimateTemplateController::buildWindowElementNode()),
                  // wrapped in a Dart-level itemBuilder that repeats it -
                  // there's no live data source yet (same "no data binding"
                  // scope as every other control here), so a fixed preview
                  // row count stands in for real rows. 20 (not table's 100 -
                  // a table row is one cheap empty cell, a looper row can be
                  // several real nested controls, considerably more
                  // expensive to build repeatedly).
                  child: LayoutBuilder(builder: (context, looperConstraints) {
                    final rowHeight = {:element.looper_row_height:}.toDouble();
                    final designRowWidth = {:element.width:}.toDouble();
                    return ListView.builder(
                      itemCount: 20,
                      itemBuilder: (context, looperIndex) {
                        return SizedBox(
                          width: looperConstraints.maxWidth,
                          height: rowHeight,
                          child: Stack(
                            children: [
{:for nmaxcontrols:}
                              Positioned(
{:if control.anchor_width:}
                                left: {:control.x:}.toDouble(),
                                right: (designRowWidth - {:control.x:} - {:control.width:}).toDouble(),
{:elseif control.anchor_right:}
                                right: (designRowWidth - {:control.x:} - {:control.width:}).toDouble(),
                                width: {:control.width:}.toDouble(),
{:else:}
                                left: {:control.x:}.toDouble(),
                                width: {:control.width:}.toDouble(),
{:endif:}
{:if control.anchor_height:}
                                top: {:control.y:}.toDouble(),
                                bottom: (rowHeight - {:control.y:} - {:control.height:}).toDouble(),
{:elseif control.anchor_bottom:}
                                bottom: (rowHeight - {:control.y:} - {:control.height:}).toDouble(),
                                height: {:control.height:}.toDouble(),
{:else:}
                                top: {:control.y:}.toDouble(),
                                height: {:control.height:}.toDouble(),
{:endif:}
                                child: SizedBox.expand(
                                  child: buildRudimentaryControl(
                                    '{:control.control_type:}',
                                    '{:dartstring(control.caption):}',
                                    iconData: '{:dartstring(control.icon_data):}',
                                    iconStateCount: {:control.icon_state_count:},
                                    iconPositionH: '{:dartstring(control.icon_position_horizontal):}',
                                    iconPositionV: '{:dartstring(control.icon_position_vertical):}',
                                    captionVisible: {:control.caption_visible:},
                                    labelPosition: '{:control.label_position:}',
                                    labelWidth: {:control.label_width:}.toDouble(),
                                    alignH: '{:control.caption_position_horizontal:}',
                                    alignV: '{:control.caption_position_vertical:}',
                                    backgroundColor: '{:dartstring(control.control_background_color):}',
                                    textColor: '{:dartstring(control.control_text_color):}',
                                    backgroundImage: '{:dartstring(control.background_image):}',
                    backgroundImageStates: {:control.background_image_states:},
                                    tableColumns: [
{:for nmaxcolumns:}
                                      TableColumnSpec(caption: '{:dartstring(column.caption):}', width: {:column.width:}.toDouble()),
{:endfor:}
                                    ],
                                    optionLabels: [
{:for nmaxoptions:}
                                      '{:dartstring(option.caption):}',
{:endfor:}
                                    ],
                                  ),
                                ),
                              ),
{:endfor:}
                            ],
                          ),
                        );
                      },
                    );
                  }),
{:elseif element.element_type eq "group_box":}
                  child: buildGroupBoxFrame(
                    '{:dartstring(element.caption):}',
                    LayoutBuilder(builder: (context, elemConstraints) {
                      final designElemWidth = {:element.width:}.toDouble();
                      final designElemHeight = {:element.height:}.toDouble();
                      return SizedBox(
                        width: elemConstraints.maxWidth,
                        height: elemConstraints.maxHeight,
                        child: Stack(
                          children: [
{:for nmaxcontrols:}
                            Positioned(
{:if control.anchor_width:}
                              left: {:control.x:}.toDouble(),
                              right: (designElemWidth - {:control.x:} - {:control.width:}).toDouble(),
{:elseif control.anchor_right:}
                              right: (designElemWidth - {:control.x:} - {:control.width:}).toDouble(),
                              width: {:control.width:}.toDouble(),
{:else:}
                              left: {:control.x:}.toDouble(),
                              width: {:control.width:}.toDouble(),
{:endif:}
{:if control.anchor_height:}
                              top: {:control.y:}.toDouble(),
                              bottom: (designElemHeight - {:control.y:} - {:control.height:}).toDouble(),
{:elseif control.anchor_bottom:}
                              bottom: (designElemHeight - {:control.y:} - {:control.height:}).toDouble(),
                              height: {:control.height:}.toDouble(),
{:else:}
                              top: {:control.y:}.toDouble(),
                              height: {:control.height:}.toDouble(),
{:endif:}
                              child: SizedBox.expand(
                                child: buildRudimentaryControl(
                                  '{:control.control_type:}',
                                  '{:dartstring(control.caption):}',
                                  iconData: '{:dartstring(control.icon_data):}',
                                  iconStateCount: {:control.icon_state_count:},
                                  iconPositionH: '{:dartstring(control.icon_position_horizontal):}',
                                  iconPositionV: '{:dartstring(control.icon_position_vertical):}',
                                  captionVisible: {:control.caption_visible:},
                                  labelPosition: '{:control.label_position:}',
                                  labelWidth: {:control.label_width:}.toDouble(),
                                  alignH: '{:control.caption_position_horizontal:}',
                                  alignV: '{:control.caption_position_vertical:}',
                                  backgroundColor: '{:dartstring(control.control_background_color):}',
                                  textColor: '{:dartstring(control.control_text_color):}',
                                  backgroundImage: '{:dartstring(control.background_image):}',
                    backgroundImageStates: {:control.background_image_states:},
                                  tableColumns: [
{:for nmaxcolumns:}
                                    TableColumnSpec(caption: '{:dartstring(column.caption):}', width: {:column.width:}.toDouble()),
{:endfor:}
                                  ],
                                  optionLabels: [
{:for nmaxoptions:}
                                    '{:dartstring(option.caption):}',
{:endfor:}
                                  ],
                                ),
                              ),
                            ),
{:endfor:}
                          ],
                        ),
                      );
                    }),
                  ),
{:else:}
                  child: LayoutBuilder(builder: (context, elemConstraints) {
                    final designElemWidth = {:element.width:}.toDouble();
                    final designElemHeight = {:element.height:}.toDouble();
                    return SizedBox(
                      width: elemConstraints.maxWidth,
                      height: elemConstraints.maxHeight,
                      child: Stack(
                        children: [
{:for nmaxcontrols:}
                          Positioned(
{:if control.anchor_width:}
                            left: {:control.x:}.toDouble(),
                            right: (designElemWidth - {:control.x:} - {:control.width:}).toDouble(),
{:elseif control.anchor_right:}
                            right: (designElemWidth - {:control.x:} - {:control.width:}).toDouble(),
                            width: {:control.width:}.toDouble(),
{:else:}
                            left: {:control.x:}.toDouble(),
                            width: {:control.width:}.toDouble(),
{:endif:}
{:if control.anchor_height:}
                            top: {:control.y:}.toDouble(),
                            bottom: (designElemHeight - {:control.y:} - {:control.height:}).toDouble(),
{:elseif control.anchor_bottom:}
                            bottom: (designElemHeight - {:control.y:} - {:control.height:}).toDouble(),
                            height: {:control.height:}.toDouble(),
{:else:}
                            top: {:control.y:}.toDouble(),
                            height: {:control.height:}.toDouble(),
{:endif:}
                            child: SizedBox.expand(
                              child: buildRudimentaryControl(
                                '{:control.control_type:}',
                                '{:dartstring(control.caption):}',
                                iconData: '{:dartstring(control.icon_data):}',
                                iconStateCount: {:control.icon_state_count:},
                                iconPositionH: '{:dartstring(control.icon_position_horizontal):}',
                                iconPositionV: '{:dartstring(control.icon_position_vertical):}',
                                captionVisible: {:control.caption_visible:},
                                labelPosition: '{:control.label_position:}',
                                labelWidth: {:control.label_width:}.toDouble(),
                                alignH: '{:control.caption_position_horizontal:}',
                                alignV: '{:control.caption_position_vertical:}',
                                backgroundColor: '{:dartstring(control.control_background_color):}',
                                textColor: '{:dartstring(control.control_text_color):}',
                                backgroundImage: '{:dartstring(control.background_image):}',
                    backgroundImageStates: {:control.background_image_states:},
                                tableColumns: [
{:for nmaxcolumns:}
                                  TableColumnSpec(caption: '{:dartstring(column.caption):}', width: {:column.width:}.toDouble()),
{:endfor:}
                                ],
                                optionLabels: [
{:for nmaxoptions:}
                                  '{:dartstring(option.caption):}',
{:endfor:}
                                ],
                              ),
                            ),
                          ),
{:endfor:}
                        ],
                      ),
                    );
                  }),
{:endif:}
                ),
              ),
{:endfor:}
            ],
          ),
        );
      },
    );
{:if window.has_status_bar:}
    // WinDev's Window.StatusBar option - shows/replaces whatever text
    // `Message(...)` last set (see SmlWindowContext.message). At DESIGN
    // time the bar ADDS SmlWindowContext.statusBarHeight to the window's
    // total height (window_modules.dart's NavModule.canvasHeight adds the
    // SAME constant, so the OS window opens already sized to fit both) -
    // but the user can still resize the real OS window bigger/smaller
    // afterwards, and the bar must stay pinned to the true bottom edge at
    // full width regardless (confirmed broken otherwise: `mainContent`
    // wrapped in a fixed-height `SizedBox(height: designCanvasHeight)`
    // never grows/shrinks with the window, leaving the status bar stuck
    // right below the design-time content with unstyled empty space below
    // IT once the window is taller than that). `Expanded` instead lets
    // `mainContent` claim whatever space the Column actually has left
    // after the status bar's own fixed height - `mainContent`'s own
    // LayoutBuilder already resizes every anchored control/element to
    // whatever box it's handed, so this is the only change needed. The
    // 1px top border is the separating line the user asked for, 23px up
    // from the new bottom edge - purely a runtime Flutter rendering
    // detail, nothing baked into Window Designer data.
    final bodyContent = Column(
      mainAxisSize: MainAxisSize.max,
      children: [
        Expanded(child: mainContent),
        SizedBox(
          height: SmlWindowContext.statusBarHeight,
          width: double.infinity,
          child: DecoratedBox(
            decoration: const BoxDecoration(
              color: Color(0xFFE0E0E0),
              border: Border(top: BorderSide(color: Color(0xFFB0B0B0), width: 1)),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              // WinDev's `ProgressBar(...)` ALSO writes into this same
              // status bar (see SmlWindowContext.progressBar's own doc
              // comment) - a small filled bar to the left of the caption
              // text, distinct from `Message(...)`'s text-only form.
              // `Listenable.merge` rebuilds this row on either call
              // (ctx.statusBarText OR ctx.progressBarValue/Color) without
              // nesting three separate ValueListenableBuilders.
              child: ListenableBuilder(
                listenable: Listenable.merge([ctx.statusBarText, ctx.progressBarValue, ctx.progressBarColor]),
                builder: (context, _) {
                  final progress = ctx.progressBarValue.value;
                  return Row(
                    children: [
                      if (progress != null) ...[
                        SizedBox(
                          width: 80,
                          height: 10,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(2),
                            child: LinearProgressIndicator(
                              value: progress,
                              color: ctx.progressBarColor.value,
                              backgroundColor: const Color(0xFFC0C0C0),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                      ],
                      Expanded(
                        child: Text(
                          ctx.statusBarText.value,
                          style: const TextStyle(fontSize: 11, color: Colors.black87),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
        ),
      ],
    );
{:else:}
    final bodyContent = mainContent;
{:endif:}
{:if window.nmaxmenus:}
    // WinDev's own window menu bar (Window Designer's Menu Bar Designer /
    // an imported `ui { menu ... }` block) - a real, in-flow MenuBar that
    // pushes bodyContent down (unlike the Window Designer canvas's own
    // read-only overlay preview, which deliberately doesn't reserve space
    // to avoid disturbing that canvas's pixel-exact WinDev import
    // coordinates - no such constraint applies to this generated runtime
    // widget tree). menu_bar_dart/menu_handlers_dart are plain Dart text
    // pre-rendered in PHP (see UltimateTemplateController::
    // menuBarDartLiteral()) - a window's menu tree can nest arbitrarily
    // deep, which this template's own for-nmaxX loop constructs can't
    // express (every one is individually hand-registered, none recurse
    // into their own children).
    final content = Column(
      mainAxisSize: MainAxisSize.max,
      // Column defaults to CrossAxisAlignment.center - MenuBar only ever
      // sizes itself to fit its own items, so left uncorrected it renders
      // as a small centered island instead of a real top-left-anchored
      // menu bar. .stretch makes MenuBar itself full width, and its own
      // internal Row already left-aligns its items by default.
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        buildSmlMenuBar({:window.menu_bar_dart:}),
        Expanded(child: bodyContent),
      ],
    );
{:else:}
    final content = bodyContent;
{:endif:}
    // Covers THIS window's own content with an input-absorbing (and
    // lightly dimmed, so it's visually obvious why clicks don't do
    // anything) overlay for as long as a real WinDev `Open(...)` call THIS
    // window itself made is still waiting on the opened window to close -
    // see SmlWindowContext.isBlockedByModal's own doc comment for the full
    // "why" (the opened window is a genuinely separate OS window/process,
    // so there's no OS-level way to disable input on THIS one instead).
    return ValueListenableBuilder<bool>(
      valueListenable: ctx.isBlockedByModal,
      builder: (context, blocked, child) {
        if (!blocked) return child!;
        // ModalBarrier - the SAME widget `showDialog()` itself uses for its
        // own scrim - blocks every pointer event from reaching `child`
        // underneath (dismissible: false - unlike a real dialog's own
        // barrier, tapping it must NOT close the modally-opened window;
        // only that window closing itself lifts this).
        return Stack(
          children: [
            child!,
            const Positioned.fill(
              child: ModalBarrier(dismissible: false, color: Color(0x1F000000)),
            ),
          ],
        );
      },
      child: content,
    );
  }

{:if window.nmaxmenus:}
  // ---- Menu bar item handlers ----
  // Every leaf menu item's own `select` event - pre-rendered in PHP (see
  // menuBarDartLiteral()'s own doc comment for why), so this is plain
  // Dart text, not a template loop.
{:window.menu_handlers_dart:}
{:endif:}

  // ---- Event handlers (see the Window Designer's Code Editor) ----
  // Every top-level control's OWN events - see the class doc comment for
  // why nested (tab/container/looper) controls aren't wired this round.
  // A control with no matching SML event still gets its handler generated
  // here, empty - so `onPressed: _onXClick` above always resolves to a
  // real method, whether or not there is any code behind it yet.
{:for nmaxcontrols:}
{:if control.control_type eq "button":}
  // Always `Future<void> ... async` regardless of whether this control's
  // click code itself needs to await anything - a function returning
  // `Future<void>` is a perfectly valid `VoidCallback` (Dart discards the
  // ignored return value), and this sidesteps having to know the async-ness
  // of "whichever event in this control's list happens to be named click"
  // before the method signature is written.
  Future<void> _on{:pascalcase(control.source_name):}Click() async {
{:for nmaxevents:}
{:if event.event_name eq "click":}
{:if event.dart_code:}
{:event.dart_code:}
{:endif:}
{:endif:}
{:endfor:}
  }
{:endif:}
{:endfor:}

  // ---- Local procedures (see the Window Designer's Local Procedures editor) ----
{:for nmaxprocedures:}
  {:if procedure.needs_async:}Future<{:procedure.dart_return_type:}>{:else:}{:procedure.dart_return_type:}{:endif:} {:procedure.name:}({:procedure.dartparamsignature:}) {:if procedure.needs_async:}async {:endif:}{
{:if procedure.dart_code:}
{:procedure.dart_code:}
{:endif:}
{:if procedure.dartdefaultreturn:}
  // WLanguage itself implicitly returns the declared type's default value
  // if a function reaches its end with no explicit RESULT - Dart requires
  // an explicit return on every path, so this is appended unconditionally
  // (harmless dead code, not an error, when every real path above already
  // returns) rather than guessed at per-procedure.
  return {:procedure.dartdefaultreturn:};
{:endif:}
  }
{:endfor:}
}
