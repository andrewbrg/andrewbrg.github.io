import Kernels from './kernels';

const {Input} = require('gpu.js');

export default class Engine {
    constructor(depth, shadowRayCount = 6) {
        this._depth = depth;
        this._resolutionScale = 1;
        this._shadowRayCount = shadowRayCount;

        this._fps = 0;
        this._frameTimeMs = 0;
        this._frameCount = 0;

        window.addEventListener('rt:scene:updated', () => {
            this._prevFrame = null;
        }, false);

        window.addEventListener('rt:camera:updated', () => {
            this._rays = null;
        }, false);
    }

    renderCanvas(camera, scene, width, height) {
        const fStartTime = new Date();
        const sceneArr = scene.toArray();
        const objsCount = sceneArr[0].length;
        const objs = this._flatten(sceneArr[0], 30);

        const lightsCount = sceneArr[1].length;
        const lights = this._flatten(sceneArr[1], 15);

        if (!this._rays) {
            this._rays = camera.generateRays(width * this._resolutionScale, height * this._resolutionScale);
        }

        const size = this._rays.output;
        const rgb = Kernels.rgb(size);
        const lerp = Kernels.lerp(size);
        const shader = Kernels.shader(size, objsCount, lightsCount);

        this._currFrame = shader(
            camera.point,
            this._rays,
            objs,
            lights,
            this._depth,
            this._shadowRayCount,
            this._frameCount
        );

        if (null !== this._prevFrame) {
            this._lerpedFrame = lerp(this._prevFrame, this._currFrame);
            this._currFrame.delete()
            rgb(this._lerpedFrame);
            this._prevFrame.delete();
            this._prevFrame = this._lerpedFrame.clone();
            this._lerpedFrame.delete();
        } else {
            rgb(this._currFrame);
            this._prevFrame = this._currFrame.clone();
        }

        this._frameCount++;
        this._frameTimeMs = (new Date() - fStartTime);
        this._fps = (1000 / this._frameTimeMs).toFixed(0);

        return rgb.canvas;
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