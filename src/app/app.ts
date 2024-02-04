import { GraphicEngine } from './graphicEngine';
import { Local1PlayerGame, Local2PlayerGame } from './game';
import { Remote2PlayerGameHost, Remote2PlayerGameClient } from './remoteGame';

declare function acquireVsCodeApi(): any;
export interface Message {
    command: string,
    args: any
}

// Create the graphic engine
const graphicEngine = new GraphicEngine(800, 600);

// Start a local multiplayer game
function startLocalMultiplayer({username} : {username: string}) {
    const game = new Local2PlayerGame(graphicEngine, username);
    game.lobbyLoop();
}

function startLocalSingleplayer({username} : {username: string}) {
    const game = new Local1PlayerGame(graphicEngine, username);
    game.lobbyLoop();
}

function createMultiplayerGame({gameId, username} : {gameId: string, username: string}) {
    const game = new Remote2PlayerGameHost(graphicEngine, gameId, username);
    game.lobbyLoop();
}

function joinMultiplayerGame({gameId, username} : {gameId: string, username: string}) {
    const game = new Remote2PlayerGameClient(graphicEngine, gameId, username);
    game.lobbyLoop();
}

// Handle messages from the extension
function handleMessage(message: Message) {
    const args = message.args;
    switch (message.command) {
        case 'startLocalMultiplayer': startLocalMultiplayer(args); break;
        case 'startLocalSingleplayer': startLocalSingleplayer(args); break;
        case 'startRemoteMultiplayer': createMultiplayerGame(args); break;
        case 'joinRemoteMultiplayer': joinMultiplayerGame(args); break;
    }
}

// Listen to messages from the extension
window.addEventListener('message', (event) => {
    handleMessage(event.data);
});

// Send a message to the extension to signal that the webview is ready
const vscode = acquireVsCodeApi();
vscode.postMessage({command: 'ready'});