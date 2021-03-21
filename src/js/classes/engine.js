import Gpu from './gpu';
import Kernels from './kernels';

const {Input} = require('gpu.js');

export default class Engine {
    constructor(canvas, depth, shadowRayCount = 6, resolutionScale = 1) {
        this._depth = depth;
        this._resolutionScale = resolutionScale;
        this._shadowRayCount = shadowRayCount;

        this._frameTimeMs = 0;
        this._frameCount = 0;
        this._frameBuffer = [];

        this._fps = 0;
        this._textures = [];
        this._texturesLoaded = false;

        Gpu.canvas(canvas);

        window.addEventListener('rt:scene:updated', this._clearFrameBuffer.bind(this), false);
        window.addEventListener('rt:engine:updated', this._clearFrameBuffer.bind(this), false);
        window.addEventListener('rt:camera:updated', () => {
            this._clearFrameBuffer();
            this._texturesLoaded = false;
        }, false);
    }

    async loadTextures(scene) {
        this._texturesLoaded = false;

        let textures = [];
        textures.push(this._loadTexture('blue-noise.jpg'));

        scene.toArray()[0].forEach((o) => {
            if (null !== o[10]) {
                textures.push(this._loadTexture(o[10]));
            }
        });

        this._textures = await Promise.all(textures);
        this._texturesLoaded = true;
    }

    async renderCanvas(camera, scene, width, height) {
        const sTimestamp = performance.now();

        if (!this._texturesLoaded) {
            await this.loadTextures(scene);
        }

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
            this._textures,
            this._depth,
            this._shadowRayCount
        );

        if (this._frameBuffer.length) {
            this._nextFrame = interpolateFrames(this._frameBuffer[0], this._currFrame);
            rgb(this._nextFrame);

            this._frameBuffer[0].delete();
            this._frameBuffer[0] = this._nextFrame.clone();
            this._nextFrame.delete();
        } else {
            this._frameBuffer[0] = this._currFrame.clone();
            rgb(this._currFrame);
        }

        this._frameCount++;
        this._frameTimeMs = (performance.now() - sTimestamp);
        this._fps = (1 / (this._frameTimeMs / 1000)).toFixed(0);
        this._frameTimeMs = this._frameTimeMs.toFixed(0);
    }

    _clearFrameBuffer() {
        this._frameBuffer.forEach((i) => {
            i.delete();
        });
        this._frameBuffer = [];
    }

    _loadTexture(path) {
        return new Promise((resolve, reject) => {
            const i = document.createElement('img');
            i.src = `assets/img/${path}`;
            i.onload = () => {
                resolve(i);
            };
            i.onerror = () => {
                reject(i);
            };
        });
    }

    _flatten(objects, size) {
        return new Input(objects.flat(), [size, objects.length]);
    }
}