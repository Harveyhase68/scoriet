/// `draw.*` (see supported.md's `draw` namespace, `lib_draw`) - drawing and
/// images. NOT implemented this round (see the Flutter SML Template
/// README's scope table) - WinDev's immediate-mode drawing model (begin/
/// end a drawing session on a control, issue shape/text commands) has no
/// 1:1 Flutter equivalent (Flutter's CustomPainter is declarative, redrawn
/// from a `paint()` method, not called into imperatively mid-event-handler)
/// and no real project in this codebase's test corpus exercises it as a
/// live UI-driving feature (the only real usage found was a one-off
/// screenshot-export utility window, not a generated app's own screen).
/// Every function still exists so generated code compiles; each one is a
/// clearly marked TODO rather than a silently wrong drawing.
class SmlDraw {
  const SmlDraw._();

  static void begin(String controlName) {
    // TODO: draw.begin - immediate-mode drawing not implemented yet
  }

  static void end(String controlName) {
    // TODO: draw.end - immediate-mode drawing not implemented yet
  }

  static int red(int color) => (color >> 16) & 0xFF;
  static int green(int color) => (color >> 8) & 0xFF;
  static int blue(int color) => color & 0xFF;
  static int rgb(int r, int g, int b) => (r << 16) | (g << 8) | b;

  static void circle(int x, int y, int radius) {
    // TODO: draw.circle - immediate-mode drawing not implemented yet
  }

  static void line(int x1, int y1, int x2, int y2) {
    // TODO: draw.line - immediate-mode drawing not implemented yet
  }

  static void rectangle(int x, int y, int width, int height) {
    // TODO: draw.rectangle - immediate-mode drawing not implemented yet
  }

  static void polygon(List<int> points) {
    // TODO: draw.polygon - immediate-mode drawing not implemented yet
  }

  static void text(String value, int x, int y) {
    // TODO: draw.text - immediate-mode drawing not implemented yet
  }

  static void fill(int color) {
    // TODO: draw.fill - immediate-mode drawing not implemented yet
  }

  static void setBackground(int color) {
    // TODO: draw.set_background - immediate-mode drawing not implemented yet
  }

  static void setBrush(int color) {
    // TODO: draw.set_brush - immediate-mode drawing not implemented yet
  }

  static void setPen(int color, [int width = 1]) {
    // TODO: draw.set_pen - immediate-mode drawing not implemented yet
  }

  static void setFont(String fontName, int size) {
    // TODO: draw.set_font - immediate-mode drawing not implemented yet
  }

  static void setMode(int mode) {
    // TODO: draw.set_mode - immediate-mode drawing not implemented yet
  }

  static dynamic loadImage(String path) {
    // TODO: draw.load_image - immediate-mode drawing not implemented yet
    return null;
  }

  static dynamic copyImage(dynamic image) {
    // TODO: draw.copy_image - immediate-mode drawing not implemented yet
    return image;
  }

  static dynamic resizeImage(dynamic image, int width, int height) {
    // TODO: draw.resize_image - immediate-mode drawing not implemented yet
    return image;
  }

  static int imageWidth(dynamic image) => 0;
  static int imageHeight(dynamic image) => 0;

  static int pixel(int x, int y) => 0;

  static void saveBmp(dynamic image, String path) {
    // TODO: draw.save_bmp - immediate-mode drawing not implemented yet
  }

  static void saveGif(dynamic image, String path) {
    // TODO: draw.save_gif - immediate-mode drawing not implemented yet
  }

  static void saveJpeg(dynamic image, String path) {
    // TODO: draw.save_jpeg - immediate-mode drawing not implemented yet
  }

  /// `destination` is `dynamic`, not `String` - confirmed real usage passes
  /// either a file path OR WinDev's `InMemory` mode constant (see
  /// sml_constants.dart's `inMemory`) requesting the encoded bytes back
  /// instead of a file write; this Round-1 stub doesn't implement either
  /// yet (see TODO below), so it accepts both shapes without guessing.
  /// Returns `dynamic`, not `void` - confirmed real usage assigns the
  /// result (`vRecord[0].company_logo = draw.save_png(...)`), so a `void`
  /// return is a hard compile error at the call site regardless of what
  /// this stub actually does yet. Echoes `image` back unchanged - an
  /// honest "no real encoding happened" placeholder that still lets a
  /// round-trip (`save_png` now, `decrypt`/`get` of the same field later)
  /// carry SOMETHING through rather than `null`.
  static dynamic savePng(dynamic image, dynamic destination) {
    // TODO: draw.save_png - immediate-mode drawing not implemented yet
    return image;
  }
}
