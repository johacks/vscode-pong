import * as vscode from 'vscode';
import * as path from 'path';
import { TextDecoder } from 'util';


export class GraphicEngine {
    width: number;
    height: number;
    panel: vscode.WebviewPanel;

    constructor(width: number, height: number, context: vscode.ExtensionContext, onReady?: () => void) {
        this.width = width;
        this.height = height;
        this.panel = vscode.window.createWebviewPanel(
            'canvas', 'Canvas Drawing', vscode.ViewColumn.One, {enableScripts: true}
        );
        // Read index.html
        const filePath = context.asAbsolutePath(path.join('src', 'index.html'));
        const uri = vscode.Uri.file(filePath);
        vscode.workspace.fs.readFile(uri).then((uint8Array) => {
            const html = new TextDecoder().decode(uint8Array);
            this.panel.webview.html = html;
        });

        // Callback when the webview is ready
        this.panel.webview.onDidReceiveMessage((message) => {
            if (message.command === 'ready') {
                if (onReady) { onReady(); }
            }
        });
    }

    setCanvasStyle(styles: Partial<CSSStyleDeclaration>) {
        this.panel.webview.postMessage({
            command: 'setCanvasStyle',
            args: styles
        });
    }

    fillRect(x: number, y: number, width: number, height: number, color: string = 'black') {
        this.panel.webview.postMessage({
            command: 'fillRect',
            args: {x, y, width, height, color}
        });
    }

    relativeToAbsolute({x, y, width, height}: {x: number, y: number, width: number, height: number}) {
        return {
            x: x ? x * this.width : 0,
            y: y ? y * this.height : 0,
            width: width ? width * this.width : this.width,
            height: height ? height * this.height : this.height,
        };
    }

    clear() {
        this.panel.webview.postMessage({command: 'clear', args: {}});
    }
}

