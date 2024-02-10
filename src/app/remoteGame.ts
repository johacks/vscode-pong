import { Local1PlayerGame, Local2PlayerGame } from './game';
import { GraphicEngine } from './graphicEngine';
import { PADDLE_STEP_SIZE } from './game';
import { Figure } from './figure';
import { Ball } from './ball';


declare class Peer {
    constructor(id?: string, options?: object);
    constructor(options?: object);
    on(event: string, callback: (connection: DataConnection) => void): void;
    connect(id: string, options?: object): DataConnection;
}

declare class DataConnection {
    on(event: string, callback: (message: string | object) => void): void;
    send(message: string): void;
}

interface BallPosition {
    y: number;
    x: number;
}

interface BallPositionAndSpeed extends BallPosition {
    speedX: number;
    speedY: number;
}

function applyBallPosition(ball: Ball, position: BallPosition) {
    ball.y = position.y;
    ball.x = position.x;
}

function applyBallPositionAndSpeed(ball: Ball, position: BallPositionAndSpeed) {
    applyBallPosition(ball, position);
    ball.speedY = position.speedY;
    ball.speedX = position.speedX;
}

interface PeerState {
    opponentPaddleY: number;
    ball: BallPosition;
    score: number;
    timestamp: number;
}

enum Side {
    LEFT = 'left', RIGHT = 'right'
}

abstract class Remote2PlayerGame extends Local2PlayerGame {
    gameId: string;
    peer: Peer | undefined;
    connection: DataConnection | undefined;
    side: Side;
    ping: number = 0;
    connectionReady: boolean = false;
    ballMovingToOurSide: boolean = false;
    lastTimestamp: number = 0;

    constructor(graphicEngine: GraphicEngine, gameId: string, leftPlayerName: string, rightPlayerName: string, side: Side) {
        super(graphicEngine, leftPlayerName);
        this.rightPlayerName = rightPlayerName;
        this.gameId = gameId;
        this.side = side;
        this.setUpPeerListeners();
    }
    abstract setUpPeerListeners(): void;

    // Properties depending on the side
    get paddle(): Figure {
        return this.side === Side.LEFT ? this.leftPaddle : this.rightPaddle;
    }
    get opponentPaddle(): Figure {
        return this.side === Side.LEFT ? this.rightPaddle : this.leftPaddle;
    }
    get playerName(): string {
        return this.side === Side.LEFT ? this.leftPlayerName : this.rightPlayerName;
    }
    set opponentName(name: string) {
        if (this.side === Side.LEFT) { this.rightPlayerName = name; } 
        else { this.leftPlayerName = name; }
    }

    get score(): number {
        return this.side === Side.LEFT ? this.leftScore : this.rightScore;
    }

    set score(score: number) {
        if (this.side === Side.LEFT) { this.leftScore = score; } 
        else { this.rightScore = score; }
    }

    get opponentScore(): number {
        return this.side === Side.LEFT ? this.rightScore : this.leftScore;
    }

    set opponentScore(score: number) {
        if (this.side === Side.LEFT) { this.rightScore = score; } 
        else { this.leftScore = score; }
    }

    onConnectionReady() {
        const message = '[HANDSHAKE] ' + this.playerName;
        this.connection?.send(message);
        this.connectionReady = true;
    }
    onConnectionMessage(message: string) {
        // Check if the message is a handshake
        if (message.startsWith('[HANDSHAKE] ')) {
            this.opponentName = message.substring('[HANDSHAKE] '.length);
            return;
        }
        if (message.startsWith('[BOUNCE] ')) {
            this.ballMovingToOurSide = true;
            const ballState = JSON.parse(message.substring('[BOUNCE] '.length)) as BallPositionAndSpeed;
            applyBallPositionAndSpeed(this.ball, ballState);
            return;
        }
        // Check if the message is a peer state
        let peerState: PeerState;
        try {
            peerState = JSON.parse(message) as PeerState;
        } catch (error) {
            console.error('Received invalid data from peer: ' + message);
            return;
        }
        if (peerState.score !== this.score) {
            // We have scored
            this.leftScoredLast = this.side === Side.LEFT;
            this.score = peerState.score;
            this.resetFigures();
        }
        this.opponentPaddle.y = peerState.opponentPaddleY;
        this.ping = peerState.timestamp - this.lastTimestamp;
        this.lastTimestamp = peerState.timestamp;
        // Ensure we only apply peer ball position if its moving towards him
        if (!this.ballMovingToOurSide) {
            applyBallPosition(this.ball, peerState.ball);
        }
    }
    addKeyDownUpListeners() {
        window.addEventListener('keydown', ({key}) => {
            switch (key) {
                case 'ArrowUp': this.paddle.speedY = -this.adaptStep(PADDLE_STEP_SIZE); break;
                case 'ArrowDown': this.paddle.speedY = this.adaptStep(PADDLE_STEP_SIZE); break;
            }
        });
        window.addEventListener('keyup', ({key}) => {
            this.keyPressed = true;
            if (key === 'ArrowUp' || key === 'ArrowDown') {
                this.paddle.speedY = 0;
            }
        });
    }

    handleCollisions() {
        if (this.ballMovingToOurSide) {
            // If the ball is moving to our side, we act as the host
            this.ball.handleBounceOnFloorOrCeiling();
            this.ballMovingToOurSide = !this.ball.handleBounceOnPaddle(this.paddle);
            if (!this.ballMovingToOurSide) {
                // Notify the opponent he is now the host
                this.connection?.send('[BOUNCE] ' + JSON.stringify({
                    x: this.ball.x,
                    y: this.ball.y,
                    speedX: this.ball.speedX,
                    speedY: this.ball.speedY,
                }));
            }
        }        
    }

    moveFigures() {
        if (this.ballMovingToOurSide) {
            this.ball.move();
        }
        this.paddle.move();
    }

    handlePlayerScored() {
        // Only check our own side
        if (this.ballMovingToOurSide) {
            // The opponent scored
            if (this.ball.x <= 0 || this.ball.x + this.ball.width >= 1) {
                this.opponentScore++;
                this.leftScoredLast = this.side !== Side.LEFT;
                this.resetFigures();
            }
        }
    }

    checkShouldServeBall() {
        const opponentScoredLast = this.leftScoredLast === (this.side !== Side.LEFT);
        if (this.ball.speedX === 0 && !this.servingBall && opponentScoredLast) {
            this.servingBall = true;
            setTimeout(() => this.serveBall(), 1000);
        }
    }

    printBase(): void {
        super.printBase();
        this.graphicEngine.printPing(this.ping);
    }

    mainLoop(callNumber: number = 0) {
        if (!this.connection) { return; }
        let gameState: PeerState = {
            opponentPaddleY: this.paddle.y,
            ball: {x: this.ball.x, y: this.ball.y},
            score: this.opponentScore,
            timestamp: Date.now()
        };
        this.connection.send(JSON.stringify(gameState));
        super.mainLoop(callNumber);
    }
}


export class Remote2PlayerGameHost extends Remote2PlayerGame {

    constructor(graphicEngine: GraphicEngine, gameId: string, leftPlayerName: string='Host', rightPlayerName: string='-') {
        super(graphicEngine, gameId, leftPlayerName, rightPlayerName, Side.LEFT);
        this.ballMovingToOurSide = true;
    }

    setUpPeerListeners() {
        if (!finishedGeoLoc) {
            setTimeout(() => this.setUpPeerListeners(), 100);
            return;
        }
        this.peer = new Peer(this.gameId, {config: {iceServers}});
        this.peer.on('error', (error) => console.error('Peer error: ' + JSON.stringify(error)));
        this.peer.on('connection', (connection: DataConnection) => {
            this.connection = connection;
            this.connection.on('open', () => this.onConnectionReady());
            this.connection.on('data', (message) => this.onConnectionMessage(message as string));
        });
    }

    addKeyDownUpListeners() {
        window.addEventListener('keydown', ({key}) => {
            switch (key) {
                case 'ArrowUp': this.leftPaddle.speedY = -this.adaptStep(PADDLE_STEP_SIZE); break;
                case 'ArrowDown': this.leftPaddle.speedY = this.adaptStep(PADDLE_STEP_SIZE); break;
            }
        });
        window.addEventListener('keyup', ({key}) => {
            if (key === 'ArrowUp' || key === 'ArrowDown') {
                this.leftPaddle.speedY = 0;
            }
        });
    }

    printControls(): void {
        // Call method on Local1PlayerGame
        Local1PlayerGame.prototype.printControls.call(this);
    }

    printBase(): void {
        super.printBase();
        this.graphicEngine.printGameId(this.gameId);
    }

    lobbyLoop(callNumber: number = 0): void {
        if (this.connectionReady) {
            setTimeout(() => this.mainLoop(0), 1000 / this.loopsPerSecond);
            return;
        }
        this.printBase();
        this.graphicEngine.printTitle('VSPong');
        if ((callNumber / (this.loopsPerSecond * 0.75)) % 2 < 1) {  // Blink every 0.75 seconds
            this.graphicEngine.printSubTitle('Waiting for player to join...');
        }
        this.graphicEngine.flush();
        setTimeout(() => this.lobbyLoop(callNumber + 1), 1000 / this.loopsPerSecond);
    }
}


export class Remote2PlayerGameClient extends Remote2PlayerGame {
    constructor(graphicEngine: GraphicEngine, gameId: string, rightPlayerName: string='Client', leftPlayerName: string='-', ) {
        super(graphicEngine, gameId, leftPlayerName, rightPlayerName, Side.RIGHT);
        this.ballMovingToOurSide = false;
    }

    onConnectionError(error: object) {
        console.error('Connection error: ' + JSON.stringify(error));
        throw new Error('Failed to connect to game with ID ' + this.gameId + ': ' + error);
    }

    setUpPeerListeners() {
        // Connect to peer
        if (!finishedGeoLoc) {
            setTimeout(() => this.setUpPeerListeners(), 100);
            return;
        }
        this.peer = new Peer({config: {iceServers}});
        this.peer.on('open', (id) => {
            this.connection = (this.peer as Peer).connect(this.gameId, {reliable: true});
            this.connection.on('error', (error) => this.onConnectionError(error as object));
            this.connection.on('open', () => this.onConnectionReady());
            this.connection.on('data', (message) => this.onConnectionMessage(message as string));
        }
        );
    }

    printControls(): void {
        this.graphicEngine.printControls('Move right paddle with Up/Down arrows.');
    }

    lobbyLoop(callNumber: number = 0): void {
        if (this.connectionReady) {
            setTimeout(() => this.mainLoop(0), 1000 / this.loopsPerSecond);
            return;
        }
        this.printBase();
        this.graphicEngine.printTitle('VSPong');
        if ((callNumber / (this.loopsPerSecond * 0.75)) % 2 < 1) {  // Blink every 0.75 seconds
            this.graphicEngine.printSubTitle('Connecting to game...');
        }
        this.graphicEngine.flush();
        setTimeout(() => this.lobbyLoop(callNumber + 1), 1000 / this.loopsPerSecond);
    }
}

// STUN server selection

const GEO_LOC_URL = 'https://raw.githubusercontent.com/pradt2/always-online-stun/master/geoip_cache.txt';
const IPV4_URL = 'https://raw.githubusercontent.com/pradt2/always-online-stun/master/valid_ipv4s.txt';
const GEO_USER_URL = 'https://geolocation-db.com/json/';
let finishedGeoLoc = false;

fetch(GEO_LOC_URL)
    .then(response => response.json())
    .then(geoLocs => {
        fetch(GEO_USER_URL)
            .then(response => response.json())
            .then(({ latitude, longitude }) => {
                fetch(IPV4_URL)
                    .then(response => response.text())
                    .then(data => {
                        let closestAddr = data.trim().split('\n')
                            .map(addr => {
                                const [stunLat, stunLon] = geoLocs[addr.split(':')[0]];
                                const dist = ((latitude - stunLat) ** 2 + (longitude - stunLon) ** 2) ** 0.5;
                                return [addr, dist];
                            })
                            .reduce((prev, curr) => prev[1] <= curr[1] ? prev : curr)[0];
                        closestAddr = 'stun:' + closestAddr;
                        console.log('Using closest STUN server: ' + closestAddr);
                        // Insert at the beginning of the list
                        iceServers.unshift({ urls: closestAddr as string });
                        finishedGeoLoc = true;
                    });
            });
    })
    .catch(error => {
        console.error('Error:', error);
        finishedGeoLoc = true;
    });

const iceServers = [
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