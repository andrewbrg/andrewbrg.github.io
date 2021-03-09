import Engine from './engine';

export default class Tracer {
    constructor(canvas, depth = 1) {
        this._canvas = canvas;

        this._width = canvas.offsetWidth;
        this._height = canvas.offsetHeight;

        this._engine = new Engine(depth);

        this._cContext = this._canvas.getContext('2d');
        this._cData = this._cContext.getImageData(0, 0, this._width, this._height);

        this._isPlaying = false;
        this._fps = 0;
    }

    tick() {
        /*let rays = this._camera.generateRays(this._width, this._height);*/
        let rays = this._camera.generateRays(this._width, this._height);
        let colors = this._engine.renderFrame(this._camera, this._scene, rays);

        colors = colors.toArray();
        for (let x = 0; x < colors.length; x++) {
            for (let y = 0; y < colors[x].length; y++) {
                let index = (x * 4) + (y * 4 * this._width);

                this._cData.data[index] = (colors[x][y][0]);
                this._cData.data[index + 1] = (colors[x][y][1]);
                this._cData.data[index + 2] = (colors[x][y][2]);
                this._cData.data[index + 3] = 255;
            }
        }

        this._cContext.putImageData(this._cData, 0, 0);
    }

    camera(v) {
        if ('undefined' === typeof v) {
            return this._camera;
        }
        this._camera = v;
    }

    scene(v) {
        if ('undefined' === typeof v) {
            return this._scene;
        }
        this._scene = v;
    }

    depth(v) {
        if ('undefined' === typeof v) {
            return this._engine.depth;
        }
        this._engine.depth = v;
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