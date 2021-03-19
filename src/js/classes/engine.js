import Gpu from './gpu';
import Kernels from './kernels';

const {Input} = require('gpu.js');

export default class Engine {
    constructor(canvas, depth, shadowRayCount = 12) {
        Gpu.canvas(canvas);

        this._depth = depth;
        this._resolutionScale = 1;
        this._shadowRayCount = shadowRayCount;

        this._fps = 0;
        this._frameTimeMs = 0;
        this._frameCount = 0;

        this._prevFrame = null;

        window.addEventListener('rt:scene:updated', this._clearPrevFrame.bind(this), false);
        window.addEventListener('rt:engine:updated', this._clearPrevFrame.bind(this), false);
        window.addEventListener('rt:camera:updated', this._clearPrevFrame.bind(this), false);
    }

    renderCanvas(camera, scene, width, height) {
        const sTimestamp = performance.now();

        const sceneArr = scene.toArray();
        const objsCount = sceneArr[0].length;
        const objs = this._flatten(sceneArr[0], 30);

        const lightsCount = sceneArr[1].length;
        const lights = this._flatten(sceneArr[1], 15);

        const rays = camera.generateRays(width * this._resolutionScale, height * this._resolutionScale);

        const shader = Kernels.shader(rays.output, objsCount, lightsCount);
        const interpolateFrames = Kernels.interpolateFrames(rays.output);
        const rgb = Kernels.rgb(rays.output);

        this._currFrame = shader(
            camera.point,
            rays,
            objs,
            lights,
            this._depth,
            this._shadowRayCount,
            this._frameCount
        );

        if (this._prevFrame) {
            this._nextFrame = interpolateFrames(this._prevFrame, this._currFrame);
            rgb(this._nextFrame);

            this._prevFrame.delete();
            this._prevFrame = this._nextFrame.clone();
            this._nextFrame.delete();
        } else {
            rgb(this._currFrame);
            this._prevFrame = this._currFrame.clone();
        }

        this._frameCount++;
        this._frameTimeMs = performance.now() - sTimestamp;
        this._fps = (1000 / this._frameTimeMs).toFixed(0);
    }

    _clearPrevFrame() {
        if (this._prevFrame) {
            this._prevFrame.delete();
            this._prevFrame = null;
        }
    }

    _getTexture(name) {
        let i = document.createElement('img');
        i.src = `assets/img/${name}`;
        return i;
    }

    _flatten(objects, size) {
        return new Input(objects.flat(), [size, objects.length]);
    }
}