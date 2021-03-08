import Gpu from './gpu';

const {Input} = require('gpu.js');
import {OBJECT_TYPE_PLANE, OBJECT_TYPE_SPHERE} from '../objects/base';
import {LIGHT_TYPE_POINT, LIGHT_TYPE_PLANE} from '../lights/base';

export default class Engine {
    constructor(depth) {
        this.depth = depth;
    }

    renderFrame(camera, scene, rays) {
        let sceneArr = scene.toArray();
        let objCount = sceneArr[0].length;
        let objFlattened = this._objectsFlattened(sceneArr[0], 30);

        let lightsCount = sceneArr[1].length;
        let lightsFlattened = this._objectsFlattened(sceneArr[1], 15);

        let objIntersection = this._intersectObjects(camera, rays, objCount, objFlattened);
        rays.delete();

        let d = this._calculateLambert(objIntersection, lightsCount, lightsFlattened);


    }

    _intersectObjects(camera, rays, objCount, objFlattened) {
        let kernel = Gpu.makeKernel(function (rays, objs) {
            let x = this.thread.x;
            let y = this.thread.y;

            let oId = -1;
            let oDist = 1e10;
            let rayV = rays[y][x];

            for (let i = 0; i < this.constants.OBJECT_COUNT; i++) {
                if (this.constants.OBJECT_TYPE_SPHERE === objs[i][0]) {
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

                if (this.constants.OBJECT_TYPE_PLANE === objs[i][0]) {

                }
            }

            if (-1 === oId || 1e10 === oDist) {
                return [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
            }

            let intersectPointX = this.constants.RAY_POINT[0] + (rayV[0] * oDist);
            let intersectPointY = this.constants.RAY_POINT[1] + (rayV[1] * oDist);
            let intersectPointZ = this.constants.RAY_POINT[2] + (rayV[2] * oDist);

            if (this.constants.OBJECT_TYPE_SPHERE === objs[oId][0]) {
                let normX = intersectPointX - objs[oId][1];
                let normY = intersectPointY - objs[oId][2];
                let normZ = intersectPointZ - objs[oId][3];

                return [
                    vUnitX(normX, normY, normZ),
                    vUnitY(normX, normY, normZ),
                    vUnitZ(normX, normY, normZ),
                    objs[oId][4],
                    objs[oId][5],
                    objs[oId][6],
                    objs[oId][7],
                    objs[oId][8],
                    objs[oId][9],
                    objs[oId][10]
                ];
            }

            if (this.constants.OBJECT_TYPE_PLANE === objs[oId][0]) {

            }

            return [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1];

        }).setConstants({
            RAY_POINT: camera.point,
            OBJECT_COUNT: objCount,
            OBJECT_TYPE_SPHERE: OBJECT_TYPE_SPHERE,
            OBJECT_TYPE_PLANE: OBJECT_TYPE_PLANE
        }).setPipeline(true).setOutput(rays.output);

        return kernel(rays, objFlattened);
    }

    _calculateLambert(objIntersection, lightCount, lightFlattened) {
        let kernel = Gpu.makeKernel(function (objIntersection, lights) {
            let x = this.thread.x;
            let y = this.thread.y;

            if (objIntersection[y][x][8] === 0) {
                return [1, 1, 1];
            }
        }).setConstants({
            LIGHT_COUNT: lightCount,
            LIGHT_TYPE_POINT: LIGHT_TYPE_POINT,
            LIGHT_TYPE_PLANE: LIGHT_TYPE_PLANE
        }).setPipeline(true).setDynamicOutput(true).setOutput(rays.output);

        return kernel(objIntersection, lightFlattened);
    }

    _objectsFlattened(objects, size) {
        return new Input(objects.flat(), [size, objects.length]);
    }
}