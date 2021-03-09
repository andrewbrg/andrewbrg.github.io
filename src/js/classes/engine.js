import Kernels from './kernels';

const {Input} = require('gpu.js');

export default class Engine {
    constructor(depth) {
        this.depth = depth;
    }

    renderFrame(camera, scene, rays) {
        let sceneArr = scene.toArray();
        let objsCount = sceneArr[0].length;
        let objs = this._flatten(sceneArr[0], 30);

        let lightsCount = sceneArr[1].length;
        let lights = this._flatten(sceneArr[1], 15);

        let size = rays.output;

        let intersections = Kernels.objectIntersect(size)(rays, camera.point, objs, objsCount);
        let lambert = Kernels.lambert(size)(intersections, objs, objsCount, lights, lightsCount);

        return Kernels.rgb(size)(lambert);
    }

    _flatten(objects, size) {
        return new Input(objects.flat(), [size, objects.length]);
    }
}