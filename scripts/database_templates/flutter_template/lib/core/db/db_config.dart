/// Central database connection configuration.
///
/// SCORIET: static file — generated once, shared by every entity feature.
/// Adjust here (or wire to env / settings) instead of touching repositories.
class DbConfig {
  const DbConfig({
    required this.host,
    required this.port,
    required this.user,
    required this.password,
    required this.database,
    this.maxConnections = 10,
    this.secure = false,
  });

  final String host;
  final int port;
  final String user;
  final String password;
  final String database;
  final int maxConnections;
  final bool secure;

  /// Project connection defaults, filled in from the Scoriet project's
  /// database settings.
  static const DbConfig dev = DbConfig(
    host: '{:projectdbserver:}',
    port: {:projectdbport:},
    user: '{:projectdbusername:}',
    password: '{:projectdbpassword:}',
    database: '{:projectdbname:}',
    // MySQL 8.4 defaults to caching_sha2_password, which mysql_client only
    // allows over a secure (TLS) connection. MySQL 8.4 enables TLS by default.
    secure: true,
  );
}
