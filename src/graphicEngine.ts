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
                this.setCanvasDimensions(width, height);
                if (onReady) { onReady(); }
            }
        });
    }
    
    setCanvasDimensions(width: number, height: number) {
        this.panel.webview.postMessage({
            command: 'setCanvasDimensions',
            args: {width, height}
        });
    }

    setCanvasStyle(styles: Partial<CSSStyleDeclaration>) {
        this.panel.webview.postMessage({
            command: 'setCanvasStyle',
            args: styles
        });
    }

    fillRect(x: number, y: number, width: number, height: number) {
        this.panel.webview.postMessage({
            command: 'fillRect',
            args: {x, y, width, height}
        });
    }

    relativeToAbsolute({x, y, width, height}: {x?: number, y?: number, width?: number, height?: number}) {
        return {
            x: x ? x * this.width : 0,
            y: y ? y * this.height : 0,
            width: width ? width * this.width : this.width,
            height: height ? height * this.height : this.height,
        };
    }

    drawMiddleLine() {
        const {x: xFrom, y: yFrom} = this.relativeToAbsolute({x: 0.5, y: 0});
        const {x: xTo, y: yTo} = this.relativeToAbsolute({x: 0.5, y: 1});
        const {height: segmentLength} = this.relativeToAbsolute({height: 0.01});
        const segments = [segmentLength, segmentLength];
        this.panel.webview.postMessage({
            command: 'fillDashedLine',
            args: {xFrom, yFrom, xTo, yTo, segments}
        });
    }

    clear() {
        this.panel.webview.postMessage({command: 'clearRect', args: {x: 0, y: 0, width: this.width, height: this.height}});
    }

    addKeyDownListener(callback: ({key }: {key: string}) => void) {
        this.panel.webview.postMessage({command: 'addKeyDownListener'});
        this.panel.webview.onDidReceiveMessage((message) => {
            if (message.command === 'keydown') {
                callback(message.args);
            }
        });
    }

    onNewAnimationFrame(callback: () => void) {
        setTimeout(() => {
            callback();
            this.onNewAnimationFrame(callback);
        }
        , 1000 / 60);
    }
}

