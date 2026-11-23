import 'package:flutter/material.dart';

import '../core/control_widgets.dart';

/// Generated from the Window Designer window "{:windowname:}".
///
/// SCORIET: rudimentary on purpose - every control sits at its designed
/// x/y/width/height, moving or stretching per its Window Designer anchor
/// setting when the window is resized (see the per-control comment below),
/// and renders as a plain placeholder widget matched to its type (see
/// core/control_widgets.dart). No data binding, no business logic; that is
/// a later generation step once the window's controls carry real code.
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
/// as UltimateTemplateEngine.php's nmaxelements/nmaxtabs support.
class {:pascalcase(windowname):}Content extends StatelessWidget {
  const {:pascalcase(windowname):}Content({super.key});

  @override
  Widget build(BuildContext context) {
    // designCanvasWidth/Height are the window's fixed DESIGN-time size from
    // the Window Designer - used only below to compute each anchored
    // control's/element's fixed edge inset (see the anchor comment below),
    // never to size the Stack itself. Not `static const` - Dart const
    // expressions can't call instance methods like .toDouble().
    final designCanvasWidth = {:window.canvas_width:}.toDouble();
    final designCanvasHeight = {:window.canvas_height:}.toDouble();
    return LayoutBuilder(
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
  }
}
