import Engine from './engine';

export default class Tracer {
    constructor(canvas, depth = 1) {
        this._canvas = canvas;

        this._width = canvas.offsetWidth;
        this._height = canvas.offsetHeight;

        this._engine = new Engine(depth);
        this._isPlaying = false;

        this._initCamera();
    }

    _initCamera() {
        document.addEventListener('keydown', e => {
            switch (e.code) {
                case 'ArrowUp':
                    this._camera.point[2] -= this._camera._movementSpeed;
                    this._notifyChanges();
                    break;
                case 'ArrowDown':
                    this._camera.point[2] += this._camera._movementSpeed;
                    this._notifyChanges();
                    break;
                case 'ArrowLeft':
                    this._camera.point[0] -= this._camera._movementSpeed;
                    this._notifyChanges();
                    break;
                case 'ArrowRight':
                    this._camera.point[0] += this._camera._movementSpeed;
                    this._notifyChanges();
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
        this._notifyChanges();
    }

    depth(v) {
        if ('undefined' === typeof v) {
            return this._engine._depth;
        }
        this._engine._depth = v;
        this._notifyChanges();
    }

    shadowRays(v) {
        if ('undefined' === typeof v) {
            return this._engine._shadowRayCount;
        }
        this._engine._shadowRayCount = v;
        this._notifyChanges();
    }

    resScale(v) {
        if ('undefined' === typeof v) {
            return this._engine._resolutionScale;
        }
        this._engine._resolutionScale = v;
        this._notifyChanges();
    }

    fov(v) {
        if ('undefined' === typeof v) {
            return this._camera.fov;
        }
        this._camera.fov = v;
        this._notifyChanges();
    }

    frameTimeMs() {
        return this._engine._frameTimeMs;
    }

    framesRendered() {
        return this._engine._frameCount;
    }

    fps() {
        return this._engine._fps;
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
        let canvas = this._engine.renderCanvas(
            this._camera,
            this._scene,
            this._width,
            this._height
        );

        this._canvas.parentNode.replaceChild(canvas, this._canvas);
        this._canvas = canvas;

        if (this._isPlaying) {
            window.requestAnimationFrame(this._tick.bind(this));
        }
    }

    _notifyChanges(){
        window.dispatchEvent(new Event('tracer:changed'));
    }
}