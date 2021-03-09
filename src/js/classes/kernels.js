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

                let xScaleVecX = x * rightV[0];
                let xScaleVecY = x * rightV[1];
                let xScaleVecZ = x * rightV[2];

                let yScaleVecX = y * upV[0];
                let yScaleVecY = y * upV[1];
                let yScaleVecZ = y * upV[2];

                let sumVecX = eyeV[0] + xScaleVecX + yScaleVecX;
                let sumVecY = eyeV[1] + xScaleVecY + yScaleVecY;
                let sumVecZ = eyeV[2] + xScaleVecZ + yScaleVecZ;

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

        return Kernels._raysKernel;
    }

    static objectIntersect(size) {
        let id = size[0].length + size[1].length;
        if (id !== Kernels._objIntKernelId) {
            Kernels._objIntKernelId = id;
            Kernels._objIntKernel = Gpu.makeKernel(function (rays, point, objs, objsCount) {
                let x = this.thread.x;
                let y = this.thread.y;

                return closestObjIntersection(point, rays[y][x], objs, objsCount);
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
            Kernels._lambertKernel = Gpu.makeKernel(function (intersections, objs, objsCount, lights, lightsCount) {
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
                        [intersectionPtX, intersectionPtY, intersectionPtZ],
                        [intersectionVecX, intersectionVecY, intersectionVecZ],
                        objs,
                        objsCount
                    );

                    if (oIntersection[0] !== -1) {
                        continue;
                    }

                    let vecToLight = sphereNormal(
                        lightPtX,
                        lightPtY,
                        lightPtZ,
                        intersectionPtX,
                        intersectionPtY,
                        intersectionPtZ
                    );

                    let intersectionNorm = sphereNormal(
                        intersectionPtX,
                        intersectionPtY,
                        intersectionPtZ,
                        objs[oIndex][1],
                        objs[oIndex][2],
                        objs[oIndex][3]
                    );

                    let contribution = vDot(
                        vecToLight[0],
                        vecToLight[1],
                        vecToLight[2],
                        intersectionNorm[0],
                        intersectionNorm[1],
                        intersectionNorm[2]
                    );

                    contribution = Math.min(1, Math.abs(contribution));
                    return [
                        objs[oIndex][4] * contribution * objs[oIndex][8],
                        objs[oIndex][5] * contribution * objs[oIndex][8],
                        objs[oIndex][6] * contribution * objs[oIndex][8]
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

        return Kernels._lambertKernel;
    }

    static renderToCanvas(size) {
        let id = size[0].length + size[1].length;
        if (id !== Kernels._renderKernelId) {
            Kernels._renderKernelId = id;
            Kernels._renderKernel = Gpu.makeKernel(function (colors) {
                let x = this.thread.x;
                let y = this.thread.y;

                let c = colors[y][x];
                this.color(c[0], c[1], c[2], 1);
            }).setPipeline(true).setGraphical(true).setOutput(size);
        }

        return Kernels._renderKernel;
    }
}