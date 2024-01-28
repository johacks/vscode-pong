import webpack from 'webpack';
import path from 'path';
import * as vscode from 'vscode';

function packApp(srcDir:string, debug: boolean = true, callback: (err: Error | undefined, stats: webpack.Stats | undefined) => void) {
    webpack({
        context: path.resolve(srcDir, 'app'),
        entry: './app.ts',
        output: {
            path: path.resolve(srcDir, 'dist'),
            filename: 'bundle.js'
        },
        mode: debug ? 'development' : 'production',
        resolve: {
            extensions: ['.ts', '.js'],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    // Make a regex equivalent of above exclude
                    include(value) {
                        return value.indexOf('app') !== -1;
                    },
                },
            ]
        },
    }, function(err, stats) {
        callback(err, stats);
    });
}

function injectBundle(html: string, bundlePath: vscode.Uri) {
    return vscode.workspace.fs.readFile(bundlePath).then((uint8Array) => {
        const bundle = new TextDecoder().decode(uint8Array);
        return html.replace('/*--webpack-bundle--*/', bundle);
    });
}

const isWebviewArgSent : {[key: string]: boolean} = {};

// Packs all modules in src/app into a single bundle.js file and attaches it to index.html
// Then displays result in a webview
export function runApp(context: vscode.ExtensionContext, args: any, debug: boolean = true) {
    // Pack app
    const srcDir = context.asAbsolutePath('src');

    // Create webview
    const panel = vscode.window.createWebviewPanel('vspong' + args.command, 'VS Pong', vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: debug  // Allow having multiple webviews when debugging
    });
    packApp(srcDir, debug, (err, stats) => {
        if (err) { console.error(err); return; }
        const indexFilePath = vscode.Uri.file(context.asAbsolutePath(path.join('src','index.html')));
        const bundleFilePath = vscode.Uri.file(context.asAbsolutePath(path.join('src','dist','bundle.js')));

        // Read index.html
        vscode.workspace.fs.readFile(indexFilePath).then((uint8Array) => {
            const html = new TextDecoder().decode(uint8Array);
            // Inject bundle.js
            return injectBundle(html, bundleFilePath);
        }).then((injectedHtml) => {
            panel.webview.html = injectedHtml;

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
    });
}