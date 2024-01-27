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
                        console.log(value);
                        return value.indexOf('app') !== -1;
                    },
                },
            ]
        },
    }, function(err, stats) {
        callback(err, stats);
    });
}

async function injectBundle(html: string, bundlePath: vscode.Uri) {
    return vscode.workspace.fs.readFile(bundlePath).then((uint8Array) => {
        const bundle = new TextDecoder().decode(uint8Array);
        return html.replace('/*--webpack-bundle--*/', bundle);
    });
}

// Packs all modules in src/app into a single bundle.js file and attaches it to index.html
// Then displays result in a webview
export function runApp(context: vscode.ExtensionContext, args: object, debug: boolean = true) {
    // Pack app
    const srcDir = context.asAbsolutePath('src');
    packApp(srcDir, debug, (err, stats) => {
        if (err) {
            console.error(err);
            return;
        }
        if (stats) {
            console.log(stats.toString());
        }
        const indexFilePath = vscode.Uri.file(context.asAbsolutePath(path.join('src','index.html')));
        const bundleFilePath = vscode.Uri.file(context.asAbsolutePath(path.join('src','dist','bundle.js')));

        // Read index.html
        vscode.workspace.fs.readFile(indexFilePath).then((uint8Array) => {
            const html = new TextDecoder().decode(uint8Array);
            // Inject bundle.js
            return injectBundle(html, bundleFilePath);
        }).then((injectedHtml) => {
            // Create webview
            const panel = vscode.window.createWebviewPanel('vspong', 'VS Pong', vscode.ViewColumn.One, {
                enableScripts: true,
            });
            panel.webview.html = injectedHtml;
            // Listen to messages from webview
            panel.webview.onDidReceiveMessage((message) => {
                if (message.command === 'ready') {
                    // Send args to webview
                    console.log('Sending args to webview');
                    panel.webview.postMessage(args);
                }
            });
        });
    });
}