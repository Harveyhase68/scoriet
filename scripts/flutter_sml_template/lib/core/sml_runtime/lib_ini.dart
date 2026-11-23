import 'dart:io';

/// Backs WLanguage's bare `INIRead(section, key, [default], [iniFile])` -
/// confirmed real (`INIRead("Einstellungen", "DB_ServerIP", "", gsIni)`,
/// argument order verified against the real SML call: section, key,
/// default value, then the ini file name/path).
///
/// This is a REAL, literal `.ini` text file the user can hand-edit -
/// deliberately separate from `SmlSys.loadSetting`/`saveSetting`
/// (lib_sys.dart), which back WLanguage's `LoadParameter`/`SaveParameter`
/// via `shared_preferences` (registry/app-data storage, not a file anyone
/// would open in a text editor). WinDev's own INIRead semantics: the file
/// lives BESIDE the running executable (never a relative-to-cwd path,
/// which a launched GUI app's cwd isn't guaranteed to be), an omitted/
/// empty file name defaults to `<exe name>.ini` in that same folder, and a
/// missing file/section/key all fall back to [defaultValue] rather than
/// throwing (WinDev itself never raises an error for a missing INI entry).
///
/// Pure/stateless (no BuildContext/window state needed) despite being
/// reached only via `SmlWindowContext.iniRead` - see that method's own doc
/// comment for why it's exposed there anyway.
class SmlIni {
  SmlIni._();

  static String read(String section, String key, [String defaultValue = '', String? fileName]) {
    final file = _resolveFile(fileName);
    if (!file.existsSync()) return defaultValue;

    var currentSection = '';
    for (final rawLine in file.readAsStringSync().split('\n')) {
      final line = rawLine.trim();
      if (line.isEmpty || line.startsWith(';') || line.startsWith('#')) continue;

      if (line.startsWith('[') && line.endsWith(']')) {
        currentSection = line.substring(1, line.length - 1).trim();
        continue;
      }
      if (!_equalsIgnoreCase(currentSection, section)) continue;

      final eq = line.indexOf('=');
      if (eq < 0) continue;
      if (!_equalsIgnoreCase(line.substring(0, eq).trim(), key)) continue;

      return _unquote(line.substring(eq + 1).trim());
    }
    return defaultValue;
  }

  /// `INIWrite(section, key, value, [iniFile])` - confirmed real
  /// (`INIWrite("Einstellungen", "DB_ServerIP", "localhost:4900", gsIni)`,
  /// same argument order as [read] with `value` where [read] has
  /// `defaultValue`). Updates the key IN PLACE if it already exists
  /// (preserving every other line/section/comment in the file exactly as
  /// found), appends it to the end of its section if the section exists but
  /// the key doesn't yet, or appends a brand-new `[section]` block at the
  /// end of the file if the section itself doesn't exist either - creating
  /// the file fresh (just that one section/key) if it doesn't exist at all.
  /// Always writes the value quoted (`key = "value"`), matching [read]'s own
  /// `_unquote` and every real `.ini` file seen from this project so far.
  static void write(String section, String key, String value, [String? fileName]) {
    final file = _resolveFile(fileName);
    final lines = file.existsSync() ? file.readAsStringSync().split('\n') : <String>[];

    final sectionHeaderLines = <int>[];
    for (var i = 0; i < lines.length; i++) {
      final trimmed = lines[i].trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        sectionHeaderLines.add(i);
      }
    }

    int? sectionStart;
    var sectionEnd = lines.length;
    for (var idx = 0; idx < sectionHeaderLines.length; idx++) {
      final headerLine = sectionHeaderLines[idx];
      final name = lines[headerLine].trim();
      final inner = name.substring(1, name.length - 1).trim();
      if (_equalsIgnoreCase(inner, section)) {
        sectionStart = headerLine;
        sectionEnd = idx + 1 < sectionHeaderLines.length ? sectionHeaderLines[idx + 1] : lines.length;
        break;
      }
    }

    final newLine = '$key = "$value"';

    if (sectionStart != null) {
      int? keyLine;
      for (var i = sectionStart + 1; i < sectionEnd; i++) {
        final trimmed = lines[i].trim();
        final eq = trimmed.indexOf('=');
        if (eq <= 0) continue;
        if (_equalsIgnoreCase(trimmed.substring(0, eq).trim(), key)) {
          keyLine = i;
          break;
        }
      }
      if (keyLine != null) {
        lines[keyLine] = newLine;
      } else {
        lines.insert(sectionEnd, newLine);
      }
    } else {
      if (lines.isNotEmpty && lines.last.trim().isNotEmpty) {
        lines.add('');
      }
      lines.add('[$section]');
      lines.add(newLine);
    }

    file.writeAsStringSync(lines.join('\n'));
  }

  /// [fileName] empty/null -> `<exe name>.ini` beside the executable; a
  /// bare name (no path separator) also resolves beside the executable
  /// (matches WinDev looking next to the .exe, not the process's cwd); an
  /// already-qualified path is used as-is. A name with no extension gets
  /// ".ini" appended, same as WinDev's own default-extension behaviour.
  static File _resolveFile(String? fileName) {
    final exeDir = File(Platform.resolvedExecutable).parent.path;
    var name = (fileName == null || fileName.isEmpty)
        ? '${_stripExtension(_basename(Platform.resolvedExecutable))}.ini'
        : fileName;
    if (!name.toLowerCase().endsWith('.ini')) {
      name = '$name.ini';
    }
    final hasPath = name.contains('/') || name.contains('\\');
    return File(hasPath ? name : '$exeDir${Platform.pathSeparator}$name');
  }

  static String _basename(String path) {
    final lastSlash = path.lastIndexOf('/');
    final lastBackslash = path.lastIndexOf('\\');
    final cut = lastSlash > lastBackslash ? lastSlash : lastBackslash;
    return cut >= 0 ? path.substring(cut + 1) : path;
  }

  static String _stripExtension(String name) {
    final dot = name.lastIndexOf('.');
    return dot > 0 ? name.substring(0, dot) : name;
  }

  static bool _equalsIgnoreCase(String a, String b) => a.toLowerCase() == b.toLowerCase();

  static String _unquote(String value) {
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      return value.substring(1, value.length - 1);
    }
    return value;
  }
}
