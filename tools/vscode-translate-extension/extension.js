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

        // Prepare data to send
        const data = {
            selectedText: selectedText,
            filePath: filePath,
            fileName: fileName,
            lineNumber: lineNumber,
            columnNumber: columnNumber,
            language: getLanguageFromFile(fileName)
        };

        // Show progress
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Sending to WinDev Translator...",
            cancellable: false
        }, async (progress) => {
            try {
                const result = await sendToWinDev(apiUrl, data);
                vscode.window.showInformationMessage(`✓ Sent to translator: "${selectedText.substring(0, 30)}${selectedText.length > 30 ? '...' : ''}"`);

                // If WinDev returns a translation key, copy it to clipboard
                if (result && result.translationKey) {
                    await vscode.env.clipboard.writeText(result.translationKey);
                    vscode.window.showInformationMessage(`Translation key copied: ${result.translationKey}`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to send: ${error.message}`);
            }
        });
    });

    context.subscriptions.push(disposable);
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
