import { GraphicEngine } from "./graphicEngine";

export class Ball {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(xCenter: number, yCenter: number, size: number) {
        this.x = xCenter - size / 2;
        this.y = yCenter - size / 2;
        this.width = size;
        this.height = size;
    }

    draw(graphicEngine: GraphicEngine) {
        const {x, y, width, height} = graphicEngine.relativeToAbsolute(this);
        graphicEngine.fillRect(x, y, width, height);
    }
}