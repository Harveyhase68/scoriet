import 'dart:convert';

import 'package:flutter/material.dart';

/// One column of a 'table' control, as configured in the Window Designer's
/// table column editor (see UiWindowControl.table_columns / TableColumnDef
/// on the frontend) - just enough to draw a real, correctly-sized header
/// row; no cell data yet (that's a later generation step, same as every
/// other control here).
class TableColumnSpec {
  const TableColumnSpec({required this.caption, required this.width});

  final String caption;
  final double width;
}

/// Renders one Window Designer control as a plain, rudimentary placeholder
/// widget matched to its type - no data binding, no business logic. Shared
/// by every generated window page (see `windows/<name>_page.dart`) so the
/// type-to-widget mapping lives in exactly one place instead of being
/// repeated per generated file.
///
/// [iconData] is the control's icon as a `data:image/...;base64,...` URI
/// (only meaningful for 'button'; null for controls without one).
/// [iconStateCount] > 1 means [iconData] is a WinDev multi-state sprite
/// (several state bitmaps concatenated side by side - typically 5:
/// Idle/Pressed/Grayed/Selected/Hovered); only the first (Idle) frame is
/// shown, matching the Window Designer canvas preview.
/// [iconPositionH]/[iconPositionV] place the icon relative to the caption
/// ('right'/'left', or 'top'/'bottom' to stack instead of sit side by side).
/// [captionVisible] is the Window Designer's "Show Caption" toggle (only
/// meaningful for 'button' - other types always show their caption/label).
/// [labelPosition] mirrors the Window Designer canvas: 'top'/'left'/'right'
/// draws the caption as a separate label next to the input, sized to
/// [labelWidth] when beside it; 'none' (or any other value) shows the input
/// alone. [alignH]/[alignV] ('left'/'center'/'right' and 'top'/'middle'/
/// 'bottom') only apply to 'static_text'/'heading'. [backgroundColor]/
/// [textColor] are hex strings ("#RRGGBB") from the control's own Window
/// Designer styling. [tableColumns] is only meaningful for 'table' - its
/// configured columns, for a real (scrollable, correctly widthed) header.
/// [optionLabels] is only meaningful for 'radio_group'/'checkbox_group' -
/// its configured options (resolved to the current generation language),
/// for the real option list instead of one inert placeholder toggle.
Widget buildRudimentaryControl(
  String controlType,
  String caption, {
  String? iconData,
  int? iconStateCount,
  String? iconPositionH,
  String? iconPositionV,
  bool captionVisible = true,
  String labelPosition = 'top',
  double? labelWidth,
  String? alignH,
  String? alignV,
  String? backgroundColor,
  String? textColor,
  String? backgroundImage,
  int? backgroundImageStates,
  List<TableColumnSpec>? tableColumns,
  List<String>? optionLabels,
}) {
  final bg = _hexToColor(backgroundColor);
  final fg = _hexToColor(textColor);

  switch (controlType) {
    case 'button':
      // Only meaningful for 'button' so far - takes priority over bg
      // (control_background_color) when set, matching the Window
      // Designer's own "Background Image ... takes priority over
      // Background Color below" note. Same WLangage ImageState frame-
      // count concept as the icon just below, applied to the whole
      // button surface instead of one small glyph.
      final backgroundImageFrames = (backgroundImageStates ?? 1) > 1 ? backgroundImageStates! : 1;
      final buttonBackgroundImage = _decodeFullImage(backgroundImage, stateCount: backgroundImageFrames);
      final frames = (iconStateCount ?? 1) > 1 ? iconStateCount! : 1;
      final icon = _decodeDataUriImage(iconData, stateCount: frames);
      // "Show Caption" off in the Window Designer hides the caption even
      // when one is set (e.g. an icon-only button that still has a caption
      // recorded for accessibility/fallback purposes) - captionVisible is
      // that toggle, caption.isNotEmpty is just "is there anything to show
      // at all".
      final captionWidget = captionVisible && caption.isNotEmpty ? Text(caption) : null;
      // iconPositionV (top/bottom) stacks the icon above/below the caption
      // instead of beside it, matching the Window Designer canvas.
      final stacksVertically = iconPositionV == 'top' || iconPositionV == 'bottom';
      final iconFirst = stacksVertically ? iconPositionV != 'bottom' : iconPositionH != 'right';
      final spacer = SizedBox(width: stacksVertically ? 0 : 8, height: stacksVertically ? 4 : 0);
      final parts = <Widget>[];
      if (iconFirst) {
        if (icon != null) parts.add(icon);
        if (icon != null && captionWidget != null) parts.add(spacer);
        if (captionWidget != null) parts.add(captionWidget);
      } else {
        if (captionWidget != null) parts.add(captionWidget);
        if (icon != null && captionWidget != null) parts.add(spacer);
        if (icon != null) parts.add(icon);
      }
      final buttonWidget = ElevatedButton(
        onPressed: null,
        style: ElevatedButton.styleFrom(
          // Colors set here only style the ENABLED state - a placeholder
          // button with no business logic yet always renders `onPressed:
          // null`, which makes Material fall back to its disabled color
          // scheme unless the disabled* colors are set too. Setting them
          // to the same values keeps the button showing its real designed
          // colors even while inert. A background image needs the
          // button's OWN background transparent so the image (stacked
          // behind it below) actually shows through instead of being
          // covered by an opaque Material surface.
          backgroundColor: buttonBackgroundImage != null ? Colors.transparent : bg,
          foregroundColor: fg,
          disabledBackgroundColor: buttonBackgroundImage != null ? Colors.transparent : bg,
          disabledForegroundColor: fg,
          elevation: buttonBackgroundImage != null ? 0 : null,
          // Material's default button padding (~24px each side) and
          // minimum tap-target size (48x48) are sized for a button that's
          // free to size itself. Here the button is instead forced into
          // its designed x/y/width/height by the caller's Positioned box,
          // which on a small WinDev-style button (e.g. a 33px-wide "..."
          // picker button) leaves less room than that default chrome alone
          // needs - stripping both to zero hands ALL of the box to the
          // actual icon/caption content below.
          padding: EdgeInsets.zero,
          minimumSize: Size.zero,
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
        // FittedBox(scaleDown) is the safety net for whatever room is still
        // too tight for the icon+caption at their natural size (a small
        // button with a long caption has no combination of padding/spacing
        // that fits both) - it shrinks the whole Row/Column uniformly to
        // fit instead of Flutter's default hard RenderFlex overflow, which
        // clips unpredictably and can hide the content entirely.
        child: FittedBox(
          fit: BoxFit.scaleDown,
          child: stacksVertically
              ? Column(mainAxisSize: MainAxisSize.min, children: parts)
              : Row(mainAxisSize: MainAxisSize.min, children: parts),
        ),
      );
      if (buttonBackgroundImage == null) {
        return buttonWidget;
      }
      // ElevatedButton has no background-image concept of its own - the
      // image sits behind it as its own layer instead, clipped to
      // Material 3's default button corner radius so it doesn't poke out
      // past the (now transparent) button's own rounded shape.
      return ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: Stack(
          fit: StackFit.expand,
          children: [
            FittedBox(fit: BoxFit.cover, child: buttonBackgroundImage),
            buttonWidget,
          ],
        ),
      );
    case 'static_text':
    case 'heading':
      return Container(
        color: bg,
        alignment: _alignmentFor(alignH, alignV),
        child: Text(caption, textAlign: _textAlignFor(alignH), style: TextStyle(color: fg)),
      );
    case 'checkbox':
    case 'switch':
      return _toggleWithLabel(const Checkbox(value: false, onChanged: null), caption, fg);
    case 'radio_group':
    case 'checkbox_group':
      final options = optionLabels ?? const [];
      if (options.isEmpty) {
        // No options configured yet in the Window Designer - one inert
        // toggle so the control's TYPE still reads clearly on the canvas,
        // same placeholder level as the plain 'checkbox'/'radio' case below.
        return _toggleWithLabel(
          controlType == 'radio_group'
              ? IgnorePointer(child: RadioGroup<int>(groupValue: 0, onChanged: (_) {}, child: const Radio<int>(value: 0)))
              : const Checkbox(value: false, onChanged: null),
          caption,
          fg,
        );
      }
      // A radio/checkbox GROUP is its own caption (the group's title) above
      // the real configured options below - unlike the single 'checkbox'/
      // 'radio' case, which is just one toggle beside its own caption with
      // no separate group title. Wrapped in a vertical scroll view (not a
      // FittedBox scale-down like the button/toggle cases) since a variable-
      // length option list genuinely may need more room than its designed
      // box - scrolling keeps every option legible instead of shrinking
      // text to illegibility to force a fit.
      return SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (caption.isNotEmpty) ...[
              Text(caption, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: fg)),
              const SizedBox(height: 4),
            ],
            if (controlType == 'radio_group')
              IgnorePointer(
                child: RadioGroup<int>(
                  groupValue: 0,
                  onChanged: (_) {},
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      for (var i = 0; i < options.length; i++)
                        Row(mainAxisSize: MainAxisSize.min, children: [
                          Radio<int>(value: i),
                          // Flexible (not a bare Text) so a caption longer
                          // than the control's designed width ellipsizes
                          // instead of hard-overflowing the Row - confirmed
                          // via a real flutter_test render, not just
                          // dart analyze, which never caught this.
                          Flexible(child: Text(options[i], overflow: TextOverflow.ellipsis, style: TextStyle(color: fg))),
                        ]),
                    ],
                  ),
                ),
              )
            else
              for (final label in options)
                Row(mainAxisSize: MainAxisSize.min, children: [
                  Checkbox(value: false, onChanged: null),
                  Flexible(child: Text(label, overflow: TextOverflow.ellipsis, style: TextStyle(color: fg))),
                ]),
          ],
        ),
      );
    case 'radio':
      return _toggleWithLabel(
        IgnorePointer(
          child: RadioGroup<int>(groupValue: 0, onChanged: (_) {}, child: const Radio<int>(value: 0)),
        ),
        caption,
        fg,
      );
    case 'divider':
      return const Divider();
    case 'spacer':
      return const SizedBox.shrink();
    case 'link':
      return TextButton(
        onPressed: null,
        style: TextButton.styleFrom(foregroundColor: fg, disabledForegroundColor: fg),
        child: Text(caption),
      );
    case 'image':
    case 'image_upload':
      final image = _decodeFullImage(iconData);
      return image ??
          Container(
            color: bg,
            alignment: Alignment.center,
            child: Icon(Icons.image_outlined, color: fg ?? Colors.grey.shade500),
          );
    case 'table':
      final columns = tableColumns ?? const [];
      if (columns.isEmpty) {
        return Card(
          child: ListTile(
            leading: const Icon(Icons.table_chart_outlined),
            title: Text(caption),
            subtitle: const Text('Table control - no columns configured'),
          ),
        );
      }
      return _RudimentaryTable(columns: columns, headerBackgroundColor: bg, headerTextColor: fg);
    case 'textarea':
      // expands:true needs a bounded-height ancestor to fill - guaranteed by
      // _fieldWithLabel's Row/Column now both stretching their cross axis
      // (see the comment there), which a plain single-line TextField never
      // needed before this control type existed.
      return _fieldWithLabel(
        caption,
        labelPosition,
        labelWidth ?? 100,
        const TextField(
          enabled: false,
          expands: true,
          maxLines: null,
          minLines: null,
          textAlignVertical: TextAlignVertical.top,
          decoration: InputDecoration(border: OutlineInputBorder(), contentPadding: EdgeInsets.all(8)),
        ),
      );
    case 'dropdown':
    case 'multiselect':
    case 'autocomplete':
      // Rudimentary placeholder, same level as every other type here - no
      // real option list/data binding yet, just a disabled field that reads
      // unmistakably as a combo box (dropdown chevron) rather than a plain
      // text input.
      return _fieldWithLabel(
        caption,
        labelPosition,
        labelWidth ?? 100,
        const TextField(
          enabled: false,
          decoration: InputDecoration(border: OutlineInputBorder(), suffixIcon: Icon(Icons.arrow_drop_down)),
        ),
      );
    default:
      return _fieldWithLabel(
        caption,
        labelPosition,
        labelWidth ?? 100,
        const TextField(enabled: false, decoration: InputDecoration(border: OutlineInputBorder())),
      );
  }
}

/// Draws [caption] as its own label next to [input], sized to [labelWidth]
/// when beside it - matching how the Window Designer canvas shows
/// field-style controls (label_position 'top' puts the label above,
/// 'left'/'right' puts it beside at a fixed width) - instead of Material's
/// floating InputDecoration.labelText, which sits INSIDE the field border,
/// sized to its text, rather than as a genuinely separate, fixed-width
/// element.
/// Draws [toggle] (a Checkbox/Radio) beside [caption] - `FittedBox(scaleDown)`
/// over a `mainAxisSize.min` Row is the same safety net the 'button' case
/// above uses: a checkbox/radio control can legitimately be designed only
/// as wide as the toggle glyph itself (WinDev checkboxes are often just
/// that narrow, with the real label living in a separate static_text next
/// to it), and Checkbox/Radio's default Material tap target (48x48) alone
/// is already wider than that - a plain Row there hard-overflows
/// (confirmed via a real `flutter test` render, not just `dart analyze`,
/// which never caught it). Scaling down instead of overflowing keeps the
/// control visible and correctly typed at any designed size, matching how
/// the button case already treats the same problem.
Widget _toggleWithLabel(Widget toggle, String caption, Color? fg) {
  return FittedBox(
    fit: BoxFit.scaleDown,
    alignment: Alignment.centerLeft,
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        toggle,
        if (caption.isNotEmpty) ...[
          const SizedBox(width: 4),
          Text(caption, style: TextStyle(color: fg)),
        ],
      ],
    ),
  );
}

Widget _fieldWithLabel(String caption, String labelPosition, double labelWidth, Widget input) {
  if (labelPosition == 'none' || caption.isEmpty) {
    return input;
  }
  final label = Text(caption, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500));
  if (labelPosition == 'left' || labelPosition == 'right') {
    final fieldFirst = labelPosition == 'right';
    // Row's own height always matches the control's full designed box
    // (fixed by the caller's SizedBox.expand further up) regardless of this
    // alignment - CrossAxisAlignment only decides how much of that height
    // each CHILD actually gets. `.center` (the previous setting) hands
    // children only their own natural/intrinsic height and centers them,
    // which for a short single-line field left plenty of visible padding
    // above/below - harmless there, but for a 'textarea' control it meant
    // the multi-line input never grew past one line's height and floated
    // in the middle of its box instead of filling and starting at the top.
    // `.stretch` gives every child the box's FULL height, which a
    // single-line field absorbs as extra internal padding (still renders
    // correctly) and which `expands: true` textareas need in order to fill
    // their designed height at all.
    final labelBox = SizedBox(width: labelWidth, child: label);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: fieldFirst
          ? [Expanded(child: input), const SizedBox(width: 8), labelBox]
          : [labelBox, const SizedBox(width: 8), Expanded(child: input)],
    );
  }
  // 'top' (also the default for any other/unrecognized value)
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [label, const SizedBox(height: 4), Expanded(child: input)],
  );
}

/// Decodes a `data:image/...;base64,...` URI into a small inline image, or
/// null if [dataUri] is absent/malformed - callers fall back to no icon
/// rather than a broken one. When [stateCount] > 1, [dataUri] is a WinDev
/// multi-state sprite (state bitmaps concatenated side by side); only the
/// first (Idle) frame is shown, by rendering the whole strip at
/// `stateCount` times the target size and clipping to just one frame's
/// width - the same crop the Window Designer canvas preview uses (there via
/// CSS background-size/-position).
Widget? _decodeDataUriImage(String? dataUri, {double size = 20, int stateCount = 1}) {
  if (dataUri == null || dataUri.isEmpty) {
    return null;
  }
  final commaIndex = dataUri.indexOf(',');
  if (commaIndex == -1) {
    return null;
  }
  try {
    final bytes = base64Decode(dataUri.substring(commaIndex + 1));
    if (stateCount <= 1) {
      return Image.memory(bytes, width: size, height: size, fit: BoxFit.contain);
    }
    return ClipRect(
      child: Align(
        alignment: Alignment.centerLeft,
        widthFactor: 1 / stateCount,
        child: Image.memory(bytes, width: size * stateCount, height: size, fit: BoxFit.fill),
      ),
    );
  } catch (_) {
    return null;
  }
}

/// Decodes a `data:image/...;base64,...` URI for a full 'image'/
/// 'image_upload' control, or a button's whole-surface background_image -
/// no fixed size (fills whatever box the caller ultimately puts it in,
/// typically via its own FittedBox/SizedBox.expand). [stateCount] > 1 crops
/// to just the first (Idle) frame of a WinDev multi-state sprite, same
/// concept and same ClipRect+Align technique as _decodeDataUriImage (button
/// icons) - but WITHOUT a fixed target size baked in here: this widget
/// reports its natural, single-frame size, and the caller's own FittedBox
/// does the final scale-to-fit into the actual box. A plain 'image'/
/// 'image_upload' control (stateCount 1, the default) is unaffected - it
/// was never a state sprite to begin with.
Widget? _decodeFullImage(String? dataUri, {int stateCount = 1}) {
  if (dataUri == null || dataUri.isEmpty) {
    return null;
  }
  final commaIndex = dataUri.indexOf(',');
  if (commaIndex == -1) {
    return null;
  }
  try {
    final bytes = base64Decode(dataUri.substring(commaIndex + 1));
    if (stateCount <= 1) {
      return Image.memory(bytes, fit: BoxFit.contain);
    }
    return ClipRect(
      child: Align(
        alignment: Alignment.centerLeft,
        widthFactor: 1 / stateCount,
        child: Image.memory(bytes),
      ),
    );
  } catch (_) {
    return null;
  }
}

/// Parses a "#RRGGBB" (or "#RGB" short form, or without the leading "#")
/// hex string into a [Color], or null if [hex] is absent/malformed - so
/// callers can fall back to Flutter's own default styling rather than a
/// broken color.
Color? _hexToColor(String? hex) {
  if (hex == null || hex.isEmpty) {
    return null;
  }
  var clean = hex.startsWith('#') ? hex.substring(1) : hex;
  if (clean.length == 3) {
    clean = clean.split('').map((c) => c + c).join();
  }
  if (clean.length != 6) {
    return null;
  }
  final value = int.tryParse(clean, radix: 16);
  if (value == null) {
    return null;
  }
  return Color(0xFF000000 | value);
}

/// Same parsing as [_hexToColor], but for callers like `ColoredBox.color`
/// that require a non-nullable [Color] - an absent/malformed hex becomes
/// fully transparent (shows whatever's already behind it) rather than
/// forcing every caller to null-check first.
Color hexToColorOrTransparent(String? hex) => _hexToColor(hex) ?? Colors.transparent;

Alignment _alignmentFor(String? h, String? v) {
  double x = 0;
  if (h == 'left') {
    x = -1;
  } else if (h == 'right') {
    x = 1;
  }
  double y = 0;
  if (v == 'top') {
    y = -1;
  } else if (v == 'bottom') {
    y = 1;
  }
  return Alignment(x, y);
}

TextAlign _textAlignFor(String? h) {
  switch (h) {
    case 'left':
      return TextAlign.left;
    case 'right':
      return TextAlign.right;
    default:
      return TextAlign.center;
  }
}

/// Wraps [child] in a bordered "group box" frame - a plain bordered box
/// with, when [caption] is non-empty, a small label overlapping the top
/// border (the classic fieldset/legend look), matching how a WinDev
/// group_box reads. Used for the 'group_box' Window Designer element type;
/// a plain 'container' element renders [child] with no frame at all.
Widget buildGroupBoxFrame(String caption, Widget child) {
  return Stack(
    clipBehavior: Clip.none,
    children: [
      Positioned.fill(
        top: 8,
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade400),
            borderRadius: BorderRadius.circular(4),
          ),
          padding: const EdgeInsets.fromLTRB(8, 12, 8, 8),
          child: child,
        ),
      ),
      if (caption.isNotEmpty)
        Positioned(
          left: 12,
          top: 0,
          child: Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(caption, style: const TextStyle(fontSize: 12)),
          ),
        ),
    ],
  );
}

/// The window's own background - a full-image background (when the Window
/// Designer's "Background Image" is set) takes priority over the plain
/// "Background Color", matching how the Window Designer canvas itself
/// layers the two (see WindowDesignerPanel's background_image upload
/// replacing the plain color swatch). Returns null when neither is set, so
/// callers can skip adding a background layer entirely rather than adding
/// an invisible transparent one.
Widget? buildWindowBackground(String? backgroundColor, String? backgroundImageDataUri) {
  final image = _decodeFullImage(backgroundImageDataUri);
  if (image != null) {
    return Positioned.fill(child: FittedBox(fit: BoxFit.cover, child: image));
  }
  final color = _hexToColor(backgroundColor);
  if (color != null) {
    return Positioned.fill(child: ColoredBox(color: color));
  }
  return null;
}

/// A horizontally-scrolling tab strip with explicit prev/next arrow
/// buttons, for a [tab_container] with more tabs than fit at once -
/// mirroring WinDev's own left/right navigation arrows next to the tab
/// strip. Material's `TabBar(isScrollable: true)` alone only supports
/// scrolling by dragging (no exposed `ScrollController` in its public API
/// to drive from an external button), so this is a small custom tab strip
/// instead of `TabBar` - it still drives the same [controller] (a real
/// `TabController`, e.g. from `DefaultTabController.of(context)`) so
/// `TabBarView` stays perfectly in sync, it just draws its own tab buttons
/// and owns its own `ScrollController` so the arrows have something to
/// animate.
class TabStripWithNav extends StatefulWidget {
  const TabStripWithNav({
    required this.controller,
    required this.labels,
    this.stripHeight = 46,
    this.activeBackgroundColor,
    this.inactiveBackgroundColor,
    this.activeTextColor,
    this.inactiveTextColor,
    this.fontFamily,
    this.fontSize,
    this.fontBold = false,
    this.fontItalic = false,
    this.fontUnderline = false,
    this.fontStrikeout = false,
    super.key,
  });

  final TabController controller;
  final List<String> labels;
  // The tab_container's own tab_strip_height Window Designer field - not
  // exported by WinDev (no matching field there), purely a Flutter-side
  // visual knob. 46 (this widget's original hardcoded value) only applies
  // if a caller genuinely omits this; the template always passes a real
  // value (see UiWindowElement::toGTreeArray()'s own `?? 28` fallback).
  final double stripHeight;
  // Hex strings ("#RRGGBB"), same convention as buildRudimentaryControl's
  // own backgroundColor/textColor params - all from the tab_container's own
  // tab_active_*/tab_inactive_*/tab_font_* Window Designer fields. Null/
  // false (their defaults) keep today's plain underline-only look exactly
  // as it was, so an unconfigured tab_container isn't affected by this at
  // all.
  final String? activeBackgroundColor;
  final String? inactiveBackgroundColor;
  final String? activeTextColor;
  final String? inactiveTextColor;
  final String? fontFamily;
  final double? fontSize;
  final bool fontBold;
  final bool fontItalic;
  final bool fontUnderline;
  final bool fontStrikeout;

  @override
  State<TabStripWithNav> createState() => _TabStripWithNavState();
}

class _TabStripWithNavState extends State<TabStripWithNav> {
  final _scrollController = ScrollController();
  static const _scrollStep = 140.0;

  @override
  void initState() {
    super.initState();
    // Repaints the active tab's underline as the user taps through
    // TabBarView (e.g. via a swipe) as well as via this strip's own
    // buttons, and repaints the arrows' enabled/disabled state as the
    // strip is dragged or scrolled by the buttons.
    widget.controller.addListener(_onChanged);
    _scrollController.addListener(_onChanged);
    // The scroll view isn't attached yet during this very first build (so
    // _canScrollLeft/_canScrollRight both read as false regardless of
    // actual content width) - one rebuild right after the first frame picks
    // up its real, now-attached ScrollMetrics so a genuinely overflowing
    // tab strip starts with its right arrow correctly enabled instead of
    // needing a drag/tap first.
    WidgetsBinding.instance.addPostFrameCallback((_) => _onChanged());
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onChanged);
    _scrollController.removeListener(_onChanged);
    _scrollController.dispose();
    super.dispose();
  }

  void _onChanged() {
    if (mounted) setState(() {});
  }

  void _scrollBy(double delta) {
    if (!_scrollController.hasClients) return;
    final position = _scrollController.position;
    final target = (_scrollController.offset + delta).clamp(position.minScrollExtent, position.maxScrollExtent);
    _scrollController.animateTo(target, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
  }

  bool get _canScrollLeft => _scrollController.hasClients && _scrollController.offset > _scrollController.position.minScrollExtent;

  bool get _canScrollRight => _scrollController.hasClients && _scrollController.offset < _scrollController.position.maxScrollExtent;

  Widget _tabButton(BuildContext context, int i, Color primary) {
    final isActive = widget.controller.index == i;
    // The underline is the ORIGINAL, always-on indicator (default primary
    // color when nothing's configured) - background/text color below are
    // additive on top of it, not a replacement, so an unconfigured
    // tab_container keeps exactly its previous look.
    final backgroundColor = _hexToColor(isActive ? widget.activeBackgroundColor : widget.inactiveBackgroundColor);
    final textColor = _hexToColor(isActive ? widget.activeTextColor : widget.inactiveTextColor) ?? (isActive ? primary : null);
    return InkWell(
      onTap: () => widget.controller.animateTo(i),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: backgroundColor,
          border: Border(
            bottom: BorderSide(color: isActive ? primary : Colors.transparent, width: 2),
          ),
        ),
        child: Text(
          widget.labels[i],
          style: TextStyle(
            color: textColor,
            // Bold explicitly set wins outright; otherwise keep the
            // original default (active tabs read slightly heavier even
            // with no font config at all).
            fontWeight: widget.fontBold ? FontWeight.bold : (isActive ? FontWeight.w600 : FontWeight.normal),
            fontFamily: widget.fontFamily,
            fontSize: widget.fontSize,
            fontStyle: widget.fontItalic ? FontStyle.italic : FontStyle.normal,
            decoration: TextDecoration.combine([
              if (widget.fontUnderline) TextDecoration.underline,
              if (widget.fontStrikeout) TextDecoration.lineThrough,
            ]),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return SizedBox(
      height: widget.stripHeight,
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: _canScrollLeft ? () => _scrollBy(-_scrollStep) : null,
          ),
          Expanded(
            child: SingleChildScrollView(
              controller: _scrollController,
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (var i = 0; i < widget.labels.length; i++) _tabButton(context, i, primary),
                ],
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: _canScrollRight ? () => _scrollBy(_scrollStep) : null,
          ),
        ],
      ),
    );
  }
}

/// A rudimentary 'table' control - real column captions/widths so far-right
/// columns can be judged, no cell data yet (that needs real procedures/
/// events, a later generation step); 100 empty preview rows so the table
/// fills its full designed height instead of stopping a few rows in.
///
/// Axis nesting matters here and is easy to get backwards: the HORIZONTAL
/// scroll must be the OUTERMOST one, wrapping header+body together (so they
/// scroll sideways in lockstep with no manual sync needed), with the
/// VERTICAL scroll nested inside, bounded by `Expanded`. Putting it the
/// other way around (vertical outside, horizontal inside) - which an
/// earlier version of this widget did - looks equivalent but isn't: a
/// horizontal `SingleChildScrollView` only gets a TIGHT, bounded height from
/// its own parent (the cross axis of a horizontal scroll is always tight,
/// never unbounded), whereas a VERTICAL `SingleChildScrollView` hands its
/// child UNBOUNDED height. So if the horizontal scroller is the nested one,
/// it - and the horizontal scrollbar attached to it - grows to the full
/// height of all 100 rows, landing the horizontal scrollbar at the bottom
/// of the ROW LIST instead of the bottom of the visible box (reachable only
/// after scrolling all the way down vertically first). With horizontal
/// outermost, its own height is always exactly the space `Expanded` (from
/// the caller) actually gives this widget, so the horizontal scrollbar sits
/// at the bottom of the VISIBLE table, always - the vertical one nested
/// inside is what stays properly viewport-bounded via its own `Expanded`.
class _RudimentaryTable extends StatefulWidget {
  const _RudimentaryTable({required this.columns, this.headerBackgroundColor, this.headerTextColor});

  final List<TableColumnSpec> columns;
  final Color? headerBackgroundColor;
  final Color? headerTextColor;

  @override
  State<_RudimentaryTable> createState() => _RudimentaryTableState();
}

class _RudimentaryTableState extends State<_RudimentaryTable> {
  final _horizontalController = ScrollController();
  final _verticalController = ScrollController();

  @override
  void dispose() {
    _horizontalController.dispose();
    _verticalController.dispose();
    super.dispose();
  }

  Widget _cell(String text, double width, {bool header = false}) {
    return Container(
      width: width,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        border: Border(
          right: BorderSide(color: Colors.grey.shade300),
          bottom: BorderSide(color: Colors.grey.shade300),
        ),
        color: header ? (widget.headerBackgroundColor ?? Colors.grey.shade200) : null,
      ),
      child: Text(
        text,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontWeight: header ? FontWeight.w600 : FontWeight.normal,
          color: header ? widget.headerTextColor : null,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Horizontal is the OUTERMOST scroll (see the class doc comment for
    // why) - its own height comes straight from this widget's own incoming
    // constraints (tight, from the caller's SizedBox.expand), so its
    // Scrollbar always sits at the bottom of the visible table, never the
    // bottom of the row list.
    return Scrollbar(
      controller: _horizontalController,
      thumbVisibility: true,
      notificationPredicate: (notification) => notification.depth == 0,
      child: SingleChildScrollView(
        controller: _horizontalController,
        scrollDirection: Axis.horizontal,
        child: Column(
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [for (final col in widget.columns) _cell(col.caption, col.width, header: true)],
            ),
            // Expanded gives the body a BOUNDED height matching the
            // control's own designed size (not growing to fit 100 rows) -
            // this Column receives a TIGHT height from the horizontal
            // SingleChildScrollView above (its cross axis is always tight,
            // never unbounded), so Expanded here has a real, fixed height
            // to divide "header row" from "everything else" with.
            Expanded(
              child: Scrollbar(
                controller: _verticalController,
                thumbVisibility: true,
                child: SingleChildScrollView(
                  controller: _verticalController,
                  scrollDirection: Axis.vertical,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      for (var previewRow = 0; previewRow < 100; previewRow++)
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [for (final col in widget.columns) _cell('', col.width)],
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
