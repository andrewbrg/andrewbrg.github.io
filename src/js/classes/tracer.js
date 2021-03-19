import Engine from './engine';

export default class Tracer {
    constructor(canvas, depth = 2) {
        this._canvas = canvas;

        this._width = canvas.offsetWidth;
        this._height = canvas.offsetHeight;

        this._engine = new Engine(depth);
        this._isPlaying = false;

        this._initMovement();
    }

    _initMovement() {
        document.addEventListener('keydown', e => {
            switch (e.code) {
                case 'ArrowUp':
                    this._camera.point[2] -= this._camera._movementSpeed;
                    window.dispatchEvent(new Event('rt:scene:updated'));
                    window.dispatchEvent(new Event('rt:camera:updated'));
                    break;
                case 'ArrowDown':
                    this._camera.point[2] += this._camera._movementSpeed;
                    window.dispatchEvent(new Event('rt:scene:updated'));
                    window.dispatchEvent(new Event('rt:camera:updated'));
                    break;
                case 'ArrowLeft':
                    this._camera.point[0] -= this._camera._movementSpeed;
                    window.dispatchEvent(new Event('rt:scene:updated'));
                    window.dispatchEvent(new Event('rt:camera:updated'));
                    break;
                case 'ArrowRight':
                    this._camera.point[0] += this._camera._movementSpeed;
                    window.dispatchEvent(new Event('rt:scene:updated'));
                    window.dispatchEvent(new Event('rt:camera:updated'));
                    break;
            }
        }, false);

        let canLook = false;
        this._canvas.addEventListener('mousedown', () => {
            canLook = true;
        }, false);

        this._canvas.addEventListener('mouseup', () => {
            canLook = false;
        }, false);

        this._canvas.addEventListener('mousemove', (evt) => {
            if (!canLook || !this._isPlaying) {
                return;
            }

            const rect = this._canvas.getBoundingClientRect();
            const pos = {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        }, false);
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
        window.dispatchEvent(new Event('rt:scene:updated'));
    }

    depth(v) {
        if ('undefined' === typeof v) {
            return this._engine._depth;
        }
        this._engine._depth = v;
        window.dispatchEvent(new Event('rt:scene:updated'));
    }

    shadowRays(v) {
        if ('undefined' === typeof v) {
            return this._engine._shadowRayCount;
        }
        this._engine._shadowRayCount = v;
        window.dispatchEvent(new Event('rt:scene:updated'));
    }

    resScale(v) {
        if ('undefined' === typeof v) {
            return this._engine._resolutionScale;
        }
        this._engine._resolutionScale = v;
        window.dispatchEvent(new Event('rt:scene:updated'));
    }

    fov(v) {
        if ('undefined' === typeof v) {
            return this._camera.fov;
        }
        this._camera.fov = v;
        window.dispatchEvent(new Event('rt:scene:updated'));
        window.dispatchEvent(new Event('rt:camera:updated'));
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
        const canvas = this._engine.renderCanvas(
            this._camera,
            this._scene,
            this._width,
            this._height
        );

        this._canvas.getContext('2d').drawImage(canvas, 0, 0);


        if (this._isPlaying) {
            window.requestAnimationFrame(this._tick.bind(this));
        }
    }
}