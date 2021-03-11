import Engine from './engine';

export default class Tracer {
    constructor(canvas, depth = 1) {
        this._canvas = canvas;

        this._width = canvas.offsetWidth;
        this._height = canvas.offsetHeight;

        this._engine = new Engine(depth);

        this._isPlaying = false;
        this._fps = 0;
        this._frameTimeMs = 0;

        this._initCamera();
    }

    _initCamera() {
        document.addEventListener('keydown', e => {
            switch (e.code) {
                case 'ArrowUp':
                    this._camera.point[2] -= this._camera._movementSpeed;
                    break;
                case 'ArrowDown':
                    this._camera.point[2] += this._camera._movementSpeed;
                    break;
                case 'ArrowLeft':
                    this._camera.point[0] -= this._camera._movementSpeed;
                    break;
                case 'ArrowRight':
                    this._camera.point[0] += this._camera._movementSpeed;
                    break;
            }
        });
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

    frameTimeMs() {
        return this._frameTimeMs;
    }

    fps() {
        return this._fps;
    }

    play() {
        if (!this._isPlaying) {
            this._isPlaying = true;
            this._tick();
        }
    }

    pause() {
        this._isPlaying = false;
    }

    _tick() {
        const startTime = new Date();
        let result = this._engine.renderFrame(
            this._camera,
            this._scene,
            this._width,
            this._height
        );

        this._canvas.parentNode.replaceChild(result.canvas, this._canvas);
        this._canvas = result.canvas;

        this._frameTimeMs = (new Date() - startTime);
        this._fps = (1000 / this._frameTimeMs).toFixed(2);

        if (this._isPlaying) {
            window.setTimeout(() => {
                this._tick();
            }, 100);
        }
    }
}