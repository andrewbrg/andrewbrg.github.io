import Engine from './engine';

export default class Tracer {
    constructor(canvas, depth = 2) {
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
                case 'KeyE':
                    this._camera.move('up')
                    break;
                case 'KeyQ':
                    this._camera.move('down')
                    break;
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
            this._canvas.classList.remove('grabbing');
            prevPosition = [0, 0];
        }, false);

        this._canvas.addEventListener('mouseleave', () => {
            this._canvas.classList.remove('grabbing');
            prevPosition = [0, 0];
        }, false);

        this._canvas.addEventListener('mousedown', (evt) => {
            this._canvas.classList.add('grabbing');
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
        window.dispatchEvent(new CustomEvent('rt:camera:updated', {'detail': this._camera}));
    }

    scene(v) {
        if ('undefined' === typeof v) {
            return this._scene;
        }
        this._scene = v;
        window.dispatchEvent(new CustomEvent('rt:scene:updated', {'detail': this._scene}));
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

    superSampling(v) {
        if ('undefined' === typeof v) {
            return this._engine._superSampling;
        }

        if (this._isPlaying) {
            this.pause();
            this._engine._superSampling = v;
            setTimeout(this.play.bind(this), 1500);
        } else {
            this._engine._superSampling = v;
        }

        window.dispatchEvent(new CustomEvent('rt:engine:updated', {'detail': this._engine}));
    }

    fov(v) {
        if ('undefined' === typeof v) {
            return this._camera.fov;
        }
        this._camera.fov = v;
        window.dispatchEvent(new CustomEvent('rt:camera:updated', {'detail': this._camera}));
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
            setTimeout(() => {
                window.requestAnimationFrame(this._tick.bind(this));
            }, 1000 / 45);
        }
    }
}