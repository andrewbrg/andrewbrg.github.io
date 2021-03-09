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

        let intersections = this._intersectObjects(camera, rays, objsCount, objs);
        let lContribution = this._calculateLambert(intersections, objs, objsCount, lights, lightsCount);
        rays.delete();

        return lContribution;
    }

    _intersectObjects(camera, rays, objsCount, objs) {
        return Kernels.objectIntersect(rays.output)(rays, camera.point, objs, objsCount);
    }

    _calculateLambert(intersections, objs, objsCount, lights, lightsCount) {
        return Kernels.lambert(intersections.output)(intersections, objs, objsCount, lights, lightsCount);
    }

    _objectsFlattened(objects, size) {
        return new Input(objects.flat(), [size, objects.length]);
    }
}