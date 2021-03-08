import Kernels from './kernels';

const {Input} = require('gpu.js');

export default class Engine {
    constructor(depth) {
        this.depth = depth;
    }

    renderFrame(camera, scene, rays) {
        let sceneArr = scene.toArray();
        let objsLen = sceneArr[0].length;
        let objs = this._objectsFlattened(sceneArr[0], 30);

        let lightsLen = sceneArr[1].length;
        let lights = this._objectsFlattened(sceneArr[1], 15);

        let intersections = this._intersectObjects(camera, rays, objsLen, objs);
        console.log(intersections.toArray());
        let lContribution = this._calculateLambert(intersections, lightsLen, lights, objsLen, objs);
        console.log(lContribution.toArray());
        rays.delete();
    }

    _intersectObjects(camera, rays, objsLen, objs) {
        return Kernels.objectIntersect(rays.output)(rays, camera.point, objsLen, objs);
    }

    _calculateLambert(intersections, lightsLen, lights, objsLen, objs) {
        return Kernels.lambert(intersections.output)(intersections, lightsLen, lights, objsLen, objs);
    }

    _objectsFlattened(objects, size) {
        return new Input(objects.flat(), [size, objects.length]);
    }
}