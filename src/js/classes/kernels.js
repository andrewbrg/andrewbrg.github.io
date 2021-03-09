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
        let id = width + height + fov;
        if (id !== Kernels._raysKernelId) {

            let halfWidth = Math.tan((Math.PI * (fov / 2) / 180));
            let halfHeight = (height / width) * halfWidth;
            let pixelWidth = (halfWidth * 2) / (width - 1);
            let pixelHeight = (halfHeight * 2) / (height - 1);

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
            }).setPipeline(true).setOutput([height, width]);
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

                return closestObjectIntersection(point, rays[x][y], objs, objsLen);
            }).setConstants({
                OBJECT_TYPE_SPHERE: OBJECT_TYPE_SPHERE,
                OBJECT_TYPE_PLANE: OBJECT_TYPE_PLANE
            }).setPipeline(true).setOutput(size);
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

                let intersection = intersections[x][y];
                let oId = intersection[3];

                if (intersection[0] === 1e10 || objs[oId][8] === 0) {
                    return [0, 0, 0];
                }

                for (let i = 0; i < lightsLen; i++) {
                    let vX = intersection[0] - lights[i][1];
                    let vY = intersection[1] - lights[i][2];
                    let vZ = intersection[2] - lights[i][3];

                    let toLightVX = vUnitX(vX, vY, vZ);
                    let toLightVY = vUnitY(vX, vY, vZ);
                    let toLightVZ = vUnitZ(vX, vY, vZ);

                    let oIntersection = closestObjectIntersection(
                        [intersection[0], intersection[1], intersection[2]],
                        [toLightVX, toLightVY, toLightVZ],
                        objs,
                        objsLen
                    );

                    if (oIntersection[0] !== 1e10) {
                        continue;
                    }

                    let cX = lights[i][1] - intersection[0];
                    let cY = lights[i][2] - intersection[1];
                    let cZ = lights[i][3] - intersection[2];

                    let cVX = vUnitX(cX, cY, cZ);
                    let cVY = vUnitY(cX, cY, cZ);
                    let cVZ = vUnitZ(cX, cY, cZ);

                    let normal = sphereNormal(
                        intersection[0],
                        intersection[1],
                        intersection[2],
                        objs[oId][1],
                        objs[oId][2],
                        objs[oId][3]
                    );

                    let contribution = vDot(
                        cVX,
                        cVY,
                        cVZ,
                        normal[0],
                        normal[1],
                        normal[2]
                    );

                    contribution = Math.min(1, Math.abs(contribution));
                    return [
                        objs[oId][4] * contribution * objs[oId][8],
                        objs[oId][5] * contribution * objs[oId][8],
                        objs[oId][6] * contribution * objs[oId][8]
                    ]
                }

                return [0, 0, 0];
            }).setConstants({
                OBJECT_TYPE_SPHERE: OBJECT_TYPE_SPHERE,
                OBJECT_TYPE_PLANE: OBJECT_TYPE_PLANE,
                LIGHT_TYPE_POINT: LIGHT_TYPE_POINT,
                LIGHT_TYPE_PLANE: LIGHT_TYPE_PLANE
            }).setPipeline(true).setOutput(size);
        }

        return Kernels._lambertKernel;
    }
}