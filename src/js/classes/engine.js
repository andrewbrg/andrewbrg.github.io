import Gpu from './gpu';
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
        let kernel = Gpu.makeKernel(function (rays, objs) {
            let x = this.thread.x;
            let y = this.thread.y;

            let oId = -1;
            let oDist = 1e10;
            let rayV = rays[y][x];

            ////////////////////////////////////////////////////////////////
            // Calculate Object Intersection
            ////////////////////////////////////////////////////////////////
            for (let i = 0; i < this.constants.OBJ_COUNT; i++) {
                let ob = objs[i];
                if (this.constants.TYPE_SPHERE === ob[2]) {
                    let eyeToCenterX = ob[4][0] - this.constants.RAY_POINT[0];
                    let eyeToCenterY = ob[4][1] - this.constants.RAY_POINT[1];
                    let eyeToCenterZ = ob[4][2] - this.constants.RAY_POINT[2];

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

                    let discriminant = (ob[3] * ob[3]) - eDotV + (vDotV * vDotV);
                    if (discriminant > 0) {
                        let distance = vDotV - Math.sqrt(discriminant);
                        if (distance > 0 && distance < oDist) {
                            oId = i;
                            oDist = distance
                        }
                    }
                }

                if (this.constants.TYPE_PLANE === ob[2]) {

                }
            }

            if (-1 === oId || 1e10 === oDist) {
                return [-1, -1];
            }

            ////////////////////////////////////////////////////////////////
            // Calculate Normal
            ////////////////////////////////////////////////////////////////
            let ob = objs[oId];

            let intersectPointX = this.constants.RAY_POINT[0] + (rayV[0] * oDist);
            let intersectPointY = this.constants.RAY_POINT[1] + (rayV[1] * oDist);
            let intersectPointZ = this.constants.RAY_POINT[2] + (rayV[2] * oDist);

            if (this.constants.TYPE_SPHERE === ob[2]) {
                let normX = intersectPointX - ob[4][0];
                let normY = intersectPointY - ob[4][1];
                let normZ = intersectPointZ - ob[4][2];

                return [oId, [
                    vUnitX(normX, normY, normZ),
                    vUnitY(normX, normY, normZ),
                    vUnitZ(normX, normY, normZ)]
                ];
            }

            if (this.constants.TYPE_PLANE === ob[2]) {

            }

            return [-1, -1];
        }).setConstants({
            RAY_POINT: camera.point,
            OBJ_COUNT: objects.length,
            TYPE_SPHERE: TYPE_SPHERE,
            TYPE_PLANE: TYPE_PLANE
        }).setPipeline(true).setDynamicArguments(true).setDynamicOutput(true).setOutput(rays.output);

        return kernel(rays, objects);
    }
}