import { Figure } from './figure';
import { GraphicEngine } from './graphicEngine';
import { Paddle } from './paddle';

export class Ball extends Figure {
    x: number;
    y: number;
    width: number;
    height: number;
    speedX: number;
    speedY: number;
    speedIncrementRatio: number;
    maxSpeedIncrement: number;
    totalSpeedIncrement: number = 1;

    constructor(
        xCenter: number,
        yCenter: number,
        size: number,
        speedX: number,
        speedY: number,
        speedIncrementRatio: number,
        maxSpeedIncrement: number
    ) {
        super(xCenter - size / 2, yCenter - size / 2, size, size, speedX, speedY);
        this.x = xCenter - size / 2;
        this.y = yCenter - size / 2;
        this.width = size;
        this.height = size;
        this.speedX = speedX;
        this.speedY = speedY;
        this.speedIncrementRatio = speedIncrementRatio;
        this.maxSpeedIncrement = maxSpeedIncrement;
    }

    print(graphicEngine: GraphicEngine) {
        const {x, y, width, height} = graphicEngine.relativeToAbsolute(this);
        graphicEngine.fillRect(x, y, width, height);
    }

    // Handle the ball bouncing on the floor (y = 0) or the ceiling (y = 1)
    handleBounceOnFloorOrCeiling() {
        if (this.y <= 0 || this.y + this.height >= 1) {
            this.speedY = -this.speedY;
            this.y = Math.max(0, Math.min(1 - this.height, this.y));
        }   
    }

    handleBounceOnPaddle(paddle: Paddle) {
        if (!this.intersectsWith(paddle)) {
            return false;
        }
        // Compute the collision point, which is a number between 0 and 1
        const collisionPoint = (this.y + this.height / 2 - paddle.y) / paddle.height;

        this.speedX = -this.speedX;
        // Collision point is a number between 0 and 1
        // 0: the ball hit the top of the paddle: bounce up
        // 1: the ball hit the bottom of the paddle: bounce down

        // Compute angle of the bounce
        const angle = (collisionPoint - 0.5) * Math.PI / 2;

        // Compute new speed^
        const newTotalIncrement = Math.min(this.totalSpeedIncrement * this.speedIncrementRatio, this.maxSpeedIncrement);
        const speedIncrement = newTotalIncrement / this.totalSpeedIncrement;
        this.totalSpeedIncrement = newTotalIncrement;

        const speed = Math.sqrt(this.speedX ** 2 + this.speedY ** 2) * speedIncrement;
        this.speedX = speed * Math.cos(angle) * Math.sign(this.speedX);
        this.speedY = speed * Math.sin(angle);

        return true;
    }
}