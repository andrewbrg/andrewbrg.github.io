import Gpu from './gpu';
import Kernels from './kernels';

const {Input} = require('gpu.js');

export default class Engine {
    constructor(depth) {
        this.depth = depth;
    }

    renderFrame(camera, scene, width, height) {
        let sceneArr = scene.toArray();
        let objsCount = sceneArr[0].length;
        let objs = this._flatten(sceneArr[0], 30);

        let lightsCount = sceneArr[1].length;
        let lights = this._flatten(sceneArr[1], 15);

        const rays = camera.generateRays(width, height);
        const intersections = Kernels.objectIntersect(rays.output);
        const lambert = Kernels.lambert(rays.output);
        const rgb = Kernels.rgb(rays.output);

        const engineKernel = Gpu.gpuJS().combineKernels(
            intersections,
            lambert,
            rgb,
            function (p, r, o, oc, l, lc) {
                return rgb(lambert(intersections(p, r, o, oc), o, oc, l, lc));
            }
        );

        return engineKernel(camera.point, rays, objs, objsCount, lights, lightsCount);
    }

    _flatten(objects, size) {
        return new Input(objects.flat(), [size, objects.length]);
    }
}