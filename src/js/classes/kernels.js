import Gpu from './gpu';
import {blueNoise} from '../functions/helper';
import {LIGHT_TYPE_POINT, LIGHT_TYPE_PLANE} from '../lights/base';
import {OBJECT_TYPE_PLANE, OBJECT_TYPE_SPHERE} from '../objects/base';

export default class Kernels {
    static rays(width, height, fov) {
        const id = Kernels._sid(arguments);
        if (Kernels._raysKId !== id) {
            let halfWidth = Math.tan((Math.PI * (fov / 2) / 180));
            let halfHeight = (height / width) * halfWidth;
            let pixelWidth = (halfWidth * 2) / (width - 1);
            let pixelHeight = (halfHeight * 2) / (height - 1);

            Kernels._raysKId = id;
            Kernels._raysKernel = Gpu.makeKernel(function (eyeVec, rVec, upVec) {
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

        return Kernels._raysKernel;
    }

    static shader(size, objsCount, lightsCount) {
        const id = Kernels._sid(arguments);
        if (Kernels._shaderKId !== id) {
            Kernels._shaderKId = id;
            Kernels._shaderKernel = Gpu.makeKernel(function (
                pt,
                rays,
                objs,
                lights,
                depth,
                shadowRayCount,
                frameNo
            ) {
                const x = this.thread.x;
                const y = this.thread.y;
                const ray = rays[y][x];

                let _depth = 0;
                let colorAmbient = [0, 0, 0];
                let colorLambert = [0, 0, 0];

                let ptX = pt[0];
                let ptY = pt[1];
                let ptZ = pt[2];

                let vecX = ray[0];
                let vecY = ray[1];
                let vecZ = ray[2];

                while (_depth <= depth) {
                    let interSec = nearestIntersectionToObj(
                        ptX,
                        ptY,
                        ptZ,
                        vUnitX(vecX, vecY, vecZ),
                        vUnitY(vecX, vecY, vecZ),
                        vUnitZ(vecX, vecY, vecZ),
                        objs,
                        this.constants.OBJECTS_COUNT
                    );

                    let oIndex = interSec[0];

                    // If there is no intersection with any object
                    if (oIndex === -1) {
                       break;
                    }

                    colorAmbient[0] += objs[oIndex][9] * objs[oIndex][4];
                    colorAmbient[1] += objs[oIndex][9] * objs[oIndex][5];
                    colorAmbient[2] += objs[oIndex][9] * objs[oIndex][6];

                    let interSecPtX = interSec[1];
                    let interSecPtY = interSec[2];
                    let interSecPtZ = interSec[3];

                    let interSecNormX = 0;
                    let interSecNormY = 0;
                    let interSecNormZ = 0;

                    if (objs[oIndex][0] === this.constants.OBJECT_TYPE_SPHERE) {
                        interSecNormX = sphereNormalX(interSecPtX, interSecPtY, interSecPtZ, objs[oIndex][1], objs[oIndex][2], objs[oIndex][3]);
                        interSecNormY = sphereNormalY(interSecPtX, interSecPtY, interSecPtZ, objs[oIndex][1], objs[oIndex][2], objs[oIndex][3]);
                        interSecNormZ = sphereNormalZ(interSecPtX, interSecPtY, interSecPtZ, objs[oIndex][1], objs[oIndex][2], objs[oIndex][3]);
                    } else if (objs[oIndex][0] === this.constants.OBJECT_TYPE_PLANE) {
                        interSecNormX = -objs[oIndex][20];
                        interSecNormY = -objs[oIndex][21];
                        interSecNormZ = -objs[oIndex][22];
                    }

                    // Lambertian Shading
                    //////////////////////////////////////////////////////////////////
                    for (let i = 0; i < this.constants.LIGHTS_COUNT; i++) {

                        // If object does not support this shading
                        if (objs[oIndex][8] === 0) {
                            break;
                        }

                        const lightPtX = lights[i][1];
                        const lightPtY = lights[i][2];
                        const lightPtZ = lights[i][3];

                        let toLightVecX = sphereNormalX(lightPtX, lightPtY, lightPtZ, interSecPtX, interSecPtY, interSecPtZ);
                        let toLightVecY = sphereNormalY(lightPtX, lightPtY, lightPtZ, interSecPtX, interSecPtY, interSecPtZ);
                        let toLightVecZ = sphereNormalZ(lightPtX, lightPtY, lightPtZ, interSecPtX, interSecPtY, interSecPtZ);

                        //////////////////////////////////////////////////////////////////
                        // Prepare light cone vectors to light
                        // https://blog.demofox.org/2020/05/16/using-blue-noise-for-raytraced-soft-shadows/
                        //////////////////////////////////////////////////////////////////
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

                        const n = Math.abs(Math.random() + (frameNo * 0.61803398875));
                        const theta = (n - Math.floor(n)) * 2.0 * Math.PI;
                        const cosTheta = Math.cos(theta);
                        const sinTheta = Math.sin(theta);

                        let lightContrib = 0;
                        const r = Math.floor(Math.random() * (63 - shadowRayCount));
                        const shadowRayDivisor = (1 / shadowRayCount);

                        for (let j = 0; j < shadowRayCount; j++) {

                            //////////////////////////////////////////////////////////////////
                            // Find random point on light cone disk and trace it
                            //////////////////////////////////////////////////////////////////
                            const n = j + r;
                            const diskPtX = ((this.constants.BN_VEC[n][0] * cosTheta) - (this.constants.BN_VEC[n][1] * sinTheta)) * lights[i][8];
                            const diskPtY = ((this.constants.BN_VEC[n][0] * sinTheta) + (this.constants.BN_VEC[n][1] * cosTheta)) * lights[i][8];

                            toLightVecX = toLightVecX + (lightTanX * diskPtX) + (lightBiTanX * diskPtY);
                            toLightVecY = toLightVecY + (lightTanY * diskPtX) + (lightBiTanY * diskPtY);
                            toLightVecZ = toLightVecZ + (lightTanZ * diskPtX) + (lightBiTanZ * diskPtY);

                            toLightVecX = vUnitX(toLightVecX, toLightVecY, toLightVecZ);
                            toLightVecY = vUnitY(toLightVecX, toLightVecY, toLightVecZ);
                            toLightVecZ = vUnitZ(toLightVecX, toLightVecY, toLightVecZ);

                            const oIntersection = nearestIntersectionToObj(
                                interSecPtX,
                                interSecPtY,
                                interSecPtZ,
                                toLightVecX,
                                toLightVecY,
                                toLightVecZ,
                                objs,
                                this.constants.OBJECTS_COUNT
                            );

                            //////////////////////////////////////////////////////////////////
                            // If light disk point is visible from intersection point
                            //////////////////////////////////////////////////////////////////
                            if (oIntersection[0] === -1) {
                                let l = vDot(
                                    toLightVecX,
                                    toLightVecY,
                                    toLightVecZ,
                                    interSecNormX,
                                    interSecNormY,
                                    interSecNormZ
                                );

                                if (l >= 0) {
                                    lightContrib += shadowRayDivisor * l;
                                }
                            }
                        }

                        colorLambert[0] += (objs[oIndex][4] * lightContrib * objs[oIndex][8] * lights[i][7]);
                        colorLambert[1] += (objs[oIndex][5] * lightContrib * objs[oIndex][8] * lights[i][7]);
                        colorLambert[2] += (objs[oIndex][6] * lightContrib * objs[oIndex][8] * lights[i][7]);
                    }

                    ptX = interSecPtX;
                    ptY = interSecPtY;
                    ptZ = interSecPtZ;

                    let incidentVecX = vecX;
                    let incidentVecY = vecY;
                    let incidentVecZ = vecZ;

                    vecX = -vReflectX(incidentVecX, incidentVecY, incidentVecZ, interSecNormX, interSecNormY, interSecNormZ);
                    vecY = -vReflectY(incidentVecX, incidentVecY, incidentVecZ, interSecNormX, interSecNormY, interSecNormZ);
                    vecZ = -vReflectZ(incidentVecX, incidentVecY, incidentVecZ, interSecNormX, interSecNormY, interSecNormZ);

                    _depth++;
                }

                return [
                    colorLambert[0] + colorAmbient[0],
                    colorLambert[1] + colorAmbient[1],
                    colorLambert[2] + colorAmbient[2]
                ];
            }).setConstants({
                BN_VEC: blueNoise(),
                OBJECTS_COUNT: objsCount,
                LIGHTS_COUNT: lightsCount,
                OBJECT_TYPE_SPHERE: OBJECT_TYPE_SPHERE,
                OBJECT_TYPE_PLANE: OBJECT_TYPE_PLANE,
                LIGHT_TYPE_POINT: LIGHT_TYPE_POINT,
                LIGHT_TYPE_PLANE: LIGHT_TYPE_PLANE
            }).setPipeline(true).setOutput(size);
        }

        return Kernels._shaderKernel;
    }

    static lerp(size) {
        const id = Kernels._sid(arguments);
        if (Kernels._lerpKId !== id) {
            Kernels._lerpKId = id;
            Kernels._lerpKernel = Gpu.makeKernel(function (oldPixels, newPixels) {
                const pxNew = newPixels[this.thread.y][this.thread.x];
                const pxOld = oldPixels[this.thread.y][this.thread.x];
                return [
                    interpolate(pxOld[0], pxNew[0], 0.05),
                    interpolate(pxOld[1], pxNew[1], 0.05),
                    interpolate(pxOld[2], pxNew[2], 0.05),
                ];
            }).setPipeline(true).setImmutable(true).setOutput(size)
        }

        return Kernels._lerpKernel;
    }

    static rgb(size) {
        const id = Kernels._sid(arguments);
        if (Kernels._rgbKId !== id) {
            Kernels._rgbKId = id;
            Kernels._rbgKernel = Gpu.makeKernel(function (pixels) {
                const p = pixels[this.thread.y][this.thread.x];
                this.color(p[0], p[1], p[2]);
            }).setOutput(size).setGraphical(true);
        }

        return Kernels._rbgKernel;
    }

    static _sid(args) {
        return [...args].flat().reduce((a, b) => a + b, 0);
    }
}