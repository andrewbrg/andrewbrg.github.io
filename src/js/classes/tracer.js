import Engine from './engine';

export default class Tracer {
    constructor(canvas, depth = 2) {
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
                    this._notifySceneUpdate();
                    this._notifyCameraUpdate();
                    break;
                case 'ArrowDown':
                    this._camera.point[2] += this._camera._movementSpeed;
                    this._notifySceneUpdate();
                    this._notifyCameraUpdate();
                    break;
                case 'ArrowLeft':
                    this._camera.point[0] -= this._camera._movementSpeed;
                    this._notifySceneUpdate();
                    this._notifyCameraUpdate();
                    break;
                case 'ArrowRight':
                    this._camera.point[0] += this._camera._movementSpeed;
                    this._notifySceneUpdate();
                    this._notifyCameraUpdate();
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
        this._notifySceneUpdate();
    }

    depth(v) {
        if ('undefined' === typeof v) {
            return this._engine._depth;
        }
        this._engine._depth = v;
        this._notifySceneUpdate();
    }

    shadowRays(v) {
        if ('undefined' === typeof v) {
            return this._engine._shadowRayCount;
        }
        this._engine._shadowRayCount = v;
        this._notifySceneUpdate();
    }

    resScale(v) {
        if ('undefined' === typeof v) {
            return this._engine._resolutionScale;
        }
        this._engine._resolutionScale = v;
        this._notifySceneUpdate();
    }

    fov(v) {
        if ('undefined' === typeof v) {
            return this._camera.fov;
        }
        this._camera.fov = v;
        this._notifySceneUpdate();
        this._notifyCameraUpdate();
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

        console.log(this._canvas.getContext('2d'))

        if (this._isPlaying) {
            window.requestAnimationFrame(this._tick.bind(this));
        }
    }

    _notifySceneUpdate() {
        window.dispatchEvent(new Event('rt:scene:updated'));
    }

    _notifyCameraUpdate() {
        window.dispatchEvent(new Event('rt:camera:updated'));
    }
}