import 'dart:typed_data';

/// Every `record<...>` type declared in the Window Designer's project-level
/// "Structures" editor (see UiProjectStruct), one Dart class per struct.
///
/// SCORIET: a struct's Dart class name is its SML name VERBATIM - no case
/// conversion (see UltimateTemplateController::smlTypeToDart()'s `record<N>`
/// handling) - so `array<record<stproducts>>` in SML and the class actually
/// named `stproducts` below always agree. Every field is a plain mutable
/// property with a language-appropriate zero-value default (never a
/// fabricated one - see UltimateTemplateController::defaultDartValue()), so
/// every struct has an implicit no-arg constructor (`stproducts()`) that
/// just works, matching WinDev's own "declare a record variable, its fields
/// start at their type's default" semantics.
{:for nmaxstructs:}
class {:struct.name:} {
{:for nmaxfields:}
{:if structfield.dart_nullable:}
  {:structfield.dart_type:}? {:structfield.name:};
{:else:}
  {:structfield.dart_type:} {:structfield.name:} = {:structfield.dart_default:};
{:endif:}
{:endfor:}
}

{:endfor:}
