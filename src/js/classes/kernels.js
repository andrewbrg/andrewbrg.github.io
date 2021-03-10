import Gpu from './gpu';
import {LIGHT_TYPE_POINT, LIGHT_TYPE_PLANE} from '../lights/base';
import {OBJECT_TYPE_PLANE, OBJECT_TYPE_SPHERE} from '../objects/base';

export default class Kernels {
    static rays(width, height, fov) {
        let id = width + height + fov;
        if (id !== self._raysKernelId) {
            let halfWidth = Math.tan((Math.PI * (fov / 2) / 180));
            let halfHeight = (height / width) * halfWidth;
            let pixelWidth = (halfWidth * 2) / (width - 1);
            let pixelHeight = (halfHeight * 2) / (height - 1);

            self._raysKernelId = id;
            self._raysKernel = Gpu.makeKernel(function (eyeVec, rVec, upVec) {
                let x = this.thread.x;
                let y = this.thread.y;

                let x1 = (x * this.constants.PIXEL_W) - this.constants.HALF_W;
                let y1 = (y * this.constants.PIXEL_H) - this.constants.HALF_H;

                let xScaleVecX = x1 * rVec[0];
                let xScaleVecY = x1 * rVec[1];
                let xScaleVecZ = x1 * rVec[2];

                let yScaleVecX = y1 * upVec[0];
                let yScaleVecY = y1 * upVec[1];
                let yScaleVecZ = y1 * upVec[2];

                let sumVecX = eyeVec[0] + xScaleVecX + yScaleVecX;
                let sumVecY = eyeVec[1] + xScaleVecY + yScaleVecY;
                let sumVecZ = eyeVec[2] + xScaleVecZ + yScaleVecZ;

                let rayVecX = vUnitX(sumVecX, sumVecY, sumVecZ);
                let rayVecY = vUnitY(sumVecX, sumVecY, sumVecZ);
                let rayVecZ = vUnitZ(sumVecX, sumVecY, sumVecZ);

                return [rayVecX, rayVecY, rayVecZ];
            }).setConstants({
                HALF_W: halfWidth,
                HALF_H: halfHeight,
                PIXEL_W: pixelWidth,
                PIXEL_H: pixelHeight
            }).setPipeline(true).setOutput([width, height]);
        }

        return self._raysKernel;
    }

    static objectIntersect(size) {
        let id = size[0] + size[1];
        if (id !== self._objIntKernelId) {
            self._objIntKernelId = id;
            self._objIntKernel = Gpu.makeKernel(function (pt, rays, objs, objsCount) {
                let x = this.thread.x;
                let y = this.thread.y;

                let ray = rays[y][x];
                return closestObjIntersection(
                    pt[0],
                    pt[1],
                    pt[2],
                    ray[0],
                    ray[1],
                    ray[2],
                    objs,
                    objsCount
                );
            }).setConstants({
                OBJECT_TYPE_SPHERE: OBJECT_TYPE_SPHERE,
                OBJECT_TYPE_PLANE: OBJECT_TYPE_PLANE
            }).setPipeline(true).setOutput(size);
        }

        return self._objIntKernel;
    }

    static lambert(size) {
        let id = size[0] + size[1];
        if (id !== self._lambertKernelId) {
            self._lambertKernelId = id;
            self._lambertKernel = Gpu.makeKernel(function (intersections, objs, objsCount, lights, lightsCount) {
                let x = this.thread.x;
                let y = this.thread.y;

                let intersection = intersections[y][x];
                let oIndex = intersection[0];

                if (oIndex === -1 || objs[oIndex][8] === 0) {
                    return [0, 0, 0];
                }

                let intersectionPtX = intersection[1];
                let intersectionPtY = intersection[2];
                let intersectionPtZ = intersection[3];

                for (let i = 0; i < lightsCount; i++) {
                    let lightPtX = lights[i][1];
                    let lightPtY = lights[i][2];
                    let lightPtZ = lights[i][3];

                    let vX = intersectionPtX - lightPtX;
                    let vY = intersectionPtY - lightPtY;
                    let vZ = intersectionPtZ - lightPtZ;

                    let intersectionVecX = vUnitX(vX, vY, vZ);
                    let intersectionVecY = vUnitY(vX, vY, vZ);
                    let intersectionVecZ = vUnitZ(vX, vY, vZ);

                    let oIntersection = closestObjIntersection(
                        intersectionPtX,
                        intersectionPtY,
                        intersectionPtZ,
                        intersectionVecX,
                        intersectionVecY,
                        intersectionVecZ,
                        objs,
                        objsCount
                    );

                    if (oIntersection[0] === -1) {
                        continue;
                    }

                    let vecToLightX = sphereNormalX(lightPtX, lightPtY, lightPtZ, intersectionPtX, intersectionPtY, intersectionPtZ);
                    let vecToLightY = sphereNormalY(lightPtX, lightPtY, lightPtZ, intersectionPtX, intersectionPtY, intersectionPtZ);
                    let vecToLightZ = sphereNormalZ(lightPtX, lightPtY, lightPtZ, intersectionPtX, intersectionPtY, intersectionPtZ);

                    let intersectionNormX = sphereNormalX(intersectionPtX, intersectionPtY, intersectionPtZ, objs[oIndex][1], objs[oIndex][2], objs[oIndex][3]);
                    let intersectionNormY = sphereNormalY(intersectionPtX, intersectionPtY, intersectionPtZ, objs[oIndex][1], objs[oIndex][2], objs[oIndex][3]);
                    let intersectionNormZ = sphereNormalZ(intersectionPtX, intersectionPtY, intersectionPtZ, objs[oIndex][1], objs[oIndex][2], objs[oIndex][3]);

                    let c = vDot(vecToLightX, vecToLightY, vecToLightZ, intersectionNormX, intersectionNormY, intersectionNormZ);
                    c = Math.min(1, Math.abs(c));

                    return [
                        objs[oIndex][4] * c * objs[oIndex][8],
                        objs[oIndex][5] * c * objs[oIndex][8],
                        objs[oIndex][6] * c * objs[oIndex][8]
                    ];
                }

                return [0, 0, 0];
            }).setConstants({
                OBJECT_TYPE_SPHERE: OBJECT_TYPE_SPHERE,
                OBJECT_TYPE_PLANE: OBJECT_TYPE_PLANE,
                LIGHT_TYPE_POINT: LIGHT_TYPE_POINT,
                LIGHT_TYPE_PLANE: LIGHT_TYPE_PLANE
            }).setPipeline(true).setOutput(size);
        }

        return self._lambertKernel;
    }

    static rgb(size) {
        let id = size[0] + size[1];
        if (id !== self._rbgId) {
            self._rbgId = id;
            self._rbgKernel = Gpu.makeKernel(function (col) {
                let x = this.thread.x;
                let y = this.thread.y;
                let c = col[y][x];

                this.color(c[0] / 255, c[1] / 255, c[2] / 255);
            }).setOutput(size).setGraphical(true);
        }

        return self._rbgKernel;
    }
}