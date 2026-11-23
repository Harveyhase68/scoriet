import 'dart:io';
import 'dart:typed_data';
import 'package:path_provider/path_provider.dart';

/// `file.*` (see supported.md's `file` namespace, `lib_file`) - filesystem
/// access. Handle-based, matching WinDev's own `fOpen`/`fRead`/`fWrite`/
/// `fSeek`/`fClose` model directly onto `dart:io`'s `RandomAccessFile` (a
/// real OS file handle, not a re-implemented abstraction) - an int handle
/// maps 1:1 to one open `RandomAccessFile`, exactly like WinDev's own
/// integer file handles.
///
/// [initDirectories] must run once, awaited, before `runApp()` (see
/// generated `main.dart`) - `path_provider`'s directory lookups are
/// unavoidably async, so this caches them once at startup, letting every
/// other function here (`appDirectory`/`dataDirectory`/`tempDirectory`
/// included) stay synchronous, matching this namespace's Round-1 "no
/// await needed" design (see sml_to_dart.js's ASYNC_FUNCTIONS, which does
/// NOT include `file.*`).
class SmlFile {
  const SmlFile._();

  static String _appDirectory = '';
  static String _dataDirectory = '';
  static String _tempDirectory = '';

  static Future<void> initDirectories() async {
    _appDirectory = Directory.current.path;
    _dataDirectory = (await getApplicationDocumentsDirectory()).path;
    _tempDirectory = (await getTemporaryDirectory()).path;
  }

  static String appDirectory() => _appDirectory;
  static String dataDirectory() => _dataDirectory;
  static String tempDirectory() => _tempDirectory;
  static String currentDirectory() => Directory.current.path;

  static int _nextHandle = 1;
  static final Map<int, RandomAccessFile> _handles = {};

  /// `fOpen` - WinDev's own open modes (foRead/foWrite/foCreateIfNotExist/
  /// foAdd/...) collapse onto Dart's own `FileMode` values; `mode` here is
  /// already the resolved Dart mode name ("read"/"write"/"append") the
  /// generator picks from the SML call's mode flags.
  static int open(String path, [String mode = 'read']) {
    final fileMode = switch (mode) {
      'write' => FileMode.write,
      'append' => FileMode.append,
      _ => FileMode.read,
    };
    final handle = File(path).openSync(mode: fileMode);
    final id = _nextHandle++;
    _handles[id] = handle;
    return id;
  }

  static void close(int handle) {
    _handles.remove(handle)?.closeSync();
  }

  static void seek(int handle, int position) {
    _handles[handle]?.setPositionSync(position);
  }

  static String readLine(int handle) {
    final raf = _handles[handle];
    if (raf == null) return '';
    final bytes = <int>[];
    int byte;
    while ((byte = raf.readByteSync()) != -1 && byte != 10) {
      if (byte != 13) bytes.add(byte);
    }
    return String.fromCharCodes(bytes);
  }

  static void writeLine(int handle, String line) {
    _handles[handle]?.writeStringSync('$line\n');
  }

  static List<int> read(int handle, int byteCount) {
    final raf = _handles[handle];
    if (raf == null) return const [];
    return raf.readSync(byteCount);
  }

  static void write(int handle, List<int> bytes) {
    _handles[handle]?.writeFromSync(bytes);
  }

  // ---- Whole-file convenience operations (no handle needed) ----

  static bool exists(String path) => File(path).existsSync();
  static bool directoryExists(String path) => Directory(path).existsSync();

  static void delete(String path) {
    final f = File(path);
    if (f.existsSync()) f.deleteSync();
  }

  static void copy(String from, String to) => File(from).copySync(to);
  static void rename(String from, String to) => File(from).renameSync(to);

  static void makeDirectory(String path) => Directory(path).createSync(recursive: true);

  static int size(String path) => File(path).existsSync() ? File(path).lengthSync() : 0;

  static String readText(String path) => File(path).readAsStringSync();
  static void writeText(String path, String content) => File(path).writeAsStringSync(content);

  static Uint8List readBytes(String path) => File(path).readAsBytesSync();
  static void writeBytes(String path, List<int> bytes) => File(path).writeAsBytesSync(bytes);

  /// `fListFile` - returns a `\r`-joined STRING of matching file paths, not
  /// a Dart list - confirmed real (the ONLY real call site: `sFiles =
  /// file.list(...)` immediately walked with `str.count(sFiles, "\r")`/
  /// `str.token(sFiles, i, "\r")`, WinDev's own real return convention for
  /// this function, distinct from most other WLanguage list-returning
  /// functions). [pattern] may include a `*`/`?` glob (confirmed real:
  /// `file.list(dir + "\*.trs")`) - translated to a directory + a simple
  /// suffix/prefix match rather than a full glob engine, since every real
  /// call site here uses only a trailing `*.ext` shape.
  static String list(String pattern) {
    final normalized = pattern.replaceAll('\\', '/');
    final lastSlash = normalized.lastIndexOf('/');
    final directoryPath = lastSlash == -1 ? '.' : normalized.substring(0, lastSlash);
    final namePattern = lastSlash == -1 ? normalized : normalized.substring(lastSlash + 1);
    final dir = Directory(directoryPath);
    if (!dir.existsSync()) return '';
    final prefix = namePattern.split('*').first;
    final suffix = namePattern.contains('*') ? namePattern.split('*').last : '';
    final matches = dir.listSync().map((e) => e.path.replaceAll('\\', '/')).where((p) {
      final name = p.substring(p.lastIndexOf('/') + 1);
      return name.startsWith(prefix) && name.endsWith(suffix);
    });
    return matches.join('\r');
  }

  /// `fExtractPath`/`fExtraitChemin` - the directory portion of a path.
  static String pathPart(String path) {
    final normalized = path.replaceAll('\\', '/');
    final i = normalized.lastIndexOf('/');
    return i == -1 ? '' : path.substring(0, i + 1);
  }

  static String tempFile([String prefix = 'sml']) {
    return '$_tempDirectory/${prefix}_${DateTime.now().microsecondsSinceEpoch}.tmp';
  }
}
