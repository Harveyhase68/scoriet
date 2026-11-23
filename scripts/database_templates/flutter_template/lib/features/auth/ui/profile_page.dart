import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/locale_provider.dart';
import '../model/app_user.dart';
import '../state/account_controller.dart';
import '../state/auth_providers.dart';
import 'two_factor_setup_page.dart';

/// Step 4 — Profile. Edit name, language and avatar; change password; manage
/// two-factor authentication.
class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  final _name = TextEditingController();
  String _language = kProjectDefaultLanguage;
  String? _avatarPath;
  bool _seeded = false;
  bool _savingProfile = false;

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
    super.dispose();
  }

  void _seed(AppUser u) {
    _name.text = u.name;
    _language =
        _languages.containsKey(u.language) ? u.language : kProjectDefaultLanguage;
    _avatarPath = u.avatarPath;
    _seeded = true;
  }

  Future<void> _pickAvatar() async {
    // file_picker 11+: pickFiles is a direct static method, no more
    // `.platform` singleton getter.
    final result = await FilePicker.pickFiles(
      type: FileType.image,
      dialogTitle: s(ref, 'choose_image'),
    );
    final path = result?.files.single.path;
    if (path != null) setState(() => _avatarPath = path);
  }

  Future<void> _saveProfile() async {
    setState(() => _savingProfile = true);
    try {
      await ref.read(accountControllerProvider).updateProfile(
            name: _name.text,
            language: _language,
            avatarPath: _avatarPath,
          );
      _toast(s(ref, 'profile_saved'));
    } catch (e) {
      _toast('${s(ref, 'error_prefix')}$e');
    } finally {
      if (mounted) setState(() => _savingProfile = false);
    }
  }

  void _toast(String msg) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    if (user == null) {
      return Scaffold(body: Center(child: Text(s(ref, 'not_logged_in'))));
    }
    if (!_seeded) _seed(user);

    return Scaffold(
      appBar: AppBar(title: Text(s(ref, 'profile_title'))),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 640),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _profileCard(user),
                const SizedBox(height: 16),
                _PasswordCard(),
                const SizedBox(height: 16),
                _twoFactorCard(user),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _profileCard(AppUser user) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(s(ref, 'account'), style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 20),
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                _AvatarView(path: _avatarPath, initials: user.initials),
                const SizedBox(width: 20),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    OutlinedButton.icon(
                      onPressed: _pickAvatar,
                      icon: const Icon(Icons.image_outlined),
                      label: Text(s(ref, 'choose_image')),
                    ),
                    if (_avatarPath != null)
                      TextButton.icon(
                        onPressed: () => setState(() => _avatarPath = null),
                        icon: const Icon(Icons.delete_outline, size: 18),
                        label: Text(s(ref, 'remove')),
                      ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _name,
              decoration: InputDecoration(
                labelText: s(ref, 'name_label'),
                prefixIcon: const Icon(Icons.person_outline),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              enabled: false,
              controller: TextEditingController(text: user.email),
              decoration: InputDecoration(
                labelText: s(ref, 'email_label'),
                prefixIcon: const Icon(Icons.mail_outline),
              ),
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
            const SizedBox(height: 20),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton.icon(
                onPressed: _savingProfile ? null : _saveProfile,
                icon: _savingProfile
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.save),
                label: Text(s(ref, 'save')),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _twoFactorCard(AppUser user) {
    final enabled = user.twoFactorEnabled;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(enabled ? Icons.verified_user : Icons.shield_outlined,
                    color: enabled ? Colors.green : null),
                const SizedBox(width: 10),
                Text(s(ref, 'two_factor_setup_title'),
                    style: Theme.of(context).textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: 8),
            Text(enabled
                ? s(ref, 'two_factor_active_desc')
                : s(ref, 'two_factor_inactive_desc')),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerLeft,
              child: enabled
                  ? OutlinedButton.icon(
                      onPressed: _disable2fa,
                      icon: const Icon(Icons.remove_moderator_outlined),
                      label: Text(s(ref, 'disable_2fa')),
                    )
                  : FilledButton.icon(
                      onPressed: _setup2fa,
                      icon: const Icon(Icons.qr_code_2),
                      label: Text(s(ref, 'setup_2fa')),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _setup2fa() async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const TwoFactorSetupPage()),
    );
    if (mounted) setState(() {}); // reflect updated user
  }

  Future<void> _disable2fa() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(s(ref, 'disable_2fa_confirm_title')),
        content: Text(s(ref, 'disable_2fa_confirm_content')),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(s(ref, 'cancel'))),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(s(ref, 'deactivate'))),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(accountControllerProvider).disableTwoFactor();
      _toast(s(ref, 'two_factor_disabled'));
    } catch (e) {
      _toast('${s(ref, 'error_prefix')}$e');
    }
  }
}

class _AvatarView extends StatelessWidget {
  const _AvatarView({required this.path, required this.initials});
  final String? path;
  final String initials;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final hasFile = path != null && File(path!).existsSync();
    return CircleAvatar(
      radius: 40,
      backgroundColor: scheme.primaryContainer,
      backgroundImage: hasFile ? FileImage(File(path!)) : null,
      child: hasFile
          ? null
          : Text(initials,
              style: TextStyle(
                  fontSize: 26,
                  color: scheme.onPrimaryContainer,
                  fontWeight: FontWeight.bold)),
    );
  }
}

/// Change-password section (verifies current password server-side).
class _PasswordCard extends ConsumerStatefulWidget {
  @override
  ConsumerState<_PasswordCard> createState() => _PasswordCardState();
}

class _PasswordCardState extends ConsumerState<_PasswordCard> {
  final _formKey = GlobalKey<FormState>();
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await ref.read(accountControllerProvider).changePassword(
            current: _current.text,
            next: _next.text,
          );
      _current.clear();
      _next.clear();
      _confirm.clear();
      _formKey.currentState!.reset();
      _toast(s(ref, 'password_changed'));
    } on AuthException catch (e) {
      _toast(e.message);
    } catch (e) {
      _toast('${s(ref, 'error_prefix')}$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _toast(String m) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(s(ref, 'change_password'),
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 16),
              TextFormField(
                controller: _current,
                obscureText: true,
                decoration: InputDecoration(
                    labelText: s(ref, 'current_password_label'),
                    prefixIcon: const Icon(Icons.lock_outline)),
                validator: (v) =>
                    (v == null || v.isEmpty) ? s(ref, 'required_field') : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _next,
                obscureText: true,
                decoration: InputDecoration(
                    labelText: s(ref, 'new_password_label'),
                    prefixIcon: const Icon(Icons.lock_reset)),
                validator: (v) => (v == null || v.length < 8)
                    ? s(ref, 'password_min_length')
                    : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _confirm,
                obscureText: true,
                decoration: InputDecoration(
                    labelText: s(ref, 'password_confirm_label'),
                    prefixIcon: const Icon(Icons.lock_outline)),
                validator: (v) =>
                    v != _next.text ? s(ref, 'password_mismatch') : null,
              ),
              const SizedBox(height: 20),
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton.icon(
                  onPressed: _busy ? null : _save,
                  icon: _busy
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.check),
                  label: Text(s(ref, 'change')),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
