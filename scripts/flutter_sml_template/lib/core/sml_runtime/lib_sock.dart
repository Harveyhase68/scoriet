/// `sock.*` (see supported.md's `sock` namespace, `lib_socket`) - NOT
/// implemented this round (see the Flutter SML Template README's scope
/// table): no real project in this codebase's test corpus uses raw
/// sockets. Every function still exists (via `dart:io`'s `Socket`/
/// `ServerSocket` once implemented) so generated code compiles.
class SmlSock {
  const SmlSock._();

  static Future<dynamic> connect(String host, int port) async {
    // TODO: sock.connect - not implemented yet
    return null;
  }

  static Future<dynamic> listen(int port) async {
    // TODO: sock.listen - not implemented yet
    return null;
  }

  static Future<dynamic> accept(dynamic serverSocket) async {
    // TODO: sock.accept - not implemented yet
    return null;
  }

  static void close(dynamic socket) {
    // TODO: sock.close - not implemented yet
  }

  static List<int> read(dynamic socket) {
    // TODO: sock.read - not implemented yet
    return const [];
  }

  static void write(dynamic socket, List<int> bytes) {
    // TODO: sock.write - not implemented yet
  }
}
