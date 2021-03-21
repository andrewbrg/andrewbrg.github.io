import Gpu from './gpu';
import {blueNoise} from '../functions/helper';
import {LIGHT_TYPE_POINT, LIGHT_TYPE_PLANE} from '../lights/base';
import {OBJECT_TYPE_PLANE, OBJECT_TYPE_SPHERE} from '../objects/base';

import {interpolate} from '../functions/helper';
import {nearestInterSecObj} from '../functions/intersections';
import {sphereNormalX, sphereNormalY, sphereNormalZ} from '../functions/normals'
import {
    vUnitX,
    vUnitY,
    vUnitZ,
    vCrossX,
    vCrossY,
    vCrossZ,
    vReflectX,
    vReflectY,
    vReflectZ,
    vDot
} from '../functions/vector';

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
            }).setPipeline(true)
                .setTactic('speed')
                .setOutput([width, height]);
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
                textures,
                depth,
                shadowRayCount
            ) {
                const x = this.thread.x;
                const y = this.thread.y;
                const ray = rays[y][x];

                // Ray point
                let ptX = pt[0];
                let ptY = pt[1];
                let ptZ = pt[2];

                // Ray direction
                let vecX = ray[0];
                let vecY = ray[1];
                let vecZ = ray[2];

                let _depth = 0;
                let oIndexes = [0, 0, 0];
                let colorRGB = [0, 0, 0];

                while (_depth <= depth) {

                    // Look for the nearest object intersection of this ray
                    let interSec = nearestInterSecObj(
                        ptX,
                        ptY,
                        ptZ,
                        vUnitX(vecX, vecY, vecZ),
                        vUnitY(vecX, vecY, vecZ),
                        vUnitZ(vecX, vecY, vecZ),
                        objs,
                        this.constants.OBJECTS_COUNT
                    );

                    // Store the object index
                    const oIndex = interSec[0];
                    oIndexes[_depth] = oIndex;

                    // If there are no intersections with any objects
                    if (oIndex === -1) {
                        break;
                    }

                    const interSecPtX = interSec[1];
                    const interSecPtY = interSec[2];
                    const interSecPtZ = interSec[3];

                    // Calculate the intersection normal
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

                        // Find a vector from the intersection point to this light
                        const lightPtX = lights[i][1];
                        const lightPtY = lights[i][2];
                        const lightPtZ = lights[i][3];

                        let toLightVecX = sphereNormalX(lightPtX, lightPtY, lightPtZ, interSecPtX, interSecPtY, interSecPtZ);
                        let toLightVecY = sphereNormalY(lightPtX, lightPtY, lightPtZ, interSecPtX, interSecPtY, interSecPtZ);
                        let toLightVecZ = sphereNormalZ(lightPtX, lightPtY, lightPtZ, interSecPtX, interSecPtY, interSecPtZ);

                        // Transform the light vector into a number of vectors onto a disk
                        // The implementation here is not 100% correct
                        // https://blog.demofox.org/2020/05/16/using-blue-noise-for-raytraced-soft-shadows/
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

                        // Prepare to rotate the light vector
                        const n = Math.random();
                        const theta = (n - Math.floor(n)) * 2.0 * Math.PI;
                        const cosTheta = Math.cos(theta);
                        const sinTheta = Math.sin(theta);

                        // For performance we will reduce the number of shadow rays on reflections
                        const sRayCount = Math.max(1, Math.floor(shadowRayCount / (_depth + 1)));

                        let lightContrib = 0;
                        const r = Math.floor(Math.random() * (63 - sRayCount));
                        const sRayDivisor = (1 / sRayCount);

                        for (let j = 0; j < sRayCount; j++) {

                            // Find a point on the light disk based on blue noise distribution
                            // and rotate it by theta for more even distribution of samples
                            const n = j + r;
                            const diskPtX = ((this.constants.BN_VEC[n][0] * cosTheta) - (this.constants.BN_VEC[n][1] * sinTheta)) * lights[i][8];
                            const diskPtY = ((this.constants.BN_VEC[n][0] * sinTheta) + (this.constants.BN_VEC[n][1] * cosTheta)) * lights[i][8];

                            toLightVecX = toLightVecX + (lightTanX * diskPtX) + (lightBiTanX * diskPtY);
                            toLightVecY = toLightVecY + (lightTanY * diskPtX) + (lightBiTanY * diskPtY);
                            toLightVecZ = toLightVecZ + (lightTanZ * diskPtX) + (lightBiTanZ * diskPtY);

                            toLightVecX = vUnitX(toLightVecX, toLightVecY, toLightVecZ);
                            toLightVecY = vUnitY(toLightVecX, toLightVecY, toLightVecZ);
                            toLightVecZ = vUnitZ(toLightVecX, toLightVecY, toLightVecZ);

                            // Check if the light is visible from this point
                            const oIntersection = nearestInterSecObj(
                                interSecPtX,
                                interSecPtY,
                                interSecPtZ,
                                toLightVecX,
                                toLightVecY,
                                toLightVecZ,
                                objs,
                                this.constants.OBJECTS_COUNT
                            );

                            // If the light source is visible from this sample shadow ray
                            // we must see how much light this vector contributes
                            if (oIntersection[0] === -1) {
                                const l = vDot(
                                    toLightVecX,
                                    toLightVecY,
                                    toLightVecZ,
                                    interSecNormX,
                                    interSecNormY,
                                    interSecNormZ
                                );

                                if (l >= 0) {
                                    lightContrib += sRayDivisor * l;
                                }
                            }
                        }

                        // Calculate the pixel RGB values for the ray
                        const intensity = lights[i][7];
                        const lambertCoefficient = objs[oIndex][8];
                        let specularCoefficient = 1;

                        // We reduce the contribution based on the depth
                        for (let j = 1; j <= _depth; j++) {
                            specularCoefficient *= objs[oIndexes[j - 1]][7] * (1 / j);
                        }

                        const c = lightContrib * intensity * lambertCoefficient * specularCoefficient;

                        colorRGB[0] += objs[oIndex][4] * c;
                        colorRGB[1] += objs[oIndex][5] * c;
                        colorRGB[2] += objs[oIndex][6] * c;
                    }

                    // Change the starting ray position to our intersection position and reflect
                    // it's direction vector around the intersection normal. This traces specular bounces.
                    ptX = interSecPtX;
                    ptY = interSecPtY;
                    ptZ = interSecPtZ;

                    const incidentVecX = vecX;
                    const incidentVecY = vecY;
                    const incidentVecZ = vecZ;

                    vecX = -vReflectX(incidentVecX, incidentVecY, incidentVecZ, interSecNormX, interSecNormY, interSecNormZ);
                    vecY = -vReflectY(incidentVecX, incidentVecY, incidentVecZ, interSecNormX, interSecNormY, interSecNormZ);
                    vecZ = -vReflectZ(incidentVecX, incidentVecY, incidentVecZ, interSecNormX, interSecNormY, interSecNormZ);

                    // Re-iterate according the the number of specular bounces we are doing
                    _depth++;
                }

                return colorRGB;
            }).setConstants({
                BN_VEC: blueNoise(),
                OBJECTS_COUNT: objsCount,
                LIGHTS_COUNT: lightsCount,
                OBJECT_TYPE_SPHERE: OBJECT_TYPE_SPHERE,
                OBJECT_TYPE_PLANE: OBJECT_TYPE_PLANE,
                LIGHT_TYPE_POINT: LIGHT_TYPE_POINT,
                LIGHT_TYPE_PLANE: LIGHT_TYPE_PLANE
            }).setPipeline(true)
                .setTactic('speed')
                .setOutput(size);
        }

        return Kernels._shaderKernel;
    }

    static interpolateFrames(size) {
        const id = Kernels._sid(arguments);
        if (Kernels._interpolateKId !== id) {
            Kernels._interpolateKId = id;
            Kernels._interpolateKernel = Gpu.makeKernel(function (oldPixels, newPixels) {
                const pxNew = newPixels[this.thread.y][this.thread.x];
                const pxOld = oldPixels[this.thread.y][this.thread.x];
                return [
                    interpolate(pxOld[0], pxNew[0], 0.05),
                    interpolate(pxOld[1], pxNew[1], 0.05),
                    interpolate(pxOld[2], pxNew[2], 0.05),
                ];
            }).setPipeline(true)
                .setImmutable(true)
                .setTactic('speed')
                .setOutput(size)
        }

        return Kernels._interpolateKernel;
    }

    static rgb(size) {
        const id = Kernels._sid(arguments);
        if (Kernels._rgbKId !== id) {
            Kernels._rgbKId = id;
            Kernels._rbgKernel = Gpu.makeKernel(function (pixels) {
                const p = pixels[this.thread.y][this.thread.x];
                this.color(p[0], p[1], p[2]);
            }).setPipeline(false)
                .setTactic('speed')
                .setOutput(size)
                .setGraphical(true);
        }

        return Kernels._rbgKernel;
    }

    static _sid(args) {
        return [...args].flat().reduce((a, b) => a + b, 0);
    }
}