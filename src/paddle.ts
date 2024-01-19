import { GraphicEngine } from "./graphicEngine";
import { Figure } from "./figure";

export class Paddle extends Figure {

    constructor(x: number, yCenter: number, width: number, height: number, speed: number) {
        super(x, yCenter - height / 2, width, height, 0, speed);
    }

    draw(graphicEngine: GraphicEngine) {
        const {x, y, width, height} = graphicEngine.relativeToAbsolute(this);
        graphicEngine.fillRect(x, y, width, height);
    }

}