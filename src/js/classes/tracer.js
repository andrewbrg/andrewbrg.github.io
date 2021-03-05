export default class Tracer {
    constructor(canvas, traceDepth = 2) {
        this._canvas = canvas;

        this._width = canvas.offsetWidth;
        this._height = canvas.offsetHeight;
        this._traceDepth = traceDepth;

        this._cContext = this._canvas.getContext('2d');
        this._cData = this._cContext.getImageData(0, 0, this._width, this._height);

        this._isPlaying = false;
        this._fps = 0;
    }

    camera(camera) {
        if ('undefined' === typeof camera) {
            return this._camera;
        }
        this._camera = camera;
    }

    tick() {
        let rays = this._camera.generateRays(50, 40);
        console.log(rays);
    }

    traceDepth(value) {
        if ('undefined' === typeof value) {
            return this._traceDepth;
        }
        this._traceDepth = value;
    }

    fov(value) {
        if ('undefined' === typeof value) {
            return this._camera.fov;
        }
        this._camera.fov = value;
    }

    fps() {
        return this._fps;
    }

    play() {
        if (!this._isPlaying) {
            this._isPlaying = true;
            this.tick();
        }
    }

    stop() {
        this._isPlaying = false;
    }
}