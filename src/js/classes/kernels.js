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

    static shader(size, depth, objsCount, lightsCount) {
        let id = size[0] + size[1] + depth + objsCount + lightsCount;
        if (id !== self._lambertKernelId) {
            self._lambertKernelId = id;
            self._lambertKernel = Gpu.makeKernel(function (pt, rays, objs, lights) {
                const x = this.thread.x;
                const y = this.thread.y;

                const ray = rays[y][x];
                let intersection = closestObjIntersection(
                    pt[0],
                    pt[1],
                    pt[2],
                    vUnitX(ray[0], ray[1], ray[2]),
                    vUnitY(ray[0], ray[1], ray[2]),
                    vUnitZ(ray[0], ray[1], ray[2]),
                    objs,
                    this.constants.OBJECTS_COUNT
                );

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
                    return [0, 0, 0];
                }

                let ptX = intersection[1];
                let ptY = intersection[2];
                let ptZ = intersection[3];

                let intersectionNormX = sphereNormalX(ptX, ptY, ptZ, objs[oIndex][1], objs[oIndex][2], objs[oIndex][3]);
                let intersectionNormY = sphereNormalY(ptX, ptY, ptZ, objs[oIndex][1], objs[oIndex][2], objs[oIndex][3]);
                let intersectionNormZ = sphereNormalZ(ptX, ptY, ptZ, objs[oIndex][1], objs[oIndex][2], objs[oIndex][3]);

                //////////////////////////////////////////////
                // Lambertian Shading
                //////////////////////////////////////////////
                for (let i = 0; i < this.constants.LIGHTS_COUNT; i++) {

                    // If object does not support lambertian shading
                    if (objs[oIndex][8] === 0) {
                        break;
                    }

                    let lightPtX = lights[i][1];
                    let lightPtY = lights[i][2];
                    let lightPtZ = lights[i][3];

                    let toLightVecX = sphereNormalX(lightPtX, lightPtY, lightPtZ, ptX, ptY, ptZ);
                    let toLightVecY = sphereNormalY(lightPtX, lightPtY, lightPtZ, ptX, ptY, ptZ);
                    let toLightVecZ = sphereNormalZ(lightPtX, lightPtY, lightPtZ, ptX, ptY, ptZ);

                    let oIntersection = closestObjIntersection(
                        ptX,
                        ptY,
                        ptZ,
                        toLightVecX,
                        toLightVecY,
                        toLightVecZ,
                        objs,
                        this.constants.OBJECTS_COUNT
                    );

                    if (oIntersection[0] !== -1) {
                        continue;
                    }

                    let c = Math.min(1, vDot(
                        toLightVecX,
                        toLightVecY,
                        toLightVecZ,
                        intersectionNormX,
                        intersectionNormY,
                        intersectionNormZ
                    ));

                    colorLambert = [
                        colorLambert[0] + (objs[oIndex][4] * c * objs[oIndex][8]),
                        colorLambert[1] + (objs[oIndex][5] * c * objs[oIndex][8]),
                        colorLambert[2] + (objs[oIndex][6] * c * objs[oIndex][8])
                    ];
                }

                //////////////////////////////////////////////
                // Specular Shading
                //////////////////////////////////////////////
                let depth = 1;
                let incidentVecX = ray[0];
                let incidentVecY = ray[1];
                let incidentVecZ = ray[2];

                while (depth <= this.constants.RECURSIVE_DEPTH) {
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
                        this.constants.OBJECTS_COUNT
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
                LIGHT_TYPE_PLANE: LIGHT_TYPE_PLANE,
                OBJECTS_COUNT: objsCount,
                LIGHTS_COUNT: lightsCount
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

                this.color((c[0] / 255), (c[1] / 255), (c[2] / 255));
            }).setOutput(size).setPipeline(false).setGraphical(true);
        }

        return self._rbgKernel;
    }
}