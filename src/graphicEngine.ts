import * as vscode from 'vscode';
import * as path from 'path';
import { TextDecoder } from 'util';

export class GraphicEngine {
    width: number;
    height: number;
    panel: vscode.WebviewPanel;
    messageQueue: any[];

    constructor(width: number, height: number, context: vscode.ExtensionContext, onReady?: () => void) {
        this.width = width;
        this.height = height;
        this.panel = vscode.window.createWebviewPanel(
            'canvas', 'Canvas Drawing', vscode.ViewColumn.One, {enableScripts: true}
        );
        this.messageQueue = [];
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
        this.messageQueue.push({
            command: 'setCanvasDimensions',
            args: {width, height}
        });
    }

    setCanvasStyle(styles: Partial<CSSStyleDeclaration>) {
        this.messageQueue.push({
            command: 'setCanvasStyle',
            args: styles
        });
    }

    fillRect(x: number, y: number, width: number, height: number) {
        this.messageQueue.push({
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
        this.messageQueue.push({
            command: 'fillDashedLine',
            args: {xFrom, yFrom, xTo, yTo, segments}
        });
    }

    clear() {
        // Reset the message queue and clear the canvas
        this.messageQueue.push({command: 'clearRect', args: {x: 0, y: 0, width: this.width, height: this.height}});
    }

    addKeyDownListener(callback: ({key }: {key: string}) => void) {
        this.messageQueue.push({command: 'addKeyDownListener'});
        this.panel.webview.onDidReceiveMessage((message) => {
            if (message.command === 'keydown') {
                callback(message.args);
            }
        });
    }

    addKeyUpListener(callback: ({key }: {key: string}) => void) {
        this.messageQueue.push({command: 'addKeyUpListener'});
        this.panel.webview.onDidReceiveMessage((message) => {
            if (message.command === 'keyup') {
                callback(message.args);
            }
        });
    }

    flush() {
        this.panel.webview.postMessage({command: "messageQueue", args: this.messageQueue});
        this.messageQueue = [];
    }
}

