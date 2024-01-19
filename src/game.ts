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
const PADDLE_WIDTH = 0.02;
const PADDLE_HEIGHT = 0.25;
const PADDLE_STEP_SIZE = 0.025;
const GAME_FPS = 30;

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

    constructor(graphicEngine: GraphicEngine) {
        this.graphicEngine = graphicEngine;
        this.graphicEngine.setCanvasStyle(CANVAS_STYLE);
        this.leftPaddle = this.resetLeftPaddle();
        this.rightPaddle = this.resetRightPaddle();
        this.leftScore = 0;
        this.rightScore = 0;
        this.ball = this.resetBall();
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
                this.ball.speedX = effectiveStepSize(-0.01);
                // Speed y is a random number between -0.01 and 0.01
                this.ball.speedY = effectiveStepSize(Math.random() * 0.02 - 0.01);
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

    printBase() {
        this.graphicEngine.clear();
        this.graphicEngine.drawMiddleLine();
    }

    moveFigures() {
        this.leftPaddle.move();
        this.rightPaddle.move();
        this.ball.move();
    }

    handleCollisions() {
        if (this.ball.intersectsWith(this.leftPaddle) || this.ball.intersectsWith(this.rightPaddle)) {
            this.ball.bounceOnPaddle();
        }
        if (this.ball.y <= 0 || this.ball.y + this.ball.height >= 1) {
            this.ball.bounceOnFloorOrCeiling();
            this.ball.y = Math.max(0, Math.min(1 - this.ball.height, this.ball.y));
        }
        // Keep paddles inside the canvas
        this.leftPaddle.y = Math.max(0, Math.min(1 - this.leftPaddle.height, this.leftPaddle.y));
        this.rightPaddle.y = Math.max(0, Math.min(1 - this.rightPaddle.height, this.rightPaddle.y));
    }

    handlePlayerScored() {
        if (this.ball.x <= 0) {
            this.rightScore++;
            this.resetFigures();
        }
        if (this.ball.x + this.ball.width >= 1) {
            this.leftScore++;
            this.resetFigures();
        }
        // Update the score
        this.graphicEngine.setLeftPlayerScore(this.leftScore);
        this.graphicEngine.setRightPlayerScore(this.rightScore);
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
        if (callNumber % 2 === 0) {
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
        if (callNumber % 2 === 0) {
            this.graphicEngine.flush();
        }
    }
}