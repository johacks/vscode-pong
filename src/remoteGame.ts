import { Local1PlayerGame, Local2PlayerGame } from './game';
import { GraphicEngine } from './graphicEngine';
import { PADDLE_STEP_SIZE } from './game';
import { effectiveStepSize } from './game';
import { Figure } from './figure';

interface Position {
    x: number;
    y: number;
    speedX: number;
    speedY: number;
}

function extractPosition(figure: Figure) {
    return {x: figure.x, y: figure.y, speedX: figure.speedX, speedY: figure.speedY};
}

function applyPosition(figure: Figure, position: Position) {
    figure.x = position.x;
    figure.y = position.y;
    figure.speedX = position.speedX;
    figure.speedY = position.speedY;
}

interface GameState {
    leftPaddle: Position;
    rightPaddle: Position;
    ball: Position;
    leftScore: number;
    rightScore: number;
    leftScoredLast: boolean;
}

export class Remote2PlayerGameHost extends Local2PlayerGame {
    gameId: string;
    connectionReady: boolean = false;

    constructor(graphicEngine: GraphicEngine, leftPlayerName: string='Host', rightPlayerName: string='-') {
        super(graphicEngine);
        this.leftPlayerName = leftPlayerName;
        this.rightPlayerName = rightPlayerName;
        // Genrate a random game ID
        this.gameId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        this.gameId = 'vscode-pong-' + this.gameId + '-AAAA';
        this.graphicEngine.printGameId(this.gameId);
        this.setUpPeerListeners();
    }

    onConnectionReady() {
        console.log('Connection ready');
        this.connectionReady = true;
        const message = "[HANDSHAKE] " + this.leftPlayerName;
        this.graphicEngine.sendConnectionMessage(message);
    }

    onConnectionMessage(message: string) {
        // Try to interpret as right paddle speed
        try {
            this.rightPaddle.speedY = parseFloat(message);
        }
        catch {
            if (message.startsWith('[HANDSHAKE] ')) {
                this.rightPlayerName = message.substring('[HANDSHAKE] '.length);
                this.graphicEngine.setRightPlayerName(this.rightPlayerName);
            }
            else {
                console.log('Received invalid data from peer: ' + message);
            }
        }
    }

    setUpPeerListeners() {
        // Send a handshake to our peer
        this.graphicEngine.createConnection(
            this.gameId,
            () => this.onConnectionReady(),  // onConnectionReady sends the handshake
            (message) => this.onConnectionMessage(message) // onConnectionMessage interprets the handshake
        );
    }

    moveFigures() {
        super.moveFigures();

        // Send game state to peer
        if (this.connectionReady) {
            this.graphicEngine.sendConnectionMessage(JSON.stringify({
                leftPaddle: extractPosition(this.leftPaddle),
                rightPaddle: extractPosition(this.rightPaddle),
                ball: extractPosition(this.ball),
                leftScore: this.leftScore,
                rightScore: this.rightScore,
                leftScoredLast: this.leftScoredLast,
            }));
        }
    }

    addKeyDownUpListeners() {
        // Call method on Local1PlayerGame
        Local1PlayerGame.prototype.addKeyDownUpListeners.call(this);
    }
}


export class Remote2PlayerGameClient extends Local2PlayerGame {
    gameId: string;
    connectionReady: boolean = false;

    constructor(graphicEngine: GraphicEngine, gameId: string, leftPlayerName: string='-', rightPlayerName: string='Client') {
        super(graphicEngine);
        this.leftPlayerName = leftPlayerName;
        this.rightPlayerName = rightPlayerName;
        this.gameId = gameId;
        this.setUpPeerListeners();
    }

    onConnectionError(error: object) {
        throw new Error('Failed to connect to game with ID ' + this.gameId + ': ' + error);
    }

    onConnectionReady() {
        console.log('Connection ready');
        this.connectionReady = true;
        const message = "[HANDSHAKE] " + this.rightPlayerName;
        this.graphicEngine.sendConnectionMessage(message);
    }

    onConnectionMessage(message: string) {
        if (message.startsWith('[HANDSHAKE] ')) {
            this.leftPlayerName = message.substring('[HANDSHAKE] '.length);
            this.graphicEngine.setLeftPlayerName(this.leftPlayerName);
        }
        else {
            // Try to interpret as game state
            try {
                const gameState = JSON.parse(message) as GameState;
                applyPosition(this.leftPaddle, gameState.leftPaddle);
                applyPosition(this.rightPaddle, gameState.rightPaddle);
                applyPosition(this.ball, gameState.ball);
                this.leftScore = gameState.leftScore;
                this.rightScore = gameState.rightScore;
                this.leftScoredLast = gameState.leftScoredLast;
            }
            catch {
                console.log('Received invalid data from peer: ' + message);
            }
        }
    }

    setUpPeerListeners() {
        // Connect to our peer
        this.graphicEngine.connectToPeer(
            this.gameId,
            (error) => this.onConnectionError(error),
            () => this.onConnectionReady(),
            (message) => this.onConnectionMessage(message)
        );
    }

    // Handle keyboard events to send our paddle speed to the host
    addKeyDownUpListeners(): void {
        // Add listener for right paddle speed
        this.graphicEngine.addKeyDownListener(({key}) => {
            if (!this.connectionReady) {
                return;
            }
            if (key === 'ArrowUp') {
                this.graphicEngine.sendConnectionMessage(effectiveStepSize(PADDLE_STEP_SIZE).toString());
            } else if (key === 'ArrowDown') {
                this.graphicEngine.sendConnectionMessage((-effectiveStepSize(PADDLE_STEP_SIZE)).toString());
            }
        });
        this.graphicEngine.addKeyUpListener(({key}) => {
            if (!this.connectionReady) {
                return;
            }
            if (key === 'ArrowUp' || key === 'ArrowDown') {
                this.graphicEngine.sendConnectionMessage('0');
            }
        });
    }

    moveFigures(): void {
        // Do nothing, we will receive the game state from the host
    }

    handleCollisions(): void {
        // Do nothing, we will receive the game state from the host
    }

    handlePlayerScored(): void {
        // Do nothing, we will receive the game state from the host
    }
}