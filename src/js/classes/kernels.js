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

                let rayVecX = eyeVec[0] + xScaleVecX + yScaleVecX;
                let rayVecY = eyeVec[1] + xScaleVecY + yScaleVecY;
                let rayVecZ = eyeVec[2] + xScaleVecZ + yScaleVecZ;

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
                    vUnitX(ray[0], ray[1], ray[2]),
                    vUnitY(ray[0], ray[1], ray[2]),
                    vUnitZ(ray[0], ray[1], ray[2]),
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

    static shader(size, depth) {
        let id = size[0] + size[1] + depth;
        if (id !== self._lambertKernelId) {
            self._lambertKernelId = id;
            self._lambertKernel = Gpu.makeKernel(function (intersections, rays, objs, objsCount, lights, lightsCount) {
                let x = this.thread.x;
                let y = this.thread.y;

                let ray = rays[y][x];
                let intersection = intersections[y][x];

                let oIndex = intersection[0];

                let colorLambert = [0, 0, 0];
                let colorSpecular = [0, 0, 0];
                let colorAmbient = [
                    objs[oIndex][9] * objs[oIndex][4],
                    objs[oIndex][9] * objs[oIndex][5],
                    objs[oIndex][9] * objs[oIndex][6],
                ];

                // If no object intersection
                if (oIndex === -1) {
                    return colorLambert;
                }

                let ptX = intersection[1];
                let ptY = intersection[2];
                let ptZ = intersection[3];

                let intersectionNormX = -1;
                let intersectionNormY = -1;
                let intersectionNormZ = -1;

                //////////////////////////////////////////////
                // Lambertian Shading
                //////////////////////////////////////////////
                for (let i = 0; i < lightsCount; i++) {

                    // If object does not support lambertian shading
                    if (objs[oIndex][8] === 0) {
                        continue;
                    }

                    let lightPtX = lights[i][1];
                    let lightPtY = lights[i][2];
                    let lightPtZ = lights[i][3];

                    let vX = ptX - lightPtX;
                    let vY = ptY - lightPtY;
                    let vZ = ptZ - lightPtZ;

                    let vecX = vUnitX(vX, vY, vZ);
                    let vecY = vUnitY(vX, vY, vZ);
                    let vecZ = vUnitZ(vX, vY, vZ);

                    let oIntersection = closestObjIntersection(
                        ptX,
                        ptY,
                        ptZ,
                        vecX,
                        vecY,
                        vecZ,
                        objs,
                        objsCount
                    );

                    if (oIntersection[0] === -1) {
                        continue;
                    }

                    let vecToLightX = sphereNormalX(lightPtX, lightPtY, lightPtZ, ptX, ptY, ptZ);
                    let vecToLightY = sphereNormalY(lightPtX, lightPtY, lightPtZ, ptX, ptY, ptZ);
                    let vecToLightZ = sphereNormalZ(lightPtX, lightPtY, lightPtZ, ptX, ptY, ptZ);

                    intersectionNormX = sphereNormalX(ptX, ptY, ptZ, objs[oIndex][1], objs[oIndex][2], objs[oIndex][3]);
                    intersectionNormY = sphereNormalY(ptX, ptY, ptZ, objs[oIndex][1], objs[oIndex][2], objs[oIndex][3]);
                    intersectionNormZ = sphereNormalZ(ptX, ptY, ptZ, objs[oIndex][1], objs[oIndex][2], objs[oIndex][3]);

                    let c = vDot(vecToLightX, vecToLightY, vecToLightZ, intersectionNormX, intersectionNormY, intersectionNormZ);
                    c = Math.min(1, Math.abs(c));

                    colorLambert = [
                        objs[oIndex][4] * c * objs[oIndex][8],
                        objs[oIndex][5] * c * objs[oIndex][8],
                        objs[oIndex][6] * c * objs[oIndex][8]
                    ];
                }

                //////////////////////////////////////////////
                // Specular Shading
                //////////////////////////////////////////////
                if (intersectionNormX !== -1) {
                    let depth = 0;
                    let incidentVecX = ray[0];
                    let incidentVecY = ray[1];
                    let incidentVecZ = ray[2];

                    while (depth < this.constants.RECURSIVE_DEPTH) {
                        let reflectedVecX = -vReflectX(incidentVecX, incidentVecY, incidentVecZ, intersectionNormX, intersectionNormY, intersectionNormZ);
                        let reflectedVecY = -vReflectY(incidentVecX, incidentVecY, incidentVecZ, intersectionNormX, intersectionNormY, intersectionNormZ);
                        let reflectedVecZ = -vReflectZ(incidentVecX, incidentVecY, incidentVecZ, intersectionNormX, intersectionNormY, intersectionNormZ);

                        let sIntersection = closestObjIntersection(
                            ptX,
                            ptY,
                            ptZ,
                            reflectedVecX,
                            reflectedVecY,
                            reflectedVecZ,
                            objs,
                            objsCount
                        );

                        let sIndex = sIntersection[0];
                        if (sIndex === -1) {
                            break;
                        }

                        colorSpecular = [
                            colorSpecular[0] + (objs[sIndex][4] * objs[oIndex][7]),
                            colorSpecular[1] + (objs[sIndex][5] * objs[oIndex][7]),
                            colorSpecular[2] + (objs[sIndex][6] * objs[oIndex][7])
                        ];

                        ptX = sIntersection[1];
                        ptY = sIntersection[2];
                        ptZ = sIntersection[3];

                        intersectionNormX = sphereNormalX(sIntersection[1], sIntersection[2], sIntersection[3], objs[sIndex][1], objs[sIndex][2], objs[sIndex][3]);
                        intersectionNormY = sphereNormalY(sIntersection[1], sIntersection[2], sIntersection[3], objs[sIndex][1], objs[sIndex][2], objs[sIndex][3]);
                        intersectionNormZ = sphereNormalZ(sIntersection[1], sIntersection[2], sIntersection[3], objs[sIndex][1], objs[sIndex][2], objs[sIndex][3]);

                        incidentVecX = reflectedVecX;
                        incidentVecY = reflectedVecY;
                        incidentVecZ = reflectedVecZ;

                        depth++;
                    }
                }

                return [
                    colorLambert[0] + ((colorLambert[0] / 255) * colorSpecular[0]) + colorAmbient[0],
                    colorLambert[1] + ((colorLambert[1] / 255) * colorSpecular[1]) + colorAmbient[1],
                    colorLambert[2] + ((colorLambert[2] / 255) * colorSpecular[2]) + colorAmbient[2]
                ];
            }).setConstants({
                RECURSIVE_DEPTH: depth,
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