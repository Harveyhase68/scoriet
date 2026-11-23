import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/locale_provider.dart';
import '../state/auth_providers.dart';
import '../state/password_reset_controller.dart';
import 'widgets/auth_scaffold.dart';

/// Step 3 — Forgot password. Two phases in one screen:
///  1. request  → generate a token, email it via the mail hook
///  2. reset    → enter token + new password
class ForgotPasswordPage extends ConsumerStatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  ConsumerState<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

enum _Phase { request, reset, done }

class _ForgotPasswordPageState extends ConsumerState<ForgotPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _token = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();

  _Phase _phase = _Phase.request;
  bool _busy = false;
  String? _error;
  String? _info;
  String? _debugToken; // shown only because the default mail sender is debug

  @override
  void dispose() {
    _email.dispose();
    _token.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _request() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
      _info = null;
    });
    try {
      final token = await ref
          .read(passwordResetControllerProvider)
          .requestReset(_email.text.trim());
      setState(() {
        _phase = _Phase.reset;
        _debugToken = token; // null if no such user; UI stays neutral
        _info = s(ref, 'forgot_password_info');
      });
    } catch (e) {
      setState(() => _error = '${s(ref, 'error_prefix')}$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _reset() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(passwordResetControllerProvider).resetPassword(
            email: _email.text.trim(),
            token: _token.text.trim(),
            newPassword: _password.text,
          );
      setState(() {
        _phase = _Phase.done;
        _info = s(ref, 'password_changed_info');
      });
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = '${s(ref, 'error_prefix')}$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: s(ref, 'forgot_password_title'),
      subtitle: switch (_phase) {
        _Phase.request => s(ref, 'forgot_password_subtitle_request'),
        _Phase.reset => s(ref, 'forgot_password_subtitle_reset'),
        _Phase.done => null,
      },
      children: [
        Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_error != null) AuthBanner(message: _error!),
              if (_info != null) AuthBanner(message: _info!, error: false),
              if (_debugToken != null)
                AuthBanner(
                  message: '${s(ref, 'debug_token_prefix')}$_debugToken',
                  error: false,
                ),
              if (_phase != _Phase.done) ..._fields(),
              const SizedBox(height: 20),
              _primaryButton(),
              const SizedBox(height: 8),
              TextButton(
                onPressed:
                    _busy ? null : () => Navigator.of(context).maybePop(),
                child: Text(s(ref, 'back_to_login')),
              ),
            ],
          ),
        ),
      ],
    );
  }

  List<Widget> _fields() {
    return [
      TextFormField(
        controller: _email,
        enabled: _phase == _Phase.request,
        keyboardType: TextInputType.emailAddress,
        decoration: InputDecoration(
          labelText: s(ref, 'email_label'),
          prefixIcon: const Icon(Icons.mail_outline),
        ),
        validator: (v) =>
            (v == null || !v.contains('@')) ? s(ref, 'email_invalid') : null,
      ),
      if (_phase == _Phase.reset) ...[
        const SizedBox(height: 16),
        TextFormField(
          controller: _token,
          decoration: InputDecoration(
            labelText: s(ref, 'reset_code_label'),
            prefixIcon: const Icon(Icons.vpn_key_outlined),
          ),
          validator: (v) =>
              (v == null || v.trim().isEmpty) ? s(ref, 'reset_code_required') : null,
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _password,
          obscureText: true,
          decoration: InputDecoration(
            labelText: s(ref, 'new_password_label'),
            prefixIcon: const Icon(Icons.lock_outline),
          ),
          validator: (v) =>
              (v == null || v.length < 8) ? s(ref, 'password_min_length') : null,
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _confirm,
          obscureText: true,
          decoration: InputDecoration(
            labelText: s(ref, 'password_confirm_label'),
            prefixIcon: const Icon(Icons.lock_outline),
          ),
          validator: (v) =>
              v != _password.text ? s(ref, 'password_mismatch') : null,
        ),
      ],
    ];
  }

  Widget _primaryButton() {
    if (_phase == _Phase.done) {
      return FilledButton(
        onPressed: () => Navigator.of(context).maybePop(),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Text(s(ref, 'to_login')),
        ),
      );
    }
    final label =
        _phase == _Phase.request ? s(ref, 'request_code') : s(ref, 'set_password');
    return FilledButton(
      onPressed: _busy ? null : (_phase == _Phase.request ? _request : _reset),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: _busy
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(strokeWidth: 2))
            : Text(label),
      ),
    );
  }
}
