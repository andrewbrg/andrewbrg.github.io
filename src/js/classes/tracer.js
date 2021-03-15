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
        this._canvasDrawTimeMs = 0;

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
            return this._engine._depth;
        }
        this._engine._depth = v;
    }

    shadowRays(v) {
        if ('undefined' === typeof v) {
            return this._engine._shadowRayCount;
        }
        this._engine._shadowRayCount = v;
    }

    resScale(v) {
        if ('undefined' === typeof v) {
            return this._engine._resolutionScale;
        }
        this._engine._resolutionScale = v;
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

    canvasDrawTimeMs() {
        return this._canvasDrawTimeMs;
    }

    framesRendered() {
        return this._engine._frameCount;
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

    isPlaying() {
        return this._isPlaying;
    }

    _tick() {
        const fStartTime = new Date();
        let canvas = this._engine.renderCanvas(
            this._camera,
            this._scene,
            this._width,
            this._height
        );
        this._frameTimeMs = (new Date() - fStartTime);

        const cStartTime = new Date();
        this._canvas.parentNode.replaceChild(canvas, this._canvas);
        this._canvas = canvas;
        this._canvasDrawTimeMs = (new Date() - cStartTime);

        this._fps = (1000 / this._frameTimeMs).toFixed(0);

        if (this._isPlaying) {
            window.requestAnimationFrame(this._tick.bind(this));
        }
    }
}