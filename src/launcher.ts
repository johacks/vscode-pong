import path from 'path';
import * as vscode from 'vscode';

const isWebviewArgSent : {[key: string]: boolean} = {};

// Packs all modules in src/app into a single bundle.js file and attaches it to index.html
// Then displays result in a webview
export function runApp(context: vscode.ExtensionContext, args: any, debug: boolean = false) {
    // Create webview
    const panel = vscode.window.createWebviewPanel('vspong' + args.command, 'VS Pong', vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: debug  // Allow having multiple webviews when debugging
    });

    const indexFilePath = vscode.Uri.file(context.asAbsolutePath(path.join('out','index.html')));

    // Read index.html
    vscode.workspace.fs.readFile(indexFilePath).then((uint8Array) => {
        const html = new TextDecoder().decode(uint8Array);
        // Inject bundle.js
        panel.webview.html = html;

        // Associate a random ID to this webview to avoid sending args multiple times
        const webviewId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        isWebviewArgSent[webviewId] = false;

        // Listen to messages from webview
        panel.webview.onDidReceiveMessage((message) => {
            if (message.command === 'ready' && !isWebviewArgSent[webviewId]) {
                // Send args to webview
                console.log('Sending args to webview');
                panel.webview.postMessage(args);
                isWebviewArgSent[webviewId] = true;
            }
        });
    });
}