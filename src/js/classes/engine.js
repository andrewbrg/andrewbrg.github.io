import Gpu from './gpu';
import Kernels from './kernels';

const {Input} = require('gpu.js');

export default class Engine {
    constructor(canvas, depth, shadowRayCount = 4, superSampling = 1.4) {
        this._depth = depth;
        this._superSampling = superSampling;
        this._shadowRayCount = shadowRayCount;

        this._frameTimeMs = 0;
        this._frameCount = 0;
        this._frameToRender = null;

        this._fps = 0;

        Gpu.canvas(canvas);

        window.addEventListener('rt:camera:updated', () => {
            this._frameCount = 0;
            this._clearBuffer = true;
        }, false);
        window.addEventListener('rt:engine:updated', () => {
            this._frameCount = 0;
            this._clearBuffer = true;
        }, false);
        window.addEventListener('rt:scene:updated', () => {
            this._frameCount = 0;
            this._clearBuffer = true;
        }, false);
    }

    renderCanvas(camera, scene, width, height) {
        if (this._clearBuffer) {
            this._clearBuffer = false;
            this._clearFrameBuffer();
        }

        const sTimestamp = performance.now();

        const sceneArr = scene.toArray();
        const objsCount = sceneArr[0].length;
        const objs = this._flatten(sceneArr[0], 30);

        const lightsCount = sceneArr[1].length;
        const lights = this._flatten(sceneArr[1], 15);

        const rays = camera.generateRays(width * this._superSampling, height * this._superSampling);

        const traceFrame = Kernels.traceFrame(rays.output, objsCount, lightsCount);
        const interpolateFrames = Kernels.interpolateFrames(rays.output);
        const drawFrame = Kernels.drawFrame(rays.output);

        this._frame = traceFrame(
            camera.point,
            rays,
            objs,
            lights,
            this._depth,
            this._shadowRayCount
        );

        if (this._frameToRender) {
            this._temp = this._frameToRender;
            this._frameToRender = interpolateFrames(
                this._temp,
                this._frame,
                Math.max(0.02, 1 / (this._frameCount + 1))
            );
            this._temp.delete();
        } else {
            this._frameToRender = this._frame;
        }

        drawFrame(this._frameToRender);
        this._frame.delete();

        this._frameCount++;
        this._frameTimeMs = (performance.now() - sTimestamp);
        this._fps = (1 / (this._frameTimeMs / 1000)).toFixed(0);
        this._frameTimeMs = this._frameTimeMs.toFixed(0);
    }

    _clearFrameBuffer() {
        if (this._frameToRender) {
            this._frameToRender.delete();
            delete this._frameToRender;
        }
    }

    _flatten(objects, size) {
        return new Input(objects.flat(), [size, objects.length]);
    }
}