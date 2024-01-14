import { Ball } from "./ball";
import { GraphicEngine } from "./graphicEngine";
import { Paddle } from "./paddle";

const CANVAS_STYLE: Partial<CSSStyleDeclaration> = {
    border: '1px solid black',
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
        this.leftPaddle = new Paddle(0, 0.5, 0.05, 0.2);
        this.rightPaddle = new Paddle(0.95, 0.5, 0.05, 0.2);
        this.ball = new Ball(0.5, 0.5, 0.01, 0.01);
        this.draw();
    }

    draw() {
        this.graphicEngine.clear();
        this.leftPaddle.draw(this.graphicEngine);
        this.rightPaddle.draw(this.graphicEngine);
        this.ball.draw(this.graphicEngine);
    }
}