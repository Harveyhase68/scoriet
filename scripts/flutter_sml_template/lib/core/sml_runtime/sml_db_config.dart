/// Database connection settings for [SmlDb.connect] - resolved at
/// GENERATION TIME from the Scoriet project's own database configuration
/// (Project.database_type/_server/_port/_name/_username/_password, the
/// same settings the Scoriet backend itself connects with), not read from
/// any runtime config file or settings screen - a generated Window
/// Designer app has neither, so main.dart embeds these directly (see its
/// own `SmlDb.connect(const SmlDbConfig(...))` call, filled in from the
/// gtree's `{:projectdbtype:}`/`{:projectdbserver:}`/... variables).
///
/// [type] is matched case-insensitively against the backends [SmlDb]
/// actually implements (see its own doc comment for current Round-1
/// scope) - Scoriet's own `database_type` values are capitalised
/// ("MySQL"), which [SmlDb.connect] lowercases itself rather than
/// requiring the template to do it.
class SmlDbConfig {
  final String type;
  final String host;
  final int port;
  final String database;
  final String username;
  final String password;

  const SmlDbConfig({
    required this.type,
    required this.host,
    required this.port,
    required this.database,
    required this.username,
    required this.password,
  });
}
