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

        this._initCamera();
    }

    _initCamera() {
        document.addEventListener('keydown', e => {
            console.log(e.code)
            // do something

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
                default:
                    break;
            }
        });
    }

    tick() {
        window.setInterval(() => {
            let rays = this._camera.generateRays(this._width, this._height);
            let colors = this._engine.renderFrame(this._camera, this._scene, rays);

            colors = colors.toArray();
            let data = this._cData.data;

            for (let j = 0; j < colors.length; j++) {
                for (let i = 0; i < colors[j].length; i++) {
                    let s = 4 * i * this._width + 4 * j;
                    let x = colors[i][j];
                    data[s] = x[0];
                    data[s + 1] = x[1];
                    data[s + 2] = x[2];
                    data[s + 3] = 255;
                }
            }

            this._cContext.putImageData(this._cData, 0, 0);
        }, 200);
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