import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/locale_provider.dart';
import '../state/auth_providers.dart';
import 'widgets/auth_scaffold.dart';

/// Shown by the AuthGate after a correct password when the account has 2FA
/// enabled. Accepts a TOTP code or a one-time recovery code.
class TwoFactorChallengePage extends ConsumerStatefulWidget {
  const TwoFactorChallengePage({super.key});

  @override
  ConsumerState<TwoFactorChallengePage> createState() =>
      _TwoFactorChallengePageState();
}

class _TwoFactorChallengePageState
    extends ConsumerState<TwoFactorChallengePage> {
  final _code = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final code = _code.text.trim();
    if (code.isEmpty) {
      setState(() => _error = s(ref, 'code_required'));
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).verifyTwoFactor(code);
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
      title: s(ref, 'two_factor_challenge_title'),
      subtitle: s(ref, 'two_factor_challenge_subtitle'),
      children: [
        if (_error != null) AuthBanner(message: _error!),
        TextField(
          controller: _code,
          autofocus: true,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 24, letterSpacing: 6),
          keyboardType: TextInputType.text,
          inputFormatters: [LengthLimitingTextInputFormatter(20)],
          decoration: const InputDecoration(hintText: '000000'),
          onSubmitted: (_) => _submit(),
        ),
        const SizedBox(height: 20),
        FilledButton(
          onPressed: _busy ? null : _submit,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: _busy
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : Text(s(ref, 'confirm')),
          ),
        ),
        const SizedBox(height: 8),
        TextButton(
          onPressed: _busy
              ? null
              : () => ref.read(authControllerProvider.notifier).cancelTwoFactor(),
          child: Text(s(ref, 'cancel')),
        ),
      ],
    );
  }
}
