import { Ball } from "./ball";
import { GraphicEngine } from "./graphicEngine";
import { Paddle } from "./paddle";

const CANVAS_STYLE: Partial<CSSStyleDeclaration> = {
    border: '1px solid',
    borderColor: '--vscode-editor-foreground',
    width: '100%',
    height: '100%',
    margin: '0',
    padding: '0',
};

const BALL_SIZE = 0.01;
const BALL_SPEED_X = 0.015;
const BALL_SPEED_Y = 0.01;
const PADDLE_WIDTH = 0.02;
const PADDLE_HEIGHT = 0.2;
const PADDLE_STEP_SIZE = 0.025;
const GAME_FPS = 60;  // Frames per second, in terms of computation
const FRAME_PRINT_FREQUENCY = 2;  // Print every FRAME_PRINT_FREQUENCY frames, e.g. 2 means 30 FPS for GAME_FPS = 60

function effectiveStepSize(stepSize: number) {
    return stepSize * (60 / GAME_FPS);
}

export class Game {
    leftPaddle: Paddle;
    rightPaddle: Paddle;
    ball: Ball;
    graphicEngine: GraphicEngine;
    leftScore: number;
    rightScore: number;
    leftScoredLast: boolean;

    constructor(graphicEngine: GraphicEngine) {
        this.graphicEngine = graphicEngine;
        this.graphicEngine.setCanvasStyle(CANVAS_STYLE);
        this.leftPaddle = this.resetLeftPaddle();
        this.rightPaddle = this.resetRightPaddle();
        this.leftScore = 0;
        this.rightScore = 0;
        this.ball = this.resetBall();
        this.leftScoredLast = false;
        // Add our listeners to handle changes in the game state
        this.addKeyDownUpListeners();
    }

    addKeyDownUpListeners() {
        this.graphicEngine.addKeyDownListener(({key}) => {
            if (key === 'ArrowUp') {
                this.rightPaddle.speedY = -effectiveStepSize(PADDLE_STEP_SIZE);
            } else if (key === 'ArrowDown') {
                this.rightPaddle.speedY = effectiveStepSize(PADDLE_STEP_SIZE);
            }
            else if (key === 'w') {
                this.leftPaddle.speedY = -effectiveStepSize(PADDLE_STEP_SIZE);
            }
            else if (key === 's') {
                this.leftPaddle.speedY = effectiveStepSize(PADDLE_STEP_SIZE);
            }
            else if (key === 'Enter') {
                // If the left player scored last, the ball goes to the right, and vice versa
                const speedXsign = this.leftScoredLast ? 1 : -1;
                this.ball.speedX = effectiveStepSize(BALL_SPEED_X) * speedXsign;
                // Speed y is a random number
                this.ball.speedY = effectiveStepSize(BALL_SPEED_Y * (Math.random() * 2 - 1));
            }
        });
        this.graphicEngine.addKeyUpListener(({key}) => {
            if (key === 'ArrowUp' || key === 'ArrowDown') {
                this.rightPaddle.speedY = 0;
            }
            else if (key === 'w' || key === 's') {
                this.leftPaddle.speedY = 0;
            }
        });
    }

    resetBall() {
        this.ball = new Ball(0.5, 0.5, BALL_SIZE, 0.0, 0.0);
        return this.ball;
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
        this.ball.handleBounceOnPaddle(this.leftPaddle);
        this.ball.handleBounceOnPaddle(this.rightPaddle);
        this.ball.handleBounceOnFloorOrCeiling();
    }

    handlePlayerScored() {
        // If the ball is outside the canvas, the player scored
        if (this.ball.x <= 0) {
            this.rightScore++;
            this.graphicEngine.setRightPlayerScore(this.rightScore);
            this.resetFigures();
            this.leftScoredLast = false;
        }
        else if (this.ball.x + this.ball.width >= 1) {
            this.leftScore++;
            this.graphicEngine.setLeftPlayerScore(this.leftScore);
            this.resetFigures();
            this.leftScoredLast = true;
        }
    }

    printBase() {
        this.graphicEngine.clear();
        this.graphicEngine.drawMiddleLine();
    }

    printFigures() {
        this.printBase();
        this.leftPaddle.print(this.graphicEngine);
        this.rightPaddle.print(this.graphicEngine);
        this.ball.print(this.graphicEngine);
    }

    mainLoop(callNumber: number = 0) {
        // We draw on each new animation frame, which represents current state of the game
        setTimeout(() => this.mainLoop(), 1000 / GAME_FPS);
        // Clear the canvas every other frame to avoid flickering
        if (callNumber % FRAME_PRINT_FREQUENCY === 0) {
            this.graphicEngine.clear();
        }
        // Move the figures
        this.moveFigures();

        // Handle collisions and boundaries
        this.handleCollisions();
        this.handlePlayerScored();

        // Draw the figures and base of canvas
        this.printFigures();

        // Flush the message queue every other frame to avoid flickering
        if (callNumber % FRAME_PRINT_FREQUENCY === 0) {
            this.graphicEngine.flush();
        }
    }
}