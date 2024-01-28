import { Local1PlayerGame, Local2PlayerGame } from './game';
import { GraphicEngine } from './graphicEngine';
import { PADDLE_STEP_SIZE } from './game';
import { effectiveStepSize } from './game';
import { Figure } from './figure';

const GEO_LOC_URL = 'https://raw.githubusercontent.com/pradt2/always-online-stun/master/geoip_cache.txt';
const IPV4_URL = 'https://raw.githubusercontent.com/pradt2/always-online-stun/master/valid_ipv4s.txt';
const GEO_USER_URL = 'https://geolocation-db.com/json/';
const geoLocs = await(await fetch(GEO_LOC_URL)).json();
const { latitude, longitude } = await(await fetch(GEO_USER_URL)).json();
const closestAddr = (await(await fetch(IPV4_URL)).text()).trim().split('\n')
    .map(addr => {
        const [stunLat, stunLon] = geoLocs[addr.split(':')[0]];
        const dist = ((latitude - stunLat) ** 2 + (longitude - stunLon) ** 2 ) ** .5;
        return [addr, dist];
    }).reduce(([addrA, distA], [addrB, distB]) => distA <= distB ? [addrA, distA] : [addrB, distB])[0];

const iceServers = [
    {  // Try to use closest STUN server
        urls: closestAddr
    },
    {
        urls: 'stun:stun.l.google.com:19302',
    },
    {
        urls: 'stun:stun.relay.metered.ca:80',
    },
    {
        urls: 'turn:standard.relay.metered.ca:80',
        username: 'c232ae0f3fd3138bec9ddb8b',
        credential: 'HudKCArjK0Mx62LU',
    },
    {
        urls: 'turn:standard.relay.metered.ca:80?transport=tcp',
        username: 'c232ae0f3fd3138bec9ddb8b',
        credential: 'HudKCArjK0Mx62LU',
    },
    {
        urls: 'turn:standard.relay.metered.ca:443',
        username: 'c232ae0f3fd3138bec9ddb8b',
        credential: 'HudKCArjK0Mx62LU',
    },
    {
        urls: 'turns:standard.relay.metered.ca:443?transport=tcp',
        username: 'c232ae0f3fd3138bec9ddb8b',
        credential: 'HudKCArjK0Mx62LU',
    },
];

declare class Peer {
    constructor(id?: string, options?: object);
    constructor(options?: object);
    on(event: string, callback: (connection: DataConnection) => void): void;
    connect(id: string): DataConnection;
}

declare class DataConnection {
    on(event: string, callback: (message: string | object) => void): void;
    send(message: string): void;
}

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
    peer: Peer | undefined;
    connection: DataConnection | undefined;

    constructor(graphicEngine: GraphicEngine, gameId: string, leftPlayerName: string='Host', rightPlayerName: string='-') {
        super(graphicEngine, leftPlayerName);
        this.rightPlayerName = rightPlayerName;
        // Genrate a random game ID
        this.gameId = gameId;
        this.graphicEngine.printGameId(this.gameId);
        this.setUpPeerListeners();
    }

    onConnectionReady() {
        const message = '[HANDSHAKE] ' + this.leftPlayerName;
        this.connection?.send(message);
    }

    checkShouldServeBall(): void {
        if (this.connection) {
            super.checkShouldServeBall();
        }
    }

    onConnectionMessage(message: string) {
        // Try to interpret as right paddle speed
        if (message.startsWith('[HANDSHAKE] ')) {
            this.rightPlayerName = message.substring('[HANDSHAKE] '.length);
            this.graphicEngine.setRightPlayerName(this.rightPlayerName);
            return;
        }
        try {
            this.rightPaddle.speedY = parseFloat(message);
        } catch (error) {
            console.error('Received invalid data from peer: ' + message);
        }
    }

    setUpPeerListeners() {
        this.peer = new Peer(this.gameId, {config: {iceServers}});
        this.peer.on('error', (error) => console.error('Peer error: ' + JSON.stringify(error)));
        this.peer.on('connection', (connection: DataConnection) => {
            this.connection = connection;
            this.connection.on('open', () => this.onConnectionReady());
            this.connection.on('data', (message) => this.onConnectionMessage(message as string));
        });
    }

    moveFigures() {
        super.moveFigures();

        // Send game state to peer
        if (this.connection) {
            this.connection.send(JSON.stringify({
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

    printControls(): void {
        // Call method on Local1PlayerGame
        Local1PlayerGame.prototype.printControls.call(this);
    }
}


export class Remote2PlayerGameClient extends Local2PlayerGame {
    gameId: string;
    connection: DataConnection | undefined;
    peer: Peer | undefined;

    constructor(graphicEngine: GraphicEngine, gameId: string, rightPlayerName: string='Client', leftPlayerName: string='-', ) {
        super(graphicEngine, leftPlayerName);
        this.rightPlayerName = rightPlayerName;
        this.gameId = gameId;
        this.setUpPeerListeners();
    }

    onConnectionError(error: object) {
        console.error('Connection error: ' + JSON.stringify(error));
        throw new Error('Failed to connect to game with ID ' + this.gameId + ': ' + error);
    }

    onConnectionReady() {
        const message = '[HANDSHAKE] ' + this.rightPlayerName;
        this.connection?.send(message);
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
                console.error('Received invalid data from peer: ' + message);
            }
        }
    }

    setUpPeerListeners() {
        // Connect to peer
        this.peer = new Peer({config: {iceServers}});
        this.peer.on('open', (id) => {
            this.connection = (this.peer as Peer).connect(this.gameId);
            this.connection.on('error', (error) => this.onConnectionError(error as object));
            this.connection.on('open', () => this.onConnectionReady());
            this.connection.on('data', (message) => this.onConnectionMessage(message as string));
        }
        );
    }

    // Handle keyboard events to send our paddle speed to the host
    addKeyDownUpListeners(): void {
        // Add listener for right paddle speed
        window.addEventListener('keydown', ({key}) => {
            if (!this.connection) {
                return;
            }
            if (key === 'ArrowUp') {
                this.connection.send((-effectiveStepSize(PADDLE_STEP_SIZE)).toString());
            } else if (key === 'ArrowDown') {
                this.connection.send(effectiveStepSize(PADDLE_STEP_SIZE).toString());
            }
        });
        window.addEventListener('keyup', ({key}) => {
            if (!this.connection) {
                return;
            }
            if (key === 'ArrowUp' || key === 'ArrowDown') {
                this.connection.send('0');
            }
        });
    }

    moveFigures(): void {
        // Done by host
    }

    handleCollisions(): void {
        // Done by host
    }

    handlePlayerScored(): void {
        // Done by host
    }

    checkShouldServeBall(): void {
        // Done by host
    }

    printControls(): void {
        this.graphicEngine.printControls('Move right paddle with Up/Down arrows.');
    }
}