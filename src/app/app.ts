import { GraphicEngine } from "./graphicEngine";
import { Local1PlayerGame, Local2PlayerGame } from "./game";
import { Remote2PlayerGameHost, Remote2PlayerGameClient } from "./remoteGame";

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

function createMultiplayerGame() {
    const game = new Remote2PlayerGameHost(graphicEngine);
    game.mainLoop();
}

function joinMultiplayerGame(gameId: string) {
    const game = new Remote2PlayerGameClient(graphicEngine, gameId);
    game.mainLoop();
}

// Handle messages from the extension
function handleMessage(message: Message) {
    const args = message.args;
    switch (message.command) {
        case 'startLocalMultiplayer': startLocalMultiplayer(); break;
        case 'startLocalSingleplayer': startLocalSingleplayer(); break;
        case 'startRemoteMultiplayer': createMultiplayerGame(); break;
        case 'joinRemoteMultiplayer': joinMultiplayerGame(args.gameId); break;
    }
}

// Listen to messages from the extension
window.addEventListener('message', (event) => {
    handleMessage(event.data);
});

// Send a message to the extension to signal that the webview is ready
const vscode = acquireVsCodeApi();
vscode.postMessage({command: 'ready'});