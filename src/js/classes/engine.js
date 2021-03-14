import Kernels from './kernels';

const {Input} = require('gpu.js');

export default class Engine {
    constructor(depth, shadowRaysCount = 3) {
        this.resScale = 1;
        this.depth = depth;
        this.shadowRaysCount = shadowRaysCount;
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

        const shadedPixels = Kernels.shader(size, this.depth, objsCount, lightsCount, this.shadowRaysCount)(camera.point, rays, objs, lights);
        const result = Kernels.rgb(size);

        result(shadedPixels);
        return result.canvas;
    }

    _flatten(objects, size) {
        return new Input(objects.flat(), [size, objects.length]);
    }
}