import { GraphicEngine } from "./graphicEngine";

export abstract class Figure {
    x: number;
    y: number;
    width: number;
    height: number;
    speedX: number;
    speedY: number;

    constructor(x: number, y: number, width: number, height: number, speedX: number, speedY: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speedX = speedX;
        this.speedY = speedY;
    }

    intersectsWith(other: Figure) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }

    print(graphicEngine: GraphicEngine) {
        const {x, y, width, height} = graphicEngine.relativeToAbsolute(this);
        graphicEngine.fillRect(x, y, width, height);
    }

    move() {
        this.x += this.speedX;
        this.y += this.speedY;
    }
}