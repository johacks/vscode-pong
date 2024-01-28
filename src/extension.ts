// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { runApp } from './launcher';

function getUsername() {
    const workspaceConfig = vscode.workspace.getConfiguration('vspong');
    return workspaceConfig.get('username', undefined) || 'Player';
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // The command has been defined in the package.json file
    let localMultiplayerDisposal = vscode.commands.registerCommand('vspong.pongLocalMultiplayer', () => {
        // The code you place here will be executed every time your command is executed
        runApp(context, {command: 'startLocalMultiplayer', args: {username: getUsername()}});
    });

    let localSingleplayerDisposal = vscode.commands.registerCommand('vspong.pongSingleplayer', () => {
        runApp(context, {command: 'startLocalSingleplayer', args: {username: getUsername()}});
    });

    let hostMultiplayerDisposal = vscode.commands.registerCommand('vspong.pongRemoteMultiplayerCreate', () => {
        console.log('Starting remote multiplayer');
        let gameId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        gameId = 'vscode-pong-' + gameId + '-AAAA';
        vscode.env.clipboard.writeText(gameId).then(() => {
            vscode.window.showInformationMessage('Game ID copied to clipboard, send it to your friend to join the game!');
        });
        runApp(context, {command: 'startRemoteMultiplayer', args: {gameId: gameId, username: getUsername()}});
    });

    let joinMultiplayerDisposal = vscode.commands.registerCommand('vspong.pongRemoteMultiplayerJoin', () => {
        // Extract game ID from user
        vscode.window.showInputBox({prompt: 'Enter game ID'}).then((gameId) => {
            if (gameId) {
                console.log('Joining remote multiplayer');
                runApp(context, {command: 'joinRemoteMultiplayer', args: {gameId: gameId, username: getUsername()}});
            }
            else {
                vscode.window.showErrorMessage('No game ID entered');
            }
        });
    });

    context.subscriptions.push(localMultiplayerDisposal);
    context.subscriptions.push(localSingleplayerDisposal);
    context.subscriptions.push(hostMultiplayerDisposal);
    context.subscriptions.push(joinMultiplayerDisposal);
}

// This method is called when your extension is deactivated
export function deactivate() {}
