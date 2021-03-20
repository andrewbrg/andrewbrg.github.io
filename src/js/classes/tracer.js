import Engine from './engine';

export default class Tracer {
    constructor(canvas, depth = 1) {
        this._canvas = canvas;
        this._canvasBoundingRect = this._canvas.getBoundingClientRect();

        this._width = canvas.offsetWidth;
        this._height = canvas.offsetHeight;

        this._halfW = this._width / 2;
        this._halfH = this._height / 2;

        this._engine = new Engine(canvas, depth);
        this._isPlaying = false;

        this._initMovement();
    }

    _initMovement() {
        document.addEventListener('keydown', e => {
            switch (e.code) {
                case 'KeyW':
                    this._camera.move('forward')
                    break;
                case 'KeyS':
                    this._camera.move('backward')
                    break;
                case 'KeyA':
                    this._camera.move('left')
                    break;
                case 'KeyD':
                    this._camera.move('right')
                    break;
            }
        }, false);


        let prevPosition = [0, 0];
        this._canvas.addEventListener('mouseup', () => {
            prevPosition = [0, 0];
        }, false);

        this._canvas.addEventListener('mouseleave', () => {
            prevPosition = [0, 0];
        }, false);

        this._canvas.addEventListener('mousedown', (evt) => {
            prevPosition = [
                ((evt.clientX - this._canvasBoundingRect.left) - this._halfW) / this._halfW,
                ((evt.clientY - this._canvasBoundingRect.top) - this._halfH) / this._halfH
            ];
        }, false);

        this._canvas.addEventListener('mousemove', (evt) => {
            if ((prevPosition[0] === 0 && prevPosition[1] === 0) || !this._isPlaying) {
                return;
            }

            const x = ((evt.clientX - this._canvasBoundingRect.left) - this._halfW) / this._halfW;
            const y = ((evt.clientY - this._canvasBoundingRect.top) - this._halfH) / this._halfH;

            this.camera().turn(prevPosition[0] - x, prevPosition[1] - y);
            prevPosition = [x, y];
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
        window.dispatchEvent(new Event('rt:engine:updated'));
    }

    shadowRays(v) {
        if ('undefined' === typeof v) {
            return this._engine._shadowRayCount;
        }
        this._engine._shadowRayCount = v;
        window.dispatchEvent(new Event('rt:engine:updated'));
    }

    resScale(v) {
        if ('undefined' === typeof v) {
            return this._engine._resolutionScale;
        }
        this._engine._resolutionScale = v;
        window.dispatchEvent(new Event('rt:engine:updated'));
    }

    fov(v) {
        if ('undefined' === typeof v) {
            return this._camera.fov;
        }
        this._camera.fov = v;
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
        this._engine.renderCanvas(
            this._camera,
            this._scene,
            this._width,
            this._height
        );

        if (this._isPlaying) {
            window.requestAnimationFrame(this._tick.bind(this));
        }
    }
}