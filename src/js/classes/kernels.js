import Gpu from './gpu';
import {LIGHT_TYPE_POINT, LIGHT_TYPE_PLANE} from '../lights/base';
import {OBJECT_TYPE_PLANE, OBJECT_TYPE_SPHERE} from '../objects/base';

export default class Kernels {
    constructor() {
        Kernels._raysKernelId = null;
        Kernels._objIntKernelId = null;
        Kernels._lambertKernelId = null;
    }

    static rays(width, height, fov) {
        let halfWidth = Math.tan((Math.PI * (fov / 2) / 180));
        let halfHeight = (height / width) * halfWidth;
        let pixelWidth = (halfWidth * 2) / (width - 1);
        let pixelHeight = (halfHeight * 2) / (height - 1);

        let id = width + height + fov;
        if (id !== Kernels._raysKernelId) {
            Kernels._raysKernelId = id;
            Kernels._raysKernel = Gpu.makeKernel(function (eyeV, rightV, upV) {
                let x = this.thread.x;
                let y = this.thread.y;

                x = (x * this.constants.PIXEL_W) - this.constants.HALF_W;
                y = (y * this.constants.PIXEL_H) - this.constants.HALF_H;

                let xScaleVx = x * rightV[0];
                let xScaleVy = x * rightV[1];
                let xScaleVz = x * rightV[2];

                let yScaleVx = y * upV[0];
                let yScaleVy = y * upV[1];
                let yScaleVz = y * upV[2];

                let sumVx = eyeV[0] + xScaleVx + yScaleVx;
                let sumVy = eyeV[1] + xScaleVy + yScaleVy;
                let sumVz = eyeV[2] + xScaleVz + yScaleVz;

                let rayVx = vUnitX(sumVx, sumVy, sumVz);
                let rayVy = vUnitY(sumVx, sumVy, sumVz);
                let rayVz = vUnitZ(sumVx, sumVy, sumVz);

                return [rayVx, rayVy, rayVz];
            }).setConstants({
                HALF_W: halfWidth,
                HALF_H: halfHeight,
                PIXEL_W: pixelWidth,
                PIXEL_H: pixelHeight
            }).setPipeline(true).setOutput([width, height]);
        }

        return Kernels._raysKernel;
    }

    static objectIntersect(size) {
        let id = size[0].length + size[1].length;
        if (id !== Kernels._objIntKernelId) {
            Kernels._objIntKernelId = id;
            Kernels._objIntKernel = Gpu.makeKernel(function (rays, point, objsLen, objs) {
                let x = this.thread.x;
                let y = this.thread.y;

                let oId = -1;
                let oDist = 1e10;
                let rayV = rays[y][x];

                for (let i = 0; i < objsLen; i++) {
                    if (this.constants.OBJECT_TYPE_SPHERE === objs[i][0]) {
                        let eyeToCenterX = objs[i][1] - point[0];
                        let eyeToCenterY = objs[i][2] - point[1];
                        let eyeToCenterZ = objs[i][3] - point[2];

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
                    return [-1, -1, -1, -1];
                }

                let intersectPointX = point[0] + (rayV[0] * oDist);
                let intersectPointY = point[1] + (rayV[1] * oDist);
                let intersectPointZ = point[2] + (rayV[2] * oDist);

                if (this.constants.OBJECT_TYPE_SPHERE === objs[oId][0]) {
                    let normX = intersectPointX - objs[oId][1];
                    let normY = intersectPointY - objs[oId][2];
                    let normZ = intersectPointZ - objs[oId][3];

                    return [
                        vUnitX(normX, normY, normZ),
                        vUnitY(normX, normY, normZ),
                        vUnitZ(normX, normY, normZ),
                        oId
                    ];
                }

                if (this.constants.OBJECT_TYPE_PLANE === objs[oId][0]) {

                }

                return [-1, -1, -1, -1];

            }).setConstants({
                OBJECT_TYPE_SPHERE: OBJECT_TYPE_SPHERE,
                OBJECT_TYPE_PLANE: OBJECT_TYPE_PLANE
            }).setPipeline(true).setDynamicArguments(true).setOutput(size);
        }

        return Kernels._objIntKernel;
    }

    static lambert(size) {
        let id = size[0].length + size[1].length;
        if (id !== Kernels._lambertKernelId) {
            Kernels._lambertKernelId = id;
            Kernels._lambertKernel = Gpu.makeKernel(function (intersections, lightsLen, lights, objsLen, objs) {
                let x = this.thread.x;
                let y = this.thread.y;

                let intersection = intersections[y][x];
                let oId = intersection[3];

                if (intersection[0] === -1 || objs[oId][8] === 0) {
                    return [0, 0, 0];
                }

                return [255, 255, 255];
            }).setConstants({
                LIGHT_TYPE_POINT: LIGHT_TYPE_POINT,
                LIGHT_TYPE_PLANE: LIGHT_TYPE_PLANE
            }).setPipeline(true).setDynamicArguments(true).setOutput(size);
        }

        return Kernels._lambertKernel;
    }
}