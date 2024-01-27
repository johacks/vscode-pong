// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { runApp } from './launcher';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	let localMultiplayerDisposal = vscode.commands.registerCommand('vspong.pongLocalMultiplayer', () => {
		// The code you place here will be executed every time your command is executed
		runApp(context, {command: 'startLocalMultiplayer'});
	});

	let localSingleplayerDisposal = vscode.commands.registerCommand('vspong.pongSingleplayer', () => {
		runApp(context, {command: 'startLocalSingleplayer'});
	});

	// let hostMultiplayerDisposal = vscode.commands.registerCommand('vspong.pongRemoteMultiplayerCreate', () => {
	// 	const graphicEngine = new GraphicEngine(800, 600, context, () => {
	// 		const game = new Remote2PlayerGameHost(graphicEngine);
	// 		game.mainLoop();
	// 	});
	// });

	// let joinMultiplayerDisposal = vscode.commands.registerCommand('vspong.pongRemoteMultiplayerJoin', () => {
	// 	Extract game ID from user
	// 	vscode.window.showInputBox({prompt: 'Enter game ID'}).then((gameId) => {
	// 		if (gameId) {
	// 			const graphicEngine = new GraphicEngine(800, 600, context, () => {
	// 				const game = new Remote2PlayerGameClient(graphicEngine, gameId);
	// 				game.mainLoop();
	// 			});
	// 		}
	// 		else {
	// 			vscode.window.showErrorMessage('No game ID entered');
	// 		}
	// 	});
	// });

	context.subscriptions.push(localMultiplayerDisposal);
	// context.subscriptions.push(localSingleplayerDisposal);
	// context.subscriptions.push(hostMultiplayerDisposal);
	// context.subscriptions.push(joinMultiplayerDisposal);
}

// This method is called when your extension is deactivated
export function deactivate() {}
