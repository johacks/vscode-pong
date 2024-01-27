import { GraphicEngine } from "./graphicEngine";
import { Local1PlayerGame, Local2PlayerGame } from "./game";

declare function acquireVsCodeApi(): any;
export interface Message {
    command: string,
    args: any
}

// Create the graphic engine
const graphicEngine = new GraphicEngine(800, 600);

// Start a local multiplayer game
function startLocalMultiplayer() {
    const game = new Local2PlayerGame(graphicEngine);
    game.mainLoop();
}

function startLocalSingleplayer() {
    const game = new Local1PlayerGame(graphicEngine);
    game.mainLoop();
}

// Handle messages from the extension
function handleMessage(message: Message) {
    const args = message.args;
    switch (message.command) {
        case 'startLocalMultiplayer': startLocalMultiplayer(); break;
        case 'startLocalSingleplayer': startLocalSingleplayer(); break;
    }
}

// Listen to messages from the extension
window.addEventListener('message', (event) => {
    handleMessage(event.data);
});

// Send a message to the extension to signal that the webview is ready
const vscode = acquireVsCodeApi();
vscode.postMessage({command: 'ready'});