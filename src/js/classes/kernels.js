import Gpu from './gpu';
import {blueNoise} from '../functions/helper';
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
            }).setPipeline(true).setImmutable(true).setOutput([width, height]);
        }

        return self._raysKernel;
    }

    static shader(size, depth, objsCount, lightsCount, shadowRaysCount) {
        let id = size[0] + size[1] + depth + shadowRaysCount + objsCount + lightsCount;
        if (id !== self._lambertKernelId) {
            self._lambertKernelId = id;
            self._lambertKernel = Gpu.makeKernel(function (pt, rays, objs, lights) {
                const x = this.thread.x;
                const y = this.thread.y;

                const ray = rays[y][x];
                let intersection = nearestIntersectionToObj(
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
                    objs[oIndex][9] * objs[oIndex][6]
                ];

                // If no object intersection
                if (oIndex === -1) {
                    return [0, 0, 0];
                }

                let ptX = intersection[1];
                let ptY = intersection[2];
                let ptZ = intersection[3];

                let intersectionNormX = 0;
                let intersectionNormY = 0;
                let intersectionNormZ = 0;

                if (objs[oIndex][0] === this.constants.OBJECT_TYPE_SPHERE) {
                    intersectionNormX = sphereNormalX(ptX, ptY, ptZ, objs[oIndex][1], objs[oIndex][2], objs[oIndex][3]);
                    intersectionNormY = sphereNormalY(ptX, ptY, ptZ, objs[oIndex][1], objs[oIndex][2], objs[oIndex][3]);
                    intersectionNormZ = sphereNormalZ(ptX, ptY, ptZ, objs[oIndex][1], objs[oIndex][2], objs[oIndex][3]);
                } else if (objs[oIndex][0] === this.constants.OBJECT_TYPE_PLANE) {
                    intersectionNormX = -objs[oIndex][20];
                    intersectionNormY = -objs[oIndex][21];
                    intersectionNormZ = -objs[oIndex][22];
                }

                //////////////////////////////////////////////
                // Lambertian Shading
                //////////////////////////////////////////////
                for (let i = 0; i < this.constants.LIGHTS_COUNT; i++) {

                    // If object does not support lambertian shading
                    if (objs[oIndex][8] === 0) {
                        break;
                    }

                    const lightPtX = lights[i][1];
                    const lightPtY = lights[i][2];
                    const lightPtZ = lights[i][3];

                    let toLightVecX = sphereNormalX(lightPtX, lightPtY, lightPtZ, ptX, ptY, ptZ);
                    let toLightVecY = sphereNormalY(lightPtX, lightPtY, lightPtZ, ptX, ptY, ptZ);
                    let toLightVecZ = sphereNormalZ(lightPtX, lightPtY, lightPtZ, ptX, ptY, ptZ);

                    // https://blog.demofox.org/2020/05/16/using-blue-noise-for-raytraced-soft-shadows/
                    let sBuffer = [0, 0, 0, 0];
                    let sBuffered = false;

                    // todo set proper blue noise co-eff
                    const theta = 0.45 * 2.0 * Math.PI;
                    const cosTheta = Math.cos(theta);
                    const sinTheta = Math.sin(theta);

                    const cTanX = vCrossX(toLightVecY, toLightVecZ, 1, 0);
                    const cTanY = vCrossY(toLightVecX, toLightVecZ, 0, 0);
                    const cTanZ = vCrossZ(toLightVecX, toLightVecY, 0, 1);

                    const lightTanX = vUnitX(cTanX, cTanY, cTanZ);
                    const lightTanY = vUnitY(cTanX, cTanY, cTanZ);
                    const lightTanZ = vUnitZ(cTanX, cTanY, cTanZ);

                    const cBiTanX = vCrossX(lightTanY, lightTanZ, toLightVecY, toLightVecZ);
                    const cBiTanY = vCrossY(lightTanX, lightTanZ, toLightVecX, toLightVecZ);
                    const cBiTanZ = vCrossZ(lightTanX, lightTanY, toLightVecX, toLightVecY);

                    const lightBiTanX = vUnitX(cBiTanX, cBiTanY, cBiTanZ);
                    const lightBiTanY = vUnitY(cBiTanX, cBiTanY, cBiTanZ);
                    const lightBiTanZ = vUnitZ(cBiTanX, cBiTanY, cBiTanZ);

                    for (let j = 0; j < this.constants.SHADOW_RAY_COUNT; j++) {
                        const diskPtX = ((this.constants.BLUE_NOISE[j][0] * cosTheta) - (this.constants.BLUE_NOISE[j][1] * sinTheta)) * lights[i][8];
                        const diskPtY = ((this.constants.BLUE_NOISE[j][0] * sinTheta) + (this.constants.BLUE_NOISE[j][1] * cosTheta)) * lights[i][8];

                        toLightVecX = toLightVecX + (lightTanX * diskPtX) + (lightBiTanX * diskPtY);
                        toLightVecY = toLightVecY + (lightTanY * diskPtX) + (lightBiTanY * diskPtY);
                        toLightVecZ = toLightVecZ + (lightTanZ * diskPtX) + (lightBiTanZ * diskPtY);

                        toLightVecX = vUnitX(toLightVecX, toLightVecY, toLightVecZ);
                        toLightVecY = vUnitY(toLightVecX, toLightVecY, toLightVecZ);
                        toLightVecZ = vUnitZ(toLightVecX, toLightVecY, toLightVecZ);

                        const oIntersection = nearestIntersectionToObj(
                            ptX,
                            ptY,
                            ptZ,
                            toLightVecX,
                            toLightVecY,
                            toLightVecZ,
                            objs,
                            this.constants.OBJECTS_COUNT
                        );

                        if (oIntersection[0] === -1) {
                            let c = vDot(
                                toLightVecX,
                                toLightVecY,
                                toLightVecZ,
                                intersectionNormX,
                                intersectionNormY,
                                intersectionNormZ
                            );

                            if (c > 0) {
                                sBuffer[j] = c;
                                if (j === 2 && sBuffer[0] === sBuffer[1] && sBuffer[0] === sBuffer[2]) {
                                    sBuffered = true;
                                    colorLambert[0] += (objs[oIndex][4] * c * objs[oIndex][8] * lights[i][7]);
                                    colorLambert[1] += (objs[oIndex][5] * c * objs[oIndex][8] * lights[i][7]);
                                    colorLambert[2] += (objs[oIndex][6] * c * objs[oIndex][8] * lights[i][7]);
                                    break;
                                }
                            }
                        }
                    }

                    if (!sBuffered) {
                        for (let j = 0; j < this.constants.SHADOW_RAY_COUNT; j++) {
                            let c = (1 / this.constants.SHADOW_RAY_COUNT) * sBuffer[j];
                            colorLambert[0] += (objs[oIndex][4] * c * objs[oIndex][8] * lights[i][7]);
                            colorLambert[1] += (objs[oIndex][5] * c * objs[oIndex][8] * lights[i][7]);
                            colorLambert[2] += (objs[oIndex][6] * c * objs[oIndex][8] * lights[i][7]);
                        }
                    }
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

                    let sIntersection = nearestIntersectionToObj(
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

                    colorSpecular[0] += (objs[sIndex][4] * objs[oIndex][7]);
                    colorSpecular[1] += (objs[sIndex][5] * objs[oIndex][7]);
                    colorSpecular[2] += (objs[sIndex][6] * objs[oIndex][7]);

                    ptX = sIntersection[1];
                    ptY = sIntersection[2];
                    ptZ = sIntersection[3];

                    intersectionNormX = sphereNormalX(ptX, ptY, ptZ, objs[sIndex][1], objs[sIndex][2], objs[sIndex][3]);
                    intersectionNormY = sphereNormalY(ptX, ptY, ptZ, objs[sIndex][1], objs[sIndex][2], objs[sIndex][3]);
                    intersectionNormZ = sphereNormalZ(ptX, ptY, ptZ, objs[sIndex][1], objs[sIndex][2], objs[sIndex][3]);

                    incidentVecX = reflectedVecX;
                    incidentVecY = reflectedVecY;
                    incidentVecZ = reflectedVecZ;

                    depth++;
                }

                return [
                    colorLambert[0] + ((colorLambert[0]) * colorSpecular[0]) + colorAmbient[0],
                    colorLambert[1] + ((colorLambert[1]) * colorSpecular[1]) + colorAmbient[1],
                    colorLambert[2] + ((colorLambert[2]) * colorSpecular[2]) + colorAmbient[2]
                ];
            }).setConstants({
                RECURSIVE_DEPTH: depth,
                SHADOW_RAY_COUNT: shadowRaysCount,
                BLUE_NOISE: blueNoise(),
                OBJECT_TYPE_SPHERE: OBJECT_TYPE_SPHERE,
                OBJECT_TYPE_PLANE: OBJECT_TYPE_PLANE,
                LIGHT_TYPE_POINT: LIGHT_TYPE_POINT,
                LIGHT_TYPE_PLANE: LIGHT_TYPE_PLANE,
                OBJECTS_COUNT: objsCount,
                LIGHTS_COUNT: lightsCount
            }).setPipeline(true).setImmutable(true).setOutput(size);
        }

        return self._lambertKernel;
    }

    static rgb(size) {
        let id = size[0] + size[1];
        if (id !== self._rbgId) {
            self._rbgId = id;
            self._rbgKernel = Gpu.makeKernel(function (col) {
                const c = col[ythis.thread.y][this.thread.x];
                this.color(c[0], c[1], c[2]);
            }).setOutput(size).setGraphical(true);
        }

        return self._rbgKernel;
    }
}