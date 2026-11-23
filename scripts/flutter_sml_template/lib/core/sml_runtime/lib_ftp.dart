/// `ftp.*` (see supported.md's `ftp` namespace, `lib_ftp`) - NOT
/// implemented this round (see the Flutter SML Template README's scope
/// table): no real project in this codebase's test corpus uses FTP, and a
/// real client needs its own protocol implementation or a third-party
/// package decision this session doesn't have real usage to make
/// confidently. Every function still exists so generated code compiles.
class SmlFtp {
  const SmlFtp._();

  static Future<void> connect(String host, String user, String password) async {
    // TODO: ftp.connect - not implemented yet
  }

  static Future<void> disconnect() async {
    // TODO: ftp.disconnect - not implemented yet
  }

  static Future<List<String>> list(String path) async {
    // TODO: ftp.list - not implemented yet
    return const [];
  }

  static Future<void> download(String remotePath, String localPath) async {
    // TODO: ftp.download - not implemented yet
  }

  static Future<void> upload(String localPath, String remotePath) async {
    // TODO: ftp.upload - not implemented yet
  }

  static Future<void> delete(String path) async {
    // TODO: ftp.delete - not implemented yet
  }

  static Future<void> rename(String from, String to) async {
    // TODO: ftp.rename - not implemented yet
  }

  static Future<void> makeDirectory(String path) async {
    // TODO: ftp.make_directory - not implemented yet
  }

  static String currentDirectory() {
    // TODO: ftp.current_directory - not implemented yet
    return '';
  }
}
