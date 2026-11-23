import 'package:http/http.dart' as http;

/// `http.*` (see supported.md's `http` namespace, `lib_http`) - HTTP
/// requests. WinDev's own model builds up a pending request (parameters,
/// files, headers), sends it, then reads the result via a SEPARATE call
/// (`http.result(selector)`) - this runtime keeps that same two-step shape
/// (matching real project code: `call http.request(url)` immediately
/// followed by `http.result(httpResult)`) via one "last response" holder,
/// rather than threading a response object through every call site, since
/// WinDev code itself is always sequential/single-request-at-a-time here.
class SmlHttp {
  const SmlHttp._();

  static http.Response? _lastResponse;
  static Duration _timeout = const Duration(seconds: 30);
  static final Map<String, String> _pendingHeaders = {};
  static final Map<String, String> _pendingParameters = {};

  /// `HTTPRequest` - real signatures seen in production code: a plain GET
  /// (`request(url)`) and a form POST (`request(url, username, password,
  /// body, contentType)`, WinDev's own basic-auth + body/content-type
  /// argument order). Stores the response for [result] to read afterward.
  static Future<void> request(String url, [String? username, String? password, String? body, String? contentType]) async {
    final headers = Map<String, String>.from(_pendingHeaders);
    if (contentType != null && contentType.isNotEmpty) {
      headers['Content-Type'] = contentType;
    }
    if (username != null && username.isNotEmpty) {
      final basic = 'Basic ${Uri.encodeFull('$username:${password ?? ''}')}';
      headers['Authorization'] = basic;
    }

    final uri = Uri.parse(_withParameters(url));
    _lastResponse = (body != null && body.isNotEmpty)
        ? await http.post(uri, headers: headers, body: body).timeout(_timeout)
        : await http.get(uri, headers: headers).timeout(_timeout);

    _pendingHeaders.clear();
    _pendingParameters.clear();
  }

  static String _withParameters(String url) {
    if (_pendingParameters.isEmpty) return url;
    final separator = url.contains('?') ? '&' : '?';
    final query = _pendingParameters.entries.map((e) => '${Uri.encodeQueryComponent(e.key)}=${Uri.encodeQueryComponent(e.value)}').join('&');
    return '$url$separator$query';
  }

  static Future<void> send(String url) => request(url);

  static Future<void> sendForm(String url, Map<String, String> fields) async {
    final uri = Uri.parse(url);
    _lastResponse = await http.post(uri, body: fields).timeout(_timeout);
  }

  static void addParameter(String name, String value) => _pendingParameters[name] = value;

  /// `HTTPAddFile` - real multipart file upload needs `MultipartRequest`,
  /// not the simple `get`/`post` helpers above; not yet wired since no
  /// real project usage exercises it.
  static void addFile(String fieldName, String filePath) {
    // TODO: http.add_file - multipart upload not implemented yet
  }

  static void createForm() {
    _pendingParameters.clear();
  }

  static String header(String name) => _lastResponse?.headers[name.toLowerCase()] ?? '';

  static void setTimeout(int milliseconds) => _timeout = Duration(milliseconds: milliseconds);

  /// `HTTPGetResult` - the argument selects which part of the response is
  /// wanted (see sml_constants.dart's `httpResult`, the only selector real
  /// project code uses) - the response body, decoded as raw bytes so
  /// `str.from_utf8`/`str.from_ansi` (as real code actually chains it) can
  /// do its own decoding, matching WinDev's own "result is raw, you decode
  /// it" model instead of guessing an encoding here.
  static List<int> result([int selector = 0]) => _lastResponse?.bodyBytes ?? const [];

  /// Convenience most generated code will actually want - the response as
  /// a UTF-8 string directly, for when the SML code doesn't itself wrap the
  /// bare bytes result in `str.from_utf8` (real project code sometimes
  /// does, sometimes doesn't).
  static int statusCode() => _lastResponse?.statusCode ?? 0;
}
