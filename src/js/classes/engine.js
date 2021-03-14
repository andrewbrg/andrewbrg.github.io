import Kernels from './kernels';

const {Input} = require('gpu.js');

export default class Engine {
    constructor(depth, shadowRayCount = 4) {
        this.resScale = 1;
        this.depth = depth;
        this.shadowRayCount = shadowRayCount;
        this.frameCount = 0;

        this.bnImage = document.createElement('img');
        this.bnImage.src = '/assets/img/blue-noise.jpg';
    }

    renderCanvas(camera, scene, width, height) {
        const sceneArr = scene.toArray();
        const objsCount = sceneArr[0].length;
        const objs = this._flatten(sceneArr[0], 30);

        const lightsCount = sceneArr[1].length;
        const lights = this._flatten(sceneArr[1], 15);

        width = width * this.resScale;
        height = height * this.resScale;

        const rays = camera.generateRays(width, height);
        const size = rays.output;

        const shader = Kernels.shader(size, objsCount, lightsCount, this.bnImage);
        const rgb = Kernels.rgb(size);
        rgb(shader(camera.point, rays, objs, lights, this.depth, this.shadowRayCount, this.frameCount));

        this.frameCount++;
        return rgb.canvas;
    }

    _flatten(objects, size) {
        return new Input(objects.flat(), [size, objects.length]);
    }
}