import Gpu from './gpu';
import {blueNoise} from '../functions/helper';
import {LIGHT_TYPE_POINT, LIGHT_TYPE_SPOT} from '../lights/base';
import {OBJECT_TYPE_PLANE, OBJECT_TYPE_SPHERE} from '../objects/base';

import {interpolate, smoothStep} from '../functions/helper';
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

export default class Kernels  {
    static rays(width, height, fov) {
        const id = `rays${Kernels._sid(arguments)}`;
        if (Kernels._ids[id] !== id) {
            Kernels._ids[id] = id;

            let halfWidth = Math.tan((Math.PI * (fov / 2) / 180));
            let halfHeight = (height / width) * halfWidth;
            let pixelWidth = (halfWidth * 2) / (width - 1);
            let pixelHeight = (halfHeight * 2) / (height - 1);

            Kernels._cache[id] = Gpu.makeKernel(function (eyeVec, rVec, upVec) {
                const x = this.thread.x;
                const y = this.thread.y;
                const z = this.thread.z;

                if (0 !== z) {
                    return [0, 0, 0];
                }

                const x1 = (x * this.constants.PIXEL_W) - this.constants.HALF_W;
                const y1 = (y * this.constants.PIXEL_H) - this.constants.HALF_H;

                const xScaleVecX = x1 * rVec[0];
                const xScaleVecY = x1 * rVec[1];
                const xScaleVecZ = x1 * rVec[2];

                const yScaleVecX = y1 * upVec[0];
                const yScaleVecY = y1 * upVec[1];
                const yScaleVecZ = y1 * upVec[2];

                const rayVecX = eyeVec[0] + xScaleVecX + yScaleVecX;
                const rayVecY = eyeVec[1] + xScaleVecY + yScaleVecY;
                const rayVecZ = eyeVec[2] + xScaleVecZ + yScaleVecZ;

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

        return Kernels._cache[id];
    }

    static shader(size, objsCount, lightsCount, textures) {
        const id = `shader${Kernels._sid(size, objsCount, lightsCount)}`;
        if (Kernels._ids[id] !== id) {
            Kernels._ids[id] = id;
            Kernels._cache[id] = Gpu.makeKernel(function (
                pt,
                rays,
                objs,
                lights,
                depth,
                shadowRayCount
            ) {
                const x = this.thread.x;
                const y = this.thread.y;
                const z = this.thread.z;

                if (0 !== z) {
                    return [0, 0, 0];
                }

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

                        // If object does not support lambertian shading
                        // we stop here and don't re-iterate
                        if (objs[oIndex][8] === 0) {
                            break;
                        }

                        // Find a vector from the intersection point to this light
                        const lightPtX = lights[i][1];
                        const lightPtY = lights[i][2];
                        const lightPtZ = lights[i][3];

                        let toLightVecX = vUnitX(lightPtX - interSecPtX, lightPtY - interSecPtY, lightPtZ - interSecPtZ);
                        let toLightVecY = vUnitY(lightPtX - interSecPtX, lightPtY - interSecPtY, lightPtZ - interSecPtZ);
                        let toLightVecZ = vUnitZ(lightPtX - interSecPtX, lightPtY - interSecPtY, lightPtZ - interSecPtZ);

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

                        let lightContrib = 0;
                        let lightAngle = 1;

                        if (_depth === 0 && this.constants.LIGHT_TYPE_SPOT === lights[i][0]) {
                            const lVecX = lightPtX - interSecPtX;
                            const lVecY = lightPtY - interSecPtY;
                            const lVecZ = lightPtZ - interSecPtZ;

                            lightAngle = smoothStep(
                                lights[i][14],
                                lights[i][13],
                                vDot(
                                    vUnitX(lVecX, lVecY, lVecZ),
                                    vUnitY(lVecX, lVecY, lVecZ),
                                    vUnitZ(lVecX, lVecY, lVecZ),
                                    -lights[i][10],
                                    -lights[i][11],
                                    -lights[i][12]
                                )
                            );
                        }

                        // For performance we will reduce the number of shadow rays
                        // on reflections down based on the tracing depth
                        const sRayCount = Math.max(1, Math.floor(shadowRayCount / (_depth + 1)));
                        const sRayDivisor = (1 / sRayCount);

                        // Pick a starting index to select sRayCount
                        // consecutive entries from our blue noise array
                        const r = Math.floor(Math.random() * (63 - sRayCount));

                        // Prepare rotation theta
                        const theta = Math.random() * 2.0 * Math.PI;
                        const cosTheta = Math.cos(theta);
                        const sinTheta = Math.sin(theta);

                        for (let j = 0; j < sRayCount; j++) {

                            // Increment blue noise index based on ray count
                            const n = j + r;

                            // Find a point on the light disk based on blue noise distribution
                            // and rotate it by theta for more even distribution of samples
                            const diskPtX = ((this.constants.BLUE_NOISE[n][0] * cosTheta) - (this.constants.BLUE_NOISE[n][1] * sinTheta)) * lights[i][8];
                            const diskPtY = ((this.constants.BLUE_NOISE[n][0] * sinTheta) + (this.constants.BLUE_NOISE[n][1] * cosTheta)) * lights[i][8];

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
                                let l = vDot(
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

                        let c =
                            lightContrib *
                            lightAngle *
                            intensity *
                            lambertCoefficient;

                        // Factor in the specular contribution reducing the
                        // amount which can be contributed based on the trace depth
                        for (let j = 1; j <= _depth; j++) {
                            c *= objs[oIndexes[j - 1]][7] * (1 / j);
                        }

                        colorRGB[0] += objs[oIndex][4] * c;
                        colorRGB[1] += objs[oIndex][5] * c;
                        colorRGB[2] += objs[oIndex][6] * c;
                    }

                    // If object does not support specular shading
                    // we stop here and don't re-iterate
                    if (objs[oIndex][7] === 0) {
                        break;
                    }

                    // Change ray position to our intersection position
                    ptX = interSecPtX;
                    ptY = interSecPtY;
                    ptZ = interSecPtZ;

                    const incidentVecX = vecX;
                    const incidentVecY = vecY;
                    const incidentVecZ = vecZ;

                    // Change ray vector to a reflection of the incident ray around the intersection normal
                    vecX = -vReflectX(incidentVecX, incidentVecY, incidentVecZ, interSecNormX, interSecNormY, interSecNormZ);
                    vecY = -vReflectY(incidentVecX, incidentVecY, incidentVecZ, interSecNormX, interSecNormY, interSecNormZ);
                    vecZ = -vReflectZ(incidentVecX, incidentVecY, incidentVecZ, interSecNormX, interSecNormY, interSecNormZ);

                    // Re-iterate according the the number of specular bounces we are doing
                    _depth++;
                }

                return colorRGB;
            }).setConstants({
                BLUE_NOISE: blueNoise(),
                TEXTURES: textures,
                OBJECTS_COUNT: objsCount,
                LIGHTS_COUNT: lightsCount,
                OBJECT_TYPE_SPHERE: OBJECT_TYPE_SPHERE,
                OBJECT_TYPE_PLANE: OBJECT_TYPE_PLANE,
                LIGHT_TYPE_POINT: LIGHT_TYPE_POINT,
                LIGHT_TYPE_SPOT: LIGHT_TYPE_SPOT
            }).setPipeline(true)
                .setTactic('speed')
                .setOutput(size);
        }

        return Kernels._cache[id];
    }

    static interpolateFrames(size) {
        const id = `interpolate${Kernels._sid(arguments)}`;
        if (Kernels._ids[id] !== id) {
            Kernels._ids[id] = id;
            Kernels._cache[id] = Gpu.makeKernel(function (oldPixels, newPixels) {
                const x = this.thread.x;
                const y = this.thread.y;
                const z = this.thread.z;

                if (0 !== z) {
                    return [0, 0, 0];
                }

                const pxNew = newPixels[y][x];
                const pxOld = oldPixels[y][x];

                return [
                    interpolate(pxOld[0], pxNew[0], 0.075),
                    interpolate(pxOld[1], pxNew[1], 0.075),
                    interpolate(pxOld[2], pxNew[2], 0.075),
                ];
            }).setPipeline(true)
                .setImmutable(true)
                .setTactic('speed')
                .setOutput(size)
        }

        return Kernels._cache[id];
    }

    static rgb(size) {
        const id = `rgb${Kernels._sid(arguments)}`;
        if (Kernels._ids[id] !== id) {
            Kernels._ids[id] = id;
            Kernels._cache[id] = Gpu.makeKernel(function (pixels) {
                const x = this.thread.x;
                const y = this.thread.y;
                const z = this.thread.z;

                if (0 !== z) {
                    this.color(0, 0, 0);
                }

                const p = pixels[y][x];
                this.color(p[0], p[1], p[2]);
            }).setPipeline(false)
                .setTactic('speed')
                .setOutput(size)
                .setGraphical(true);
        }

        return Kernels._cache[id];
    }

    static _sid(args) {
        return [...args].flat().reduce((a, b) => a + b, 0);
    }
}

Kernels._ids = [];
Kernels._cache = [];