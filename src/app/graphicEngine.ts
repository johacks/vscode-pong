export class GraphicEngine {
    width: number;
    height: number;
    canvas: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    buffer: any[] = []; // Stores all drawing commands
    scoreLeftDisplay: HTMLSpanElement;
    scoreRightDisplay: HTMLSpanElement;
    leftNameDisplay: HTMLSpanElement;
    rightNameDisplay: HTMLSpanElement;
    gameIdDisplay: HTMLDivElement;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
        this.canvasContext = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.canvasContext.fillStyle = '--vscode-editor-foreground';
        this.canvasContext.strokeStyle = '--vscode-editor-foreground';
        this.canvasContext.globalAlpha = 1;
        this.scoreLeftDisplay = document.getElementById('left-score') as HTMLSpanElement;
        this.scoreRightDisplay = document.getElementById('right-score') as HTMLSpanElement;
        this.leftNameDisplay = document.getElementById('left-name') as HTMLSpanElement;
        this.rightNameDisplay = document.getElementById('right-name') as HTMLSpanElement;
        this.gameIdDisplay = document.getElementById('game-id') as HTMLDivElement;
        this.setCanvasDimensions(width, height);
    }
    
    setCanvasDimensions(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    relativeToAbsolute({x, y, width, height}: {x?: number, y?: number, width?: number, height?: number}) {
        return {
            x: x ? x * this.width : 0,
            y: y ? y * this.height : 0,
            width: width ? width * this.width : this.width,
            height: height ? height * this.height : this.height,
        };
    }

    fillRect(x: number, y: number, width: number, height: number) {
        this.buffer.push(
            () => {
                this.canvasContext.fillRect(x, y, width, height);
            }
        );
    }

    clearRect(x: number, y: number, width: number, height: number) {
        this.buffer.push(
            () => {
                this.canvasContext.clearRect(x, y, width, height);
            }
        );
    }

    drawMiddleLine() {
        const {x: xFrom, y: yFrom} = this.relativeToAbsolute({x: 0.5, y: 0});
        const {x: xTo, y: yTo} = this.relativeToAbsolute({x: 0.5, y: 1});
        const {height: segmentLength} = this.relativeToAbsolute({height: 0.01});
        const segments = [segmentLength, segmentLength];
        this.buffer.push(
            () => {
                this.canvasContext.beginPath();
                this.canvasContext.setLineDash(segments);
                this.canvasContext.moveTo(xFrom, yFrom);
                this.canvasContext.lineTo(xTo, yTo);
                this.canvasContext.stroke();
                this.canvasContext.closePath();
            }
        );
    }

    clear() {
        // Reset the canvas
        this.clearRect(0, 0, this.width, this.height);
    }

    setLeftPlayerScore(score: number) {
        this.buffer.push(
            () => {
                this.scoreLeftDisplay.textContent = score.toString();
            }
        );
    }

    setRightPlayerScore(score: number) {
        this.buffer.push(
            () => {
                this.scoreRightDisplay.textContent = score.toString();
            }
        );
    }

    setLeftPlayerName(name: string) {
        this.buffer.push(
            () => {
                this.leftNameDisplay.textContent = name;
            }
        );
    }

    setRightPlayerName(name: string) {
        this.buffer.push(
            () => {
                this.rightNameDisplay.textContent = name;
            }
        );
    }

    printGameId(gameId: string) {
        this.buffer.push(
            () => {
                this.gameIdDisplay.textContent = gameId;
            }
        );
    }

    // Flushes the command buffer
    flush() {
        for (const command of this.buffer) {
            command();
        }
        this.buffer = [];
    }
}

