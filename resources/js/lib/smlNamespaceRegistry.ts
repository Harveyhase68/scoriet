// GENERATED FILE - do not hand-edit.
// Produced by scripts/extract_sml_namespace_registry.js from the Flutter SML
// Template's own runtime library source - re-run that script whenever
// lib_<ns>.dart/sml_<ns>_context.dart gains, renames, or removes a function.
// See that script's own header comment for why this is extracted rather
// than hand-maintained.
//
// Generated 2026-09-06.

// Every SML namespace with at least one REAL, currently-implemented
// function - a namespace with no entry here is one this runtime hasn't
// implemented at all yet (e.g. `map`), so smlParser.ts skips validating
// calls into it entirely rather than flagging every single call as
// "unknown" (see its own doc comment).
export const SML_NAMESPACE_FUNCTIONS: Record<string, Set<string>> = {
    arr: new Set(['add', 'clear', 'copy', 'count', 'create', 'find', 'find_by_field', 'info', 'insert', 'join', 'remove_at', 'shuffle', 'sort']),
    crypt: new Set(['decode', 'decrypt', 'encode', 'encrypt', 'hash', 'hash_file', 'hash_verify']),
    db: new Set(['add', 'begin', 'clear_filter', 'commit', 'connect', 'connect_project', 'cross', 'current', 'delete', 'disconnect', 'error_code', 'error_duplicate', 'error_info', 'filter', 'found', 'modify', 'out_of_range', 'query', 'read', 'read_first', 'read_last', 'read_next', 'read_previous', 'record_count', 'record_number', 'reset', 'rollback', 'seek', 'seek_first', 'seek_last', 'set_key', 'version']),
    dlg: new Set(['confirm', 'custom', 'error', 'info', 'ok_cancel', 'toast', 'warning', 'yes_no']),
    draw: new Set(['begin', 'blue', 'circle', 'copy_image', 'end', 'fill', 'green', 'image_height', 'image_width', 'line', 'load_image', 'pixel', 'polygon', 'rectangle', 'red', 'resize_image', 'rgb', 'save_bmp', 'save_gif', 'save_jpeg', 'save_png', 'set_background', 'set_brush', 'set_font', 'set_mode', 'set_pen', 'text']),
    dt: new Set(['day_of_week', 'days_between', 'flush', 'format', 'format_date', 'format_time', 'from_int', 'is_valid', 'now', 'parse_date', 'parse_time', 'to_int', 'today', 'two']),
    file: new Set(['app_directory', 'close', 'copy', 'current_directory', 'data_directory', 'delete', 'directory_exists', 'exists', 'init_directories', 'list', 'make_directory', 'open', 'path_part', 'read', 'read_bytes', 'read_line', 'read_text', 'rename', 'seek', 'size', 'temp_directory', 'temp_file', 'write', 'write_bytes', 'write_line', 'write_text']),
    ftp: new Set(['connect', 'current_directory', 'delete', 'disconnect', 'download', 'list', 'make_directory', 'rename', 'upload']),
    http: new Set(['add_file', 'add_parameter', 'create_form', 'header', 'request', 'result', 'send', 'send_form', 'set_timeout', 'status_code']),
    json: new Set(['convert', 'count', 'deserialize', 'execute', 'members', 'name', 'parse', 'serialize', 'stringify', 'type', 'value']),
    log: new Set(['assert', 'error', 'info', 'trace']),
    num: new Set(['abs', 'bit_and', 'bit_not', 'bit_or', 'bit_xor', 'ceil', 'floor', 'format', 'fraction', 'max', 'min', 'mod', 'parse', 'parse_int', 'pow', 'random', 'round', 'shift_left', 'shift_right', 'sqrt', 'truncate']),
    rpt: new Set(['destination', 'preview', 'print', 'write']),
    sock: new Set(['accept', 'close', 'connect', 'listen', 'read', 'write']),
    sql: new Set(['execute', 'execute_sql']),
    str: new Set(['code_at', 'concat', 'count', 'equals_ci', 'equals_loose', 'from_ansi', 'from_code', 'from_utf8', 'index_of', 'insert', 'left', 'length', 'lower', 'pad_left', 'pad_right', 'repeat', 'replace', 'reverse', 'right', 'strip_accents', 'sub', 'to_ansi', 'to_utf8', 'token', 'trim', 'upper', 'utf8_to_ansi']),
    sys: new Set(['app_info', 'call_by_name', 'call_native', 'delete_setting', 'disable_exceptions', 'enable_exceptions', 'environment', 'error_info', 'is64_bit', 'is_android', 'is_browser', 'is_ios', 'is_linux', 'is_test_mode', 'is_windows', 'load_setting', 'open_with_default_app', 'raise', 'rethrow', 'run', 'save_setting', 'sleep', 'yield']),
    timer: new Set(['start', 'stop']),
    ui: new Set(['cell_link', 'control_at', 'current_window', 'exists', 'file_to_screen', 'get', 'list_add', 'list_clear', 'list_count', 'list_find', 'list_select', 'list_selected', 'looper_add', 'looper_clear', 'looper_count', 'redraw', 'return_to_input', 'row', 'screen_to_file', 'set', 'table_add', 'table_clear', 'table_count', 'table_editing', 'table_refresh', 'table_select', 'table_selected']),
    win: new Set(['close', 'end_program', 'open', 'open_child', 'open_sibling', 'resize', 'use']),
};
