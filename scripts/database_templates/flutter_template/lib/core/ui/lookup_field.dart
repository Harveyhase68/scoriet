import 'package:flutter/material.dart';

/// One selectable entry in a lookup combobox: a stable [key] (the FK value
/// that gets stored) and a human-readable [label] (usually a `*_display`
/// column). SCORIET: reused for every foreign-key field.
class LookupOption<K> {
  const LookupOption(this.key, this.label);
  final K key;
  final String label;
}

/// A foreign-key selector: a combobox populated from the referenced table,
/// with an optional inline "add new" button.
///
/// SCORIET: the standard widget for every FK column in a form. The parent
/// (form state) owns the selected value and passes it back via [onChanged];
/// [onAdd] opens the referenced entity's create form.
class LookupField<K> extends StatelessWidget {
  const LookupField({
    super.key,
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
    this.onAdd,
    this.loading = false,
    this.validator,
    this.width = 380,
  });

  final String label;
  final K? value;
  final List<LookupOption<K>> options;
  final ValueChanged<K?> onChanged;

  /// When non-null, a "+" button is shown that should open the referenced
  /// entity's create form (and, on success, refresh + select the new row).
  final VoidCallback? onAdd;

  final bool loading;
  final String? Function(K?)? validator;
  final double width;

  @override
  Widget build(BuildContext context) {
    // Only pass a value the dropdown actually knows about, else it asserts.
    final selectable = value != null && options.any((o) => o.key == value);

    return SizedBox(
      width: width,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: DropdownButtonFormField<K>(
              // Re-create the FormField when the selected value changes so
              // programmatic selection (e.g. after "add") is reflected.
              key: ValueKey('$label:$value'),
              initialValue: selectable ? value : null,
              isExpanded: true,
              decoration: InputDecoration(
                labelText: label,
                suffixIcon: loading
                    ? const Padding(
                        padding: EdgeInsets.all(12),
                        child: SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      )
                    : null,
              ),
              items: [
                for (final o in options)
                  DropdownMenuItem(
                    value: o.key,
                    child: Text(o.label, overflow: TextOverflow.ellipsis),
                  ),
              ],
              onChanged: onChanged,
              validator: validator,
            ),
          ),
          if (onAdd != null) ...[
            const SizedBox(width: 4),
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: IconButton.outlined(
                tooltip: 'Neu anlegen',
                icon: const Icon(Icons.add),
                onPressed: onAdd,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
