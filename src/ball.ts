import { Figure } from "./figure";
import { GraphicEngine } from "./graphicEngine";

export class Ball extends Figure {
    x: number;
    y: number;
    width: number;
    height: number;
    speedX: number;
    speedY: number;

    constructor(xCenter: number, yCenter: number, size: number, speedX: number, speedY: number) {
        super(xCenter - size / 2, yCenter - size / 2, size, size, speedX, speedY);
        this.x = xCenter - size / 2;
        this.y = yCenter - size / 2;
        this.width = size;
        this.height = size;
        this.speedX = speedX;
        this.speedY = speedY;
    }

    print(graphicEngine: GraphicEngine) {
        const {x, y, width, height} = graphicEngine.relativeToAbsolute(this);
        graphicEngine.fillRect(x, y, width, height);
    }

    bounceOnFloorOrCeiling() {
        this.speedY = -this.speedY;
    }

    bounceOnPaddle() {
        this.speedX = -this.speedX;
    }
}