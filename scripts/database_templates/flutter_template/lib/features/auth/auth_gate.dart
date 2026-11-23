import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/db/database.dart';
import '../../core/db/migrations.dart';
import 'state/auth_providers.dart';
import 'ui/login_page.dart';
import 'ui/two_factor_challenge_page.dart';

/// Ensures the auth tables exist before the first login attempt.
final authSchemaProvider = FutureProvider<void>((ref) async {
  await ensureAuthSchema(ref.watch(databaseProvider));
});

/// Decides what the app shows based on the auth session:
///   not authenticated  → LoginPage
///   password ok, 2FA   → TwoFactorChallengePage
///   authenticated      → [child] (the app shell)
///
/// Runs AFTER [DbBootstrapGate] in [StartupGate] — a login can't be checked
/// against a database that doesn't exist yet.
class AuthGate extends ConsumerWidget {
  const AuthGate({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schema = ref.watch(authSchemaProvider);

    return schema.when(
      loading: () => const _Splash(),
      error: (e, _) => Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.storage, size: 40, color: Colors.red),
              const SizedBox(height: 12),
              Text('Datenbank nicht erreichbar:\n$e',
                  textAlign: TextAlign.center),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: () => ref.invalidate(authSchemaProvider),
                icon: const Icon(Icons.refresh),
                label: const Text('Erneut versuchen'),
              ),
            ],
          ),
        ),
      ),
      data: (_) {
        final state = ref.watch(authControllerProvider);
        if (state.needsTwoFactor) return const TwoFactorChallengePage();
        if (!state.isAuthenticated) return const LoginPage();
        return child;
      },
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.lock_outline, size: 48),
            SizedBox(height: 16),
            CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
