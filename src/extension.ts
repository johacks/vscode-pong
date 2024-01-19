// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { GraphicEngine } from './graphicEngine';
import { Game } from './game';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	let disposable = vscode.commands.registerCommand('vspong.pong', () => {
		// The code you place here will be executed every time your command is executed
		const graphicEngine = new GraphicEngine(800, 600, context, () => {
			// Create a new game when the graphic engine is ready
			console.log('Graphic engine ready');
			const game = new Game(graphicEngine);
			game.mainLoop();
		});
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
