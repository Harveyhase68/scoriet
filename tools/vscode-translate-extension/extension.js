const vscode = require('vscode');
const https = require('https');
const http = require('http');

/**
 * Scoriet Translate Extension
 *
 * Sends selected text to WinDev translation tool via REST API
 *
 * Shortcut: CTRL+M (when text is selected)
 */

function activate(context) {
    console.log('Scoriet Translate extension is now active');

    let disposable = vscode.commands.registerCommand('scoriet-translate.translateSelection', async function () {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText) {
            vscode.window.showWarningMessage('No text selected. Please select text first.');
            return;
        }

        // Get file info
        const filePath = editor.document.fileName;
        const fileName = filePath.split(/[/\\]/).pop();
        const lineNumber = selection.start.line + 1; // VS Code uses 0-based line numbers
        const columnNumber = selection.start.character + 1;

        // Get API URL from settings
        const config = vscode.workspace.getConfiguration('scorietTranslate');
        const apiUrl = config.get('apiUrl', 'http://localhost:7777/i18n');

        // Detect TSX context (HTML/JSX attribute vs JavaScript)
        const tsxContext = detectTsxContext(editor.document, selection);

        // Prepare data to send
        const data = {
            selectedText: selectedText,
            filePath: filePath,
            fileName: fileName,
            lineNumber: lineNumber,
            columnNumber: columnNumber,
            language: getLanguageFromFile(fileName),
            context: tsxContext
        };

        // Show progress
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Sending to WinDev Translator...",
            cancellable: false
        }, async (progress) => {
            try {
                const result = await sendToWinDev(apiUrl, data);

                // If WinDev returns a translation key, replace selected text 1:1 in editor
                // WinDev sends the complete replacement text, e.g.:
                //   HTML: {t.formsetmanagementpanel421}
                //   JS:   t.formsetmanagementpanel421
                //   PHP:  __('formsetmanagementpanel421')
                if (result && result.translationKey) {
                    var replacementText = result.translationKey;

                    // Replace the selected text directly in the editor
                    var editSuccess = await editor.edit(function(editBuilder) {
                        editBuilder.replace(selection, replacementText);
                    });

                    if (editSuccess) {
                        // Also copy to clipboard as backup
                        await vscode.env.clipboard.writeText(replacementText);
                        vscode.window.showInformationMessage(`✓ [${tsxContext}] Replaced with: ${replacementText}`);
                    } else {
                        // Edit failed — copy to clipboard so user can paste manually
                        await vscode.env.clipboard.writeText(replacementText);
                        vscode.window.showWarningMessage(`Could not replace text. Copied to clipboard: ${replacementText}`);
                    }
                } else {
                    vscode.window.showInformationMessage(`✓ [${tsxContext}] Sent to translator: "${selectedText.substring(0, 30)}${selectedText.length > 30 ? '...' : ''}"`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to send: ${error.message}`);
            }
        });
    });

    context.subscriptions.push(disposable);
}

/**
 * Detect whether selected text is in JSX/HTML context or JavaScript context.
 *
 * Returns "HTML" if the selection is inside a JSX opening tag (attribute position),
 * meaning the replacement needs curly braces: prop={t.key}
 *
 * Returns "JS" for everything else (variable assignments, function arguments,
 * inside JSX expressions {}, etc.), meaning just t.key is sufficient.
 *
 * Returns "PHP" for PHP files (.php, .blade.php).
 *
 * How it works:
 * 1. Check file extension for PHP → "PHP"
 * 2. For TSX/JSX: scan backwards for unmatched < → "HTML", otherwise → "JS"
 * 3. All other files (ts, js, etc.) → "JS"
 *
 * Examples:
 *   <DataTable emptyMessage="text" />  → finds <DataTable → "HTML"
 *   <p>text</p>                        → > before text → "HTML"
 *   {expr} text                        → } before text → "HTML"
 *   console.error('text')              → no unmatched < → "JS"
 *   style={{ color: 'red' }}           → hits { first → "JS"
 *   $message = "text";  (in .php)      → file extension → "PHP"
 */
function detectTsxContext(document, selection) {
    const fileName = document.fileName;

    // PHP files
    if (fileName.endsWith('.php')) {
        return 'PHP';
    }

    // Only TSX/JSX files need HTML vs JS context detection
    if (!fileName.endsWith('.tsx') && !fileName.endsWith('.jsx')) {
        return 'JS';
    }

    // Case 1: Inside a JSX opening tag (attribute position)
    // e.g., <DataTable emptyMessage="TEXT" />
    if (isInsideJsxOpeningTag(document, selection.start.line, selection.start.character)) {
        return 'HTML';
    }

    // Case 2: JSX text content (between tags)
    // e.g., <p>TEXT</p> or <div>{expr} TEXT</div>
    if (isJsxTextContent(document, selection.start.line, selection.start.character)) {
        return 'HTML';
    }

    return 'JS';
}


/**
 * Scan backwards from a position to determine if we're inside a JSX opening tag.
 * A JSX opening tag is: <ComponentName prop="value" prop2={expr} ...>
 * We're "inside" if we find an unmatched < (one that hasn't been closed by >).
 *
 * Handles multi-line JSX tags by scanning up to 50 lines backwards.
 * Tracks curly brace pairs {} so that JSX attribute expressions like
 * prop={[10, 25, 50]} are correctly skipped over.
 * Stops at statement boundaries (;) and unmatched { to avoid
 * crossing into unrelated code.
 *
 * Trace for emptyMessage="text" in a <DataTable> with prop={value} above:
 *   Line 415: rowsPerPageOptions={[10, 25, 50]}
 *     → } increments curlyBraceDepth to 1
 *     → { decrements curlyBraceDepth to 0 (matched pair, skip over)
 *   Line 411: value={myFormSets}
 *     → same: } up, { down (matched pair, skip over)
 *   Line 410: <DataTable
 *     → < with angleBracketDepth 0 → return true → "HTML"
 */
function isInsideJsxOpeningTag(document, line, column) {
    var angleBracketDepth = 0;
    var curlyBraceDepth = 0;
    var minLine = Math.max(0, line - 50);

    for (var lineNum = line; lineNum >= minLine; lineNum--) {
        var lineText = document.lineAt(lineNum).text;
        var endCol = (lineNum === line) ? column : lineText.length;

        for (var i = endCol - 1; i >= 0; i--) {
            var ch = lineText[i];

            // Track angle brackets for JSX tags
            if (ch === '>') {
                angleBracketDepth++;
            } else if (ch === '<') {
                if (angleBracketDepth === 0) {
                    // Found an unmatched < — we're inside a JSX opening tag
                    return true;
                }
                angleBracketDepth--;
            }

            // Track curly braces as pairs.
            // When scanning backwards: } opens a level, { closes a level.
            // This allows us to skip over JSX attribute expressions like prop={value}
            // without mistakenly treating the { as a block boundary.
            if (ch === '}') {
                curlyBraceDepth++;
            } else if (ch === '{') {
                if (curlyBraceDepth === 0) {
                    // Unmatched { — this is a real block/expression boundary.
                    // e.g., {condition && "text"} or function body {
                    return false;
                }
                curlyBraceDepth--;
            }

            // Stop at statement boundaries (semicolons end JS statements)
            if (ch === ';') {
                return false;
            }
        }
    }

    return false;
}

/**
 * Check if the selection is in JSX text content (between tags).
 * JSX text content is text between > and <, e.g.: <p>TEXT HERE</p>
 * or after a JSX expression close: {expr} TEXT HERE
 *
 * Scans backwards from the selection for the first non-whitespace character.
 * If it's > (but not => arrow function) or }, we're in JSX text content.
 *
 * Examples:
 *   <p>Text here</p>                    → > before text → true
 *   <p style={{ color: 'red' }}>Text    → > before text → true
 *   {someExpr} Text here                → } before text → true
 *   console.error('text')               → ( before text → false
 *   const msg = 'text'                  → = before text → false
 *   {condition ? 'text' : 'other'}      → ? before text → false
 */
function isJsxTextContent(document, line, column) {
    var minLine = Math.max(0, line - 5);

    for (var lineNum = line; lineNum >= minLine; lineNum--) {
        var lineText = document.lineAt(lineNum).text;
        var endCol = (lineNum === line) ? column : lineText.length;

        for (var i = endCol - 1; i >= 0; i--) {
            var ch = lineText[i];

            // Skip whitespace
            if (ch === ' ' || ch === '\t') {
                continue;
            }

            // > means we're after a tag close: <tag>TEXT or <Component prop="x">TEXT
            // But exclude => (arrow function)
            if (ch === '>') {
                if (i > 0 && lineText[i - 1] === '=') {
                    return false; // => arrow function, not JSX
                }
                return true;
            }

            // } means we're after a JSX expression: {expr}TEXT
            if (ch === '}') {
                return true;
            }

            // Any other character means we're NOT in JSX text content
            return false;
        }
    }

    return false;
}

/**
 * Detect language from filename (de.ts, en.ts, etc.)
 */
function getLanguageFromFile(fileName) {
    const match = fileName.match(/^(de|en|es|fr|it|pt|nl|pl|ru|zh|ja|ko)\.ts$/i);
    if (match) {
        return match[1].toLowerCase();
    }

    // Check if it's in a locales folder
    if (fileName.includes('locales')) {
        const langMatch = fileName.match(/locales[/\\](de|en|es|fr|it|pt|nl|pl|ru|zh|ja|ko)/i);
        if (langMatch) {
            return langMatch[1].toLowerCase();
        }
    }

    return 'unknown';
}

/**
 * Send data to WinDev REST API
 */
function sendToWinDev(apiUrl, data) {
    return new Promise((resolve, reject) => {
        const url = new URL(apiUrl);
        const isHttps = url.protocol === 'https:';
        const httpModule = isHttps ? https : http;

        const postData = JSON.stringify(data);

        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = httpModule.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(body));
                    } catch {
                        resolve({ success: true, raw: body });
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });

        // Track if data was sent successfully
        let dataSent = false;

        req.on('error', (error) => {
            // ECONNRESET after data was sent is OK - WinDev just closed the connection
            if (error.code === 'ECONNRESET' && dataSent) {
                resolve({ success: true, note: 'Connection closed by server (data was sent)' });
                return;
            }

            // More detailed error messages
            if (error.code === 'ECONNREFUSED') {
                reject(new Error(`Connection refused - Is WinDev running on ${url.hostname}:${url.port}?`));
            } else if (error.code === 'ENOTFOUND') {
                reject(new Error(`Host not found: ${url.hostname}`));
            } else if (error.code === 'ETIMEDOUT') {
                reject(new Error(`Connection timeout to ${url.hostname}:${url.port}`));
            } else {
                reject(new Error(`${error.code || 'Error'}: ${error.message}`));
            }
        });

        // Timeout after 10 seconds
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(postData);
        dataSent = true;
        req.end();
    });
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
