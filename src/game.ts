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

export class Game {
    leftPaddle: Paddle;
    rightPaddle: Paddle;
    ball: Ball;
    graphicEngine: GraphicEngine;

    constructor(graphicEngine: GraphicEngine) {
        this.graphicEngine = graphicEngine;
        this.graphicEngine.setCanvasStyle(CANVAS_STYLE);
        this.leftPaddle = new Paddle(0, 0.5, 0.05, 0.2, 0.01);
        this.rightPaddle = new Paddle(0.95, 0.5, 0.05, 0.2, 0.01);
        this.ball = new Ball(0.5, 0.5, 0.01);
    }

    drawBase() {
        this.graphicEngine.clear();
        this.graphicEngine.drawMiddleLine();
    }

    draw() {
        this.drawBase();
        this.leftPaddle.draw(this.graphicEngine);
        this.rightPaddle.draw(this.graphicEngine);
        this.ball.draw(this.graphicEngine);
    }

    mainLoop() {
        this.draw();
        // Add our listeners to handle changes in the game state
        this.graphicEngine.addKeyDownListener(({key}) => {
            console.log(key);
            if (key === 'ArrowUp') {
                this.leftPaddle.moveUp();
            } else if (key === 'ArrowDown') {
                this.leftPaddle.moveDown();
            }
        });
        // We call draw() on each new animation frame, which represents current state of the game
        this.graphicEngine.onNewAnimationFrame(() => {
            this.draw();
        });
    }
}