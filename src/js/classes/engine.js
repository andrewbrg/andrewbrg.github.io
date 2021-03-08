import Gpu from './gpu';

const {Input} = require('gpu.js');
import {TYPE_PLANE, TYPE_SPHERE} from '../objects/base';

export default class Engine {
    constructor(depth) {
        this.depth = depth;
    }

    renderFrame(camera, scene, rays) {
        let sceneArr = scene.toArray();
        let intersections = this._findObjectIntersections(camera, sceneArr[0], rays);

        console.log(intersections.toArray());
        rays.delete();
    }

    _findObjectIntersections(camera, objects, rays) {
        console.log(objects);

        let kernel = Gpu.makeKernel(function (rays, objs) {
            let x = this.thread.x;
            let y = this.thread.y;

            let oId = -1;
            let oDist = 1e10;
            let rayV = rays[y][x];

            for (let i = 0; i < this.constants.OBJ_COUNT; i++) {
                if (this.constants.TYPE_SPHERE === objs[i][0]) {
                    let eyeToCenterX = objs[i][1] - this.constants.RAY_POINT[0];
                    let eyeToCenterY = objs[i][2] - this.constants.RAY_POINT[1];
                    let eyeToCenterZ = objs[i][3] - this.constants.RAY_POINT[2];

                    let vDotV = vDot(
                        eyeToCenterX,
                        eyeToCenterY,
                        eyeToCenterZ,
                        rayV[0],
                        rayV[1],
                        rayV[2]
                    );

                    let eDotV = vDot(
                        eyeToCenterX,
                        eyeToCenterY,
                        eyeToCenterZ,
                        eyeToCenterX,
                        eyeToCenterY,
                        eyeToCenterZ
                    );

                    let discriminant = (objs[i][20] * objs[i][20]) - eDotV + (vDotV * vDotV);
                    if (discriminant > 0) {
                        let distance = vDotV - Math.sqrt(discriminant);
                        if (distance > 0 && distance < oDist) {
                            oId = i;
                            oDist = distance
                        }
                    }
                }

                if (this.constants.TYPE_PLANE === objs[i][0]) {

                }
            }

            if (-1 === oId || 1e10 === oDist) {
                return [-1, -1, -1, -1];
            }

            let intersectPointX = this.constants.RAY_POINT[0] + (rayV[0] * oDist);
            let intersectPointY = this.constants.RAY_POINT[1] + (rayV[1] * oDist);
            let intersectPointZ = this.constants.RAY_POINT[2] + (rayV[2] * oDist);

            if (this.constants.TYPE_SPHERE === objs[oId][0]) {
                let normX = intersectPointX - objs[oId][1];
                let normY = intersectPointY - objs[oId][2];
                let normZ = intersectPointZ - objs[oId][3];

                return [
                    oId,
                    vUnitX(normX, normY, normZ),
                    vUnitY(normX, normY, normZ),
                    vUnitZ(normX, normY, normZ)
                ];
            }

            if (this.constants.TYPE_PLANE === objs[oId][0]) {

            }

            return [-1, -1, -1, -1];

        }).setConstants({
            RAY_POINT: camera.point,
            OBJ_COUNT: objects.length,
            TYPE_SPHERE: TYPE_SPHERE,
            TYPE_PLANE: TYPE_PLANE
        }).setPipeline(true).setDynamicOutput(true).setOutput(rays.output);

        return kernel(rays, new Input(objects.flat(), [30, objects.length]));
    }
}