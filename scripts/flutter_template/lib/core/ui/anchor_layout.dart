import 'package:flutter/material.dart';

/// A single absolutely-positioned child inside an [AnchorCanvas], carrying the
/// exact x/y/width/height + optional resize anchors from Scoriet's Form
/// Layout Designer (`FormItemPlacement.x_position/y_position/width/height/
/// anchor_right/anchor_bottom/anchor_width/anchor_height`).
class AnchoredPlacement {
  const AnchoredPlacement({
    required this.x,
    required this.y,
    required this.width,
    required this.height,
    this.anchorRight,
    this.anchorBottom,
    this.anchorWidth,
    this.anchorHeight,
    required this.builder,
  });

  final double x;
  final double y;
  final double width;
  final double height;

  /// Null on any axis means "pinned" — no movement/resize on that axis,
  /// matching the Designer's own opt-in anchor semantics exactly.
  final double? anchorRight;
  final double? anchorBottom;
  final double? anchorWidth;
  final double? anchorHeight;

  final WidgetBuilder builder;
}

/// Renders [children] at their exact designed position, reproducing the same
/// resize-delta anchor formula as Scoriet's Form Layout Designer live preview
/// (`FormLivePreviewModal.tsx`'s `applyAnchor`): each anchor is a percentage
/// of how far the CURRENT available width has drifted from [designWidth],
/// applied only on the axes that actually have an anchor set.
///
/// Only the WIDTH axis is responsive here (`anchor_right`/`anchor_width`) —
/// this canvas sits inside a vertically scrolling form, so there is no fixed
/// "window height" to diff against the way the Designer's own resizable
/// preview window has; `anchor_bottom`/`anchor_height` are accepted (so a
/// generated form never breaks if someone sets them) but have no visible
/// effect. The canvas's own height is sized to fit its tallest child instead
/// of a design-time constant, since Designer layouts routinely place fields
/// below the container's nominal height (the Designer canvas itself scrolls).
class AnchorCanvas extends StatelessWidget {
  const AnchorCanvas({
    super.key,
    required this.designWidth,
    required this.children,
  });

  final double designWidth;
  final List<AnchoredPlacement> children;

  @override
  Widget build(BuildContext context) {
    final contentHeight = children.isEmpty
        ? 0.0
        : children.map((p) => p.y + p.height).reduce((a, b) => a > b ? a : b);

    return LayoutBuilder(
      builder: (context, constraints) {
        final availableWidth =
            constraints.hasBoundedWidth ? constraints.maxWidth : designWidth;
        final deltaW = availableWidth - designWidth;

        return SizedBox(
          width: availableWidth,
          height: contentHeight,
          child: Stack(
            children: [
              for (final p in children)
                Positioned(
                  left: p.x +
                      (p.anchorRight != null ? deltaW * p.anchorRight! / 100 : 0),
                  top: p.y,
                  width: (p.width +
                          (p.anchorWidth != null && p.anchorWidth! > 0
                              ? deltaW * p.anchorWidth! / 100
                              : 0))
                      .clamp(10.0, double.infinity),
                  height: p.height,
                  child: Builder(builder: p.builder),
                ),
            ],
          ),
        );
      },
    );
  }
}
