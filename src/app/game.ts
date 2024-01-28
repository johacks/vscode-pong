import { Ball } from './ball';
import { GraphicEngine } from './graphicEngine';
import { Paddle } from './paddle';

const BALL_SIZE = 0.01;
const BALL_SPEED_X = 0.015;
const BALL_SPEED_Y = 0.01;
const MAX_BALL_SPEED_FACTOR = 2;
const BALL_SPEED_RATE = 1.05;
const PADDLE_WIDTH = 0.02;
const PADDLE_HEIGHT = 0.2;
const PADDLE_STEP_SIZE = 0.025;
const GAME_FPS = 120;  // Frames per second, in terms of computation
const FRAME_PRINT_FREQUENCY = 2;  // Print every FRAME_PRINT_FREQUENCY frames, e.g. 2 means 30 FPS for GAME_FPS = 60

export function effectiveStepSize(stepSize: number) {
    return stepSize * (60 / GAME_FPS);
}

export { BALL_SIZE, BALL_SPEED_X, BALL_SPEED_Y, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_STEP_SIZE, GAME_FPS, FRAME_PRINT_FREQUENCY};

export class Local2PlayerGame {
    leftPaddle: Paddle;
    rightPaddle: Paddle;
    ball: Ball;
    graphicEngine: GraphicEngine;
    leftScore: number;
    rightScore: number;
    leftScoredLast: boolean;
    leftPlayerName: string;
    rightPlayerName: string;
    servingBall: boolean = false;

    constructor(graphicEngine: GraphicEngine, leftPlayerName: string) {
        this.graphicEngine = graphicEngine;
        this.leftPaddle = this.resetLeftPaddle();
        this.rightPaddle = this.resetRightPaddle();
        this.leftScore = 0;
        this.rightScore = 0;
        this.ball = this.resetBall();
        this.leftScoredLast = false;
        this.leftPlayerName = leftPlayerName;
        this.rightPlayerName = 'Guest';
        this.graphicEngine.setLeftPlayerName(this.leftPlayerName);
        this.graphicEngine.setRightPlayerName(this.rightPlayerName);
        // Add our listeners to handle changes in the game state
        this.addKeyDownUpListeners();
    }

    addKeyDownUpListeners() {
        window.addEventListener('keydown', ({key}) => {
            switch (key as string) {
                case 'w': this.leftPaddle.speedY = -effectiveStepSize(PADDLE_STEP_SIZE); break;
                case 's': this.leftPaddle.speedY = effectiveStepSize(PADDLE_STEP_SIZE); break;
                case 'ArrowUp': this.rightPaddle.speedY = -effectiveStepSize(PADDLE_STEP_SIZE); break;
                case 'ArrowDown': this.rightPaddle.speedY = effectiveStepSize(PADDLE_STEP_SIZE); break;
            }
        });
        window.addEventListener('keyup', ({key}) => {
            key = key as string;
            if (key === 'ArrowUp' || key === 'ArrowDown') {
                this.rightPaddle.speedY = 0;
            }
            else if (key === 'w' || key === 's') {
                this.leftPaddle.speedY = 0;
            }
        });
    }

    resetBall() {
        this.ball = new Ball(0.5, 0.5, BALL_SIZE, 0.0, 0.0, BALL_SPEED_RATE, MAX_BALL_SPEED_FACTOR);
        // Serve the ball after 1 second
        return this.ball;
    }

    serveBall() {
        this.servingBall = false;
        // If the left player scored last, the ball goes to the right, and vice versa
        const speedXsign = this.leftScoredLast ? 1 : -1;
        this.ball.speedX = effectiveStepSize(BALL_SPEED_X) * speedXsign;
        // Speed y is a random number
        this.ball.speedY = effectiveStepSize(BALL_SPEED_Y * (Math.random() * 2 - 1));
    }

    resetLeftPaddle() {
        this.leftPaddle = new Paddle(0, 0.5, PADDLE_WIDTH, PADDLE_HEIGHT, 0);
        return this.leftPaddle;
    }

    resetRightPaddle() {
        this.rightPaddle = new Paddle(1 - PADDLE_WIDTH, 0.5, PADDLE_WIDTH, PADDLE_HEIGHT, 0);
        return this.rightPaddle;
    }

    resetFigures() {
        this.resetBall();
        this.resetLeftPaddle();
        this.resetRightPaddle();
    }


    moveFigures() {
        this.leftPaddle.move();
        this.rightPaddle.move();
        this.ball.move();
    }

    handleCollisions() {
        if (this.ball.speedX < 0) {
            // If the ball is moving left, it can only collide with the left paddle
            this.ball.handleBounceOnPaddle(this.leftPaddle);
        }
        else {
            // If the ball is moving right, it can only collide with the right paddle
            this.ball.handleBounceOnPaddle(this.rightPaddle);
        }
        this.ball.handleBounceOnFloorOrCeiling();
    }

    handlePlayerScored() {
        // If the ball is outside the canvas, the player scored
        if (this.ball.x <= 0) {
            this.rightScore++;
            this.leftScoredLast = false;
        }
        else if (this.ball.x + this.ball.width >= 1) {
            this.leftScore++;
            this.leftScoredLast = true;
        }
        else { return; }
        this.resetFigures();
    }

    printControls() {
        this.graphicEngine.printControls('Move left paddle with W/S keys, right paddle with Up/Down arrows.');
    }

    printBase() {
        this.graphicEngine.clear();
        this.graphicEngine.setLeftPlayerScore(this.leftScore);
        this.graphicEngine.setLeftPlayerName(this.leftPlayerName);
        this.graphicEngine.setRightPlayerName(this.rightPlayerName);
        this.graphicEngine.setRightPlayerScore(this.rightScore);
        this.graphicEngine.drawMiddleLine();
        this.printControls();
    }

    printGame() {
        this.printBase();
        this.leftPaddle.print(this.graphicEngine);
        this.rightPaddle.print(this.graphicEngine);
        this.ball.print(this.graphicEngine);
    }

    checkShouldServeBall() {
        if (this.ball.speedX === 0 && !this.servingBall) {
            this.servingBall = true;
            setTimeout(() => this.serveBall(), 1000);
        }
    }

    mainLoop(callNumber: number = 0) {
        // We draw on each new animation frame, which represents current state of the game
        setTimeout(() => this.mainLoop(callNumber + 1), 1000 / GAME_FPS);
        // Clear the canvas every other frame to avoid flickering
        if (callNumber % FRAME_PRINT_FREQUENCY === 0) {
            this.graphicEngine.clear();
        }
        // Move the figures
        this.moveFigures();

        // Handle collisions and boundaries
        this.handleCollisions();
        this.handlePlayerScored();
        this.checkShouldServeBall();

        // Flush the message queue every other frame to avoid flickering
        if (callNumber % FRAME_PRINT_FREQUENCY === 0) {
            // Draw the figures and base of canvas
            this.printGame();
            this.graphicEngine.flush();
        }
    }
}

export class Local1PlayerGame extends Local2PlayerGame {


    constructor(graphicEngine: GraphicEngine, leftPlayerName: string) {
        super(graphicEngine, leftPlayerName);
        this.rightPlayerName = 'Computer';
    }

    addKeyDownUpListeners() {
        window.addEventListener('keydown', ({key}) => {
            switch (key) {
                case 'ArrowUp': this.leftPaddle.speedY = -effectiveStepSize(PADDLE_STEP_SIZE); break;
                case 'ArrowDown': this.leftPaddle.speedY = effectiveStepSize(PADDLE_STEP_SIZE); break;
            }
        });
        window.addEventListener('keyup', ({key}) => {
            if (key === 'ArrowUp' || key === 'ArrowDown') {
                this.leftPaddle.speedY = 0;
            }
        });
    }

    makeAIMove() {
        // Move the right paddle towards the ball
        const ballCenterY = this.ball.y + this.ball.height / 2;
        const paddleCenterY = this.rightPaddle.y + this.rightPaddle.height / 2;
        if (ballCenterY > paddleCenterY) {
            this.rightPaddle.speedY = effectiveStepSize(PADDLE_STEP_SIZE);
        }
        else if (ballCenterY < paddleCenterY) {
            this.rightPaddle.speedY = -effectiveStepSize(PADDLE_STEP_SIZE);
        }
        else {
            this.rightPaddle.speedY = 0;
        }
    }

    moveFigures() {
        this.makeAIMove();
        super.moveFigures();
    }

    printControls() {
        this.graphicEngine.printControls('Move left paddle with Up/Down arrows.');
    }
}

