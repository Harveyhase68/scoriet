import 'package:flutter/material.dart';

/// A live binding between one control's SML name (its `source_name` in the
/// Window Designer) and its actual Flutter widget state - exactly one
/// instance per control listed in a window's generated `_controls` map,
/// created once in the window's `initState()`.
///
/// Two shapes, chosen by the generator per control type:
///   - `SmlControlBinding.text(controller)` for text-like controls (text,
///     textarea, password, number, decimal, currency, email, phone,
///     autocomplete) - `value` reads/writes the TextEditingController
///     directly, so the on-screen text field and `ui.get/set("Name","Value")`
///     are always the same source of truth.
///   - `SmlControlBinding.value(initial, onChanged: ...)` for everything
///     else (checkbox, dropdown, switch, slider, date, ...) - a plain
///     mutable value plus a callback the generator wires to the window's
///     own `setState()`, so an SML `set` that changes a control's value
///     actually repaints it.
///
/// `getProperty`/`setProperty` implement the generic, control-type-agnostic
/// half of `ui.get`/`ui.set` (see sml_ui_context.dart) - a handful of
/// properties common to most controls (Value/Caption/Enabled/Visible).
/// An uncatalogued property name is never a crash - `getProperty` returns
/// null and `setProperty` is a no-op, matching this whole project's "never
/// guess, never fabricate" rule; a real generated app that needs a specific
/// property this doesn't model yet is exactly the kind of gap this session
/// keeps deliberately visible rather than silently wrong.
class SmlControlBinding {
  final TextEditingController? controller;
  dynamic _value;
  bool enabled;
  bool visible;
  String caption;
  final VoidCallback? onChanged;

  SmlControlBinding.text(
    this.controller, {
    this.enabled = true,
    this.visible = true,
    this.caption = '',
    this.onChanged,
  }) : _value = null;

  SmlControlBinding.value(
    dynamic initial, {
    this.enabled = true,
    this.visible = true,
    this.caption = '',
    this.onChanged,
  })  : controller = null,
        _value = initial;

  dynamic get value => controller != null ? controller!.text : _value;

  set value(dynamic v) {
    if (controller != null) {
      final text = v?.toString() ?? '';
      if (controller!.text != text) {
        controller!.text = text;
      }
    } else {
      _value = v;
      onChanged?.call();
    }
  }

  dynamic getProperty(String property) {
    switch (property.toLowerCase()) {
      case 'value':
        return value;
      case 'caption':
        return caption;
      case 'enabled':
        return enabled;
      case 'visible':
        return visible;
      default:
        return null; // TODO: property not modeled yet
    }
  }

  void setProperty(String property, dynamic value) {
    switch (property.toLowerCase()) {
      case 'value':
        this.value = value;
        return;
      case 'caption':
        caption = value?.toString() ?? '';
        onChanged?.call();
        return;
      case 'enabled':
        enabled = value == true;
        onChanged?.call();
        return;
      case 'visible':
        visible = value == true;
        onChanged?.call();
        return;
      default:
        return; // TODO: property not modeled yet - deliberately a no-op, never a crash
    }
  }
}
