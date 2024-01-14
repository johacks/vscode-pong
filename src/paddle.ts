import { GraphicEngine } from "./graphicEngine";
import { Figure } from "./figure";

export class Paddle extends Figure {
    stepSize: number;

    constructor(x: number, yCenter: number, width: number, height: number, stepSize: number) {
        super(x, yCenter - height / 2, width, height, 0, 0);
        this.stepSize = stepSize;
    }

    draw(graphicEngine: GraphicEngine) {
        const {x, y, width, height} = graphicEngine.relativeToAbsolute(this);
        graphicEngine.fillRect(x, y, width, height);
    }

    moveUp() {
        this.speedY = -this.stepSize;
        super.move();
    }

    moveDown() {
        this.speedY = this.stepSize;
        super.move();
    }
}