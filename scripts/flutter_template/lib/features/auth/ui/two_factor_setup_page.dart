import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../core/i18n/locale_provider.dart';
import '../state/account_controller.dart';
import '../state/auth_providers.dart';

/// Enables TOTP 2FA: scan the QR (or enter the secret), confirm a code, then
/// store & show one-time recovery codes.
class TwoFactorSetupPage extends ConsumerStatefulWidget {
  const TwoFactorSetupPage({super.key});

  @override
  ConsumerState<TwoFactorSetupPage> createState() =>
      _TwoFactorSetupPageState();
}

class _TwoFactorSetupPageState extends ConsumerState<TwoFactorSetupPage> {
  late final TwoFactorSetup _setup;
  final _code = TextEditingController();
  bool _busy = false;
  String? _error;
  List<String>? _recoveryCodes;

  @override
  void initState() {
    super.initState();
    _setup = ref.read(accountControllerProvider).beginTwoFactorSetup();
  }

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final codes = await ref.read(accountControllerProvider).confirmTwoFactor(
            secret: _setup.secret,
            code: _code.text,
          );
      setState(() => _recoveryCodes = codes);
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Fehler: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(s(ref, 'two_factor_setup_title'))),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: _recoveryCodes == null ? _setupCard() : _recoveryCard(),
          ),
        ),
      ),
    );
  }

  Widget _setupCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(s(ref, 'step1_scan_qr'),
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(s(ref, 'scan_qr_instructions')),
            const SizedBox(height: 16),
            Center(
              child: Container(
                padding: const EdgeInsets.all(12),
                color: Colors.white,
                child: QrImageView(
                  data: _setup.otpauthUri,
                  size: 200,
                  backgroundColor: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 16),
            SelectableText(
              _setup.secret,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontFamily: 'monospace', letterSpacing: 2, fontSize: 16),
            ),
            const Divider(height: 32),
            Text(s(ref, 'step2_confirm_code'),
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(_error!,
                    style: TextStyle(color: Theme.of(context).colorScheme.error)),
              ),
            TextField(
              controller: _code,
              autofocus: true,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 22, letterSpacing: 6),
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
              decoration: const InputDecoration(hintText: '000000'),
              onSubmitted: (_) => _confirm(),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _busy ? null : _confirm,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: _busy
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : Text(s(ref, 'enable_2fa')),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _recoveryCard() {
    final codes = _recoveryCodes!;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.green),
                const SizedBox(width: 8),
                Text(s(ref, 'two_factor_active'),
                    style: Theme.of(context).textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: 12),
            Text(s(ref, 'recovery_codes_notice')),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Wrap(
                spacing: 24,
                runSpacing: 8,
                children: [
                  for (final c in codes)
                    SelectableText(c,
                        style: const TextStyle(
                            fontFamily: 'monospace', fontSize: 15)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () => Clipboard.setData(
                  ClipboardData(text: codes.join('\n'))),
              icon: const Icon(Icons.copy),
              label: Text(s(ref, 'copy_codes')),
            ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Text(s(ref, 'done')),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
