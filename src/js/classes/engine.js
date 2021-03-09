import Kernels from './kernels';

const {Input} = require('gpu.js');

export default class Engine {
    constructor(depth) {
        this.depth = depth;
    }

    renderFrame(camera, scene, rays) {
        let sceneArr = scene.toArray();
        let objsCount = sceneArr[0].length;
        let objs = this._objectsFlattened(sceneArr[0], 30);

        let lightsCount = sceneArr[1].length;
        let lights = this._objectsFlattened(sceneArr[1], 15);

        let intersections = Kernels.objectIntersect(rays.output)(rays, camera.point, objs, objsCount);
        let lambert = Kernels.lambert(rays.output)(intersections, objs, objsCount, lights, lightsCount);

        return lambert;
    }


    _objectsFlattened(objects, size) {
        return new Input(objects.flat(), [size, objects.length]);
    }
}