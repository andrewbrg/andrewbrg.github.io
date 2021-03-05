export default class Tracer {
    constructor(canvas, depth = 2) {
        this._canvas = canvas;

        this._width = canvas.offsetWidth;
        this._height = canvas.offsetHeight;

        this._camera;
        this._depth = depth;

        this._cContext = this._canvas.getContext('2d');
        this._cData = this._cContext.getImageData(0, 0, this._width, this._height);

        this._isPlaying = false;
        this._fps = 0;
    }

    tick() {
        let rays = this._camera.generateRays(50, 4);
        console.log(rays);
    }

    camera(v) {
        if ('undefined' === typeof v) {
            return this._camera;
        }
        this._camera = v;
    }

    depth(v) {
        if ('undefined' === typeof v) {
            return this._depth;
        }
        this._depth = v;
    }

    fov(v) {
        if ('undefined' === typeof v) {
            return this._camera.fov;
        }
        this._camera.fov = v;
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