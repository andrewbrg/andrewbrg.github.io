import Gpu from './gpu';
import {blueNoise} from '../functions/helper';
import {LIGHT_TYPE_POINT, LIGHT_TYPE_SPOT} from '../lights/base';
import {OBJECT_TYPE_PLANE, OBJECT_TYPE_SPHERE} from '../objects/base';

import {sphereNormal} from '../functions/normals'
import {nearestInterSecObj} from '../functions/intersections';
import {vUnit, vCross, vReflect, vDot} from '../functions/vector';
import {interpolate, smoothStep, fresnelAmount} from '../functions/helper';

export default class Kernels {
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

                return [
                    eyeVec[0] + xScaleVecX + yScaleVecX,
                    eyeVec[1] + xScaleVecY + yScaleVecY,
                    eyeVec[2] + xScaleVecZ + yScaleVecZ
                ];
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

                // Ray point
                let rayPt = [pt[0], pt[1], pt[2]];

                // Ray vector (direction)
                let rayVec = rays[y][x];
                let rayVecUnit = vUnit(rayVec[0], rayVec[1], rayVec[2])

                let _depth = 0;
                let oIndexes = [0, 0, 0];
                let colorRGB = [0, 0, 0];

                while (_depth <= depth) {

                    // Look for the nearest object intersection of this ray
                    let interSec = nearestInterSecObj(
                        rayPt[0],
                        rayPt[1],
                        rayPt[2],
                        rayVecUnit[0],
                        rayVecUnit[1],
                        rayVecUnit[2],
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

                    // Calculate the intersection normal
                    let interSecNorm = [0, 0, 0];

                    if (objs[oIndex][0] === this.constants.OBJECT_TYPE_SPHERE) {
                        interSecNorm = sphereNormal(
                            interSec[1],
                            interSec[2],
                            interSec[3],
                            objs[oIndex][1],
                            objs[oIndex][2],
                            objs[oIndex][3]
                        );
                    } else if (objs[oIndex][0] === this.constants.OBJECT_TYPE_PLANE) {
                        interSecNorm = [-objs[oIndex][20], -objs[oIndex][21], -objs[oIndex][22]];
                    }

                    // Add ambient color to each object
                    if (_depth === 0) {
                        colorRGB[0] += objs[oIndex][4] * 0.075;
                        colorRGB[1] += objs[oIndex][5] * 0.075;
                        colorRGB[2] += objs[oIndex][6] * 0.075;
                    }

                    // If object does not support lambertian shading
                    // we stop here and don't re-iterate
                    if (objs[oIndex][8] === 0) {
                        break;
                    }

                    // Lambertian Shading
                    //////////////////////////////////////////////////////////////////
                    for (let i = 0; i < this.constants.LIGHTS_COUNT; i++) {

                        // Find a vector from the intersection point to this light
                        const lightPtX = lights[i][1];
                        const lightPtY = lights[i][2];
                        const lightPtZ = lights[i][3];

                        let toLightVec = vUnit(
                            lightPtX - interSec[1],
                            lightPtY - interSec[2],
                            lightPtZ - interSec[3]
                        );

                        // Transform the light vector into a number of vectors onto a disk
                        // https://blog.demofox.org/2020/05/16/using-blue-noise-for-raytraced-soft-shadows/
                        const crossTan = vCross(
                            toLightVec[0],
                            toLightVec[1],
                            toLightVec[2],
                            0,
                            1,
                            0
                        );
                        const lightTan = vUnit(crossTan[0], crossTan[1], crossTan[2]);

                        const crossBiTan = vCross(
                            lightTan[0],
                            lightTan[1],
                            lightTan[2],
                            toLightVec[0],
                            toLightVec[1],
                            toLightVec[2]
                        )
                        const lightBiTan = vUnit(crossBiTan[0], crossBiTan[1], crossBiTan[2]);

                        let lightContrib = 0;
                        let lightAngle = 1;

                        // Handle spotlights
                        if (this.constants.LIGHT_TYPE_SPOT === lights[i][0]) {
                            lightAngle = smoothStep(
                                lights[i][14],
                                lights[i][13],
                                vDot(
                                    toLightVec[0],
                                    toLightVec[1],
                                    toLightVec[2],
                                    -lights[i][10],
                                    -lights[i][11],
                                    -lights[i][12]
                                )
                            );
                        }

                        // For performance we will reduce the number of shadow rays
                        // on reflections down based on the tracing depth
                        const sRayCount = _depth > 0 ? 1 : shadowRayCount;
                        const sRayDivisor = (1 / sRayCount);

                        // Pick a starting index to select sRayCount
                        // consecutive entries from our blue noise dataset
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

                            toLightVec[0] = toLightVec[0] + (lightTan[0] * diskPtX) + (lightBiTan[0] * diskPtY);
                            toLightVec[1] = toLightVec[1] + (lightTan[1] * diskPtX) + (lightBiTan[1] * diskPtY);
                            toLightVec[2] = toLightVec[2] + (lightTan[2] * diskPtX) + (lightBiTan[2] * diskPtY);

                            toLightVec = vUnit(toLightVec[0], toLightVec[1], toLightVec[2]);

                            // Check if the light is visible from this point
                            const oIntersection = nearestInterSecObj(
                                interSec[1],
                                interSec[2],
                                interSec[3],
                                toLightVec[0],
                                toLightVec[1],
                                toLightVec[2],
                                objs,
                                this.constants.OBJECTS_COUNT
                            );

                            // If the light source is visible from this sample shadow ray
                            // we must see how much light this vector contributes
                            if (oIntersection[0] === -1) {
                                const l = vDot(
                                    toLightVec[0],
                                    toLightVec[1],
                                    toLightVec[2],
                                    interSecNorm[0],
                                    interSecNorm[1],
                                    interSecNorm[2]
                                );

                                if (l >= 0) {
                                    lightContrib += sRayDivisor * l;
                                }
                            }
                        }

                        // Calculate the pixel RGB values for the ray
                        let c =
                            lightContrib *
                            lightAngle *
                            lights[i][7] * // Light intensity
                            objs[oIndex][8]; // Lambert value

                        // Factor in the specular contribution reducing the
                        // amount which can be contributed based on the trace depth
                        for (let j = 1; j <= _depth; j++) {
                            c *= fresnelAmount(
                                1,
                                objs[oIndexes[j - 1]][10], // Refractive index
                                interSecNorm,
                                rayVec,
                                objs[oIndexes[j - 1]][7] // Specular value
                            ) / (j + 1);
                        }

                        colorRGB[0] += objs[oIndex][4] * c * lights[i][4];
                        colorRGB[1] += objs[oIndex][5] * c * lights[i][5];
                        colorRGB[2] += objs[oIndex][6] * c * lights[i][6];
                    }

                    // If object does not support specular shading
                    // we stop here and don't re-iterate
                    if (objs[oIndex][7] === 0) {
                        break;
                    }

                    // Change ray position to our intersection position
                    rayPt = [interSec[1], interSec[2], interSec[3]];

                    // Change ray vector to a reflection of the incident ray around the intersection normal
                    rayVec = -vReflect(
                        rayVec[0],
                        rayVec[1],
                        rayVec[2],
                        interSecNorm[0],
                        interSecNorm[1],
                        interSecNorm[2]
                    );

                    rayVecUnit = vUnit(rayVec[0], rayVec[1], rayVec[2]);

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