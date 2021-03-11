import Kernels from './kernels';

const {Input} = require('gpu.js');

export default class Engine {
    constructor(depth) {
        this.depth = depth;
    }

    renderFrame(camera, scene, width, height) {
        const sceneArr = scene.toArray();
        const objsCount = sceneArr[0].length;
        const objs = this._flatten(sceneArr[0], 30);

        const lightsCount = sceneArr[1].length;
        const lights = this._flatten(sceneArr[1], 15);

        const rays = camera.generateRays(width, height);
        const size = rays.output;

        const intersections = Kernels.objectIntersect(size)(camera.point, rays, objs, objsCount);
        const lambert = Kernels.shader(size, this.depth)(intersections, rays, objs, objsCount, lights, lightsCount);
        const result = Kernels.rgb(size);

        result(lambert)
        return result;
    }

    _flatten(objects, size) {
        return new Input(objects.flat(), [size, objects.length]);
    }
}