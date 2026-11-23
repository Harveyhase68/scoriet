import 'dart:developer' as developer;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mailer/mailer.dart';
import 'package:mailer/smtp_server.dart';

/// The mail-sending seam used by the password-reset flow.
///
/// The app calls [sendPasswordReset]; the concrete sender is chosen via
/// [mailSenderProvider]. Default is [DebugMailSender] (logs only), so the
/// flow works out of the box; wire [SmtpMailSender] for real delivery.
abstract class MailSender {
  Future<void> sendPasswordReset({
    required String to,
    required String token,
    Duration validFor,
  });
}

/// SMTP connection settings. Fill these and switch [mailSenderProvider].
class MailConfig {
  const MailConfig({
    required this.host,
    required this.port,
    required this.username,
    required this.password,
    required this.fromAddress,
    this.fromName = '{:projectname:}',
    this.ssl = false,
    this.allowInsecure = false,
  });

  final String host;
  final int port;
  final String username;
  final String password;
  final String fromAddress;
  final String fromName;
  final bool ssl;
  final bool allowInsecure;
}

/// Default sender: does not send anything, just logs the token so password
/// reset is testable without an SMTP server.
class DebugMailSender implements MailSender {
  const DebugMailSender();

  @override
  Future<void> sendPasswordReset({
    required String to,
    required String token,
    Duration validFor = const Duration(minutes: 60),
  }) async {
    developer.log(
      'Password reset for $to\n'
      'Token: $token (valid ${validFor.inMinutes} min)',
      name: 'MailSender(debug)',
    );
  }
}

/// Real SMTP delivery via the `mailer` package.
class SmtpMailSender implements MailSender {
  const SmtpMailSender(this.config);

  final MailConfig config;

  @override
  Future<void> sendPasswordReset({
    required String to,
    required String token,
    Duration validFor = const Duration(minutes: 60),
  }) async {
    final server = SmtpServer(
      config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      ssl: config.ssl,
      allowInsecure: config.allowInsecure,
    );

    final message = Message()
      ..from = Address(config.fromAddress, config.fromName)
      ..recipients.add(to)
      ..subject = '{:projectname:} – Passwort zurücksetzen'
      ..text = 'Ihr Reset-Code lautet: $token\n'
          'Gültig für ${validFor.inMinutes} Minuten.'
      ..html = '<p>Ihr Reset-Code lautet: <b>$token</b></p>'
          '<p>Gültig für ${validFor.inMinutes} Minuten.</p>';

    await send(message, server);
  }
}

/// Swap the returned sender to [SmtpMailSender] once SMTP is configured, e.g.:
/// `Provider((ref) => const SmtpMailSender(MailConfig(...)))`.
final mailSenderProvider =
    Provider<MailSender>((ref) => const DebugMailSender());
