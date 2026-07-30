import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/locale_provider.dart';
import '../state/auth_providers.dart';
import 'widgets/auth_scaffold.dart';

/// Step 2 — Registration. Creates a new user (Argon2id-hashed password) and
/// signs them in; the AuthGate then swaps in the app.
class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  String _language = '{:defaultlanguage:}';
  bool _obscure = true;
  bool _busy = false;
  String? _error;

  // Every language actually configured for this project (code -> native
  // name), not a fixed guess — mirrors `project.lang[]`.
  static const Map<String, String> _languages = {
{:code:}
var langs = gtree[0].project[0].lang || [];
function dartString(s) { return JSON.stringify(s === null || s === undefined ? '' : String(s)); }
var out = langs.map(function (l) {
  return '    ' + dartString(l.code) + ': ' + dartString(l.native_name) + ',';
}).join('\n');
sContentResult += out + '\n';
return sContentResult;
{:codeend:}
  };

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).register(
            name: _name.text.trim(),
            email: _email.text.trim(),
            password: _password.text,
            language: _language,
          );
      if (mounted) Navigator.of(context).pop(); // gate takes over
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = '${s(ref, 'error_connection_prefix')}$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: s(ref, 'register_title'),
      subtitle: s(ref, 'register_subtitle').replaceFirst('{name}', '{:projectname:}'),
      children: [
        Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_error != null) AuthBanner(message: _error!),
              TextFormField(
                controller: _name,
                autofocus: true,
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(
                  labelText: s(ref, 'name_label'),
                  prefixIcon: const Icon(Icons.person_outline),
                ),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? s(ref, 'name_required') : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  labelText: s(ref, 'email_label'),
                  prefixIcon: const Icon(Icons.mail_outline),
                ),
                validator: (v) => (v == null || !v.contains('@'))
                    ? s(ref, 'email_invalid')
                    : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _language,
                decoration: InputDecoration(
                  labelText: s(ref, 'language_label'),
                  prefixIcon: const Icon(Icons.language),
                ),
                items: [
                  for (final e in _languages.entries)
                    DropdownMenuItem(value: e.key, child: Text(e.value)),
                ],
                onChanged: (v) =>
                    setState(() => _language = v ?? kProjectDefaultLanguage),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _password,
                obscureText: _obscure,
                decoration: InputDecoration(
                  labelText: s(ref, 'password_label'),
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(
                        _obscure ? Icons.visibility : Icons.visibility_off),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
                validator: (v) => (v == null || v.length < 8)
                    ? s(ref, 'password_min_length')
                    : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _confirm,
                obscureText: _obscure,
                decoration: InputDecoration(
                  labelText: s(ref, 'password_confirm_label'),
                  prefixIcon: const Icon(Icons.lock_outline),
                ),
                validator: (v) => v != _password.text
                    ? s(ref, 'password_mismatch')
                    : null,
                onFieldSubmitted: (_) => _submit(),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _busy ? null : _submit,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: _busy
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(s(ref, 'register_button')),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(s(ref, 'already_have_account')),
                  TextButton(
                    onPressed: _busy ? null : () => Navigator.of(context).pop(),
                    child: Text(s(ref, 'login_title')),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
