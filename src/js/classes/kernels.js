import Gpu from './gpu';
import {LIGHT_TYPE_POINT, LIGHT_TYPE_SPOT} from '../lights/base';
import {OBJECT_TYPE_PLANE, OBJECT_TYPE_SPHERE} from '../objects/base';

import {sphereNormal} from '../functions/normals'
import {nearestInterSecObj} from '../functions/intersections';
import {vUnit, vCross, vReflect, vDot} from '../functions/vector';
import {interpolate, smoothStep, fresnel} from '../functions/helper';

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

    static shader(size, objsCount, lightsCount) {
        const id = `shader${Kernels._sid(arguments)}`;
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
                let oIndexes = [0, 0, 0, 0];
                let oNormals = [oIndexes, oIndexes, oIndexes, oIndexes];
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

                    // Store the objects index
                    const oIndex = interSec[0];
                    oIndexes[_depth] = oIndex;

                    // If there are no intersections with any objects
                    if (oIndex === -1) {
                        break;
                    }

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

                    oNormals[_depth][0] = interSecNorm[0];
                    oNormals[_depth][1] = interSecNorm[1];
                    oNormals[_depth][2] = interSecNorm[2];

                    // Add ambient color to each object
                    if (_depth === 0) {
                        colorRGB[0] += objs[oIndex][4] * 0.075;
                        colorRGB[1] += objs[oIndex][5] * 0.075;
                        colorRGB[2] += objs[oIndex][6] * 0.075;
                    }

                    // Lambertian Shading
                    //////////////////////////////////////////////////////////////////
                    for (let i = 0; i < this.constants.LIGHTS_COUNT; i++) {

                        // Find a vector from the intersection point to this light
                        const lightPtX = lights[i][1];
                        const lightPtY = lights[i][2];
                        const lightPtZ = lights[i][3];

                        let toLightVec = [
                            lightPtX - interSec[1],
                            lightPtY - interSec[2],
                            lightPtZ - interSec[3]
                        ];

                        let toLightVecUnit = vUnit(toLightVec[0], toLightVec[1], toLightVec[2]);

                        let lightContrib = 0;
                        let lightAngle = 1;

                        // Handle spotlights
                        if (this.constants.LIGHT_TYPE_SPOT === lights[i][0]) {
                            lightAngle = smoothStep(
                                lights[i][14],
                                lights[i][13],
                                vDot(
                                    toLightVecUnit[0],
                                    toLightVecUnit[1],
                                    toLightVecUnit[2],
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

                        // Transform the light vector into a number of vectors onto a disk
                        const ptRadius = lights[i][8] * Math.sqrt(Math.random());
                        const ptAngle = Math.random() * 2.0 * Math.PI;
                        const diskPt = [
                            ptRadius * Math.cos(ptAngle),
                            ptRadius * Math.sin(ptAngle)
                        ];

                        const crossTan = vCross(toLightVecUnit[0], toLightVecUnit[1], toLightVecUnit[2], 0, 1, 0);
                        const lightTan = vUnit(crossTan[0], crossTan[1], crossTan[2]);

                        const crossBiTan = vCross(lightTan[0], lightTan[1], lightTan[2], toLightVecUnit[0], toLightVecUnit[1], toLightVecUnit[2])
                        const lightBiTan = vUnit(crossBiTan[0], crossBiTan[1], crossBiTan[2]);

                        toLightVec = [
                            toLightVecUnit[0] + lightTan[0] * diskPt[0] + lightBiTan[0] * diskPt[1],
                            toLightVecUnit[1] + lightTan[1] * diskPt[0] + lightBiTan[1] * diskPt[1],
                            toLightVecUnit[2] + lightTan[2] * diskPt[0] + lightBiTan[2] * diskPt[1]
                        ];

                        toLightVecUnit = vUnit(toLightVec[0], toLightVec[1], toLightVec[2]);

                        for (let j = 0; j < sRayCount; j++) {

                            // Check if the light is visible from this point
                            const oIntersection = nearestInterSecObj(
                                interSec[1],
                                interSec[2],
                                interSec[3],
                                toLightVecUnit[0],
                                toLightVecUnit[1],
                                toLightVecUnit[2],
                                objs,
                                this.constants.OBJECTS_COUNT
                            );

                            // If the light source is visible from this sample shadow ray
                            // we must see how much light this vector contributes
                            if (oIntersection[0] === -1) {
                                const l = vDot(
                                    toLightVecUnit[0],
                                    toLightVecUnit[1],
                                    toLightVecUnit[2],
                                    interSecNorm[0],
                                    interSecNorm[1],
                                    interSecNorm[2]
                                );

                                if (l >= 0) {
                                    lightContrib += sRayDivisor * l;
                                }
                            }
                        }

                        // Calculate the lambertian RGB values for the pixel
                        let c = lightContrib * lightAngle * lights[i][7] * objs[oIndex][7];

                        // Factor in the specular contribution
                        if (_depth > 0) {
                            const j = _depth - 1;
                            c *= fresnel(
                                1,
                                objs[oIndexes[j]][10], // Refractive index
                                oNormals[j][0],
                                oNormals[j][1],
                                oNormals[j][2],
                                -rayVecUnit[0],
                                -rayVecUnit[1],
                                -rayVecUnit[2],
                                objs[oIndexes[j]][8] / _depth
                            );
                        }

                        colorRGB[0] += objs[oIndex][4] * lights[i][4] * c;
                        colorRGB[1] += objs[oIndex][5] * lights[i][5] * c;
                        colorRGB[2] += objs[oIndex][6] * lights[i][6] * c;
                    }

                    // If object does not support specular shading
                    // we stop here and don't re-iterate
                    if (objs[oIndex][8] === 0) {
                        break;
                    }

                    // Change ray position to our intersection position
                    rayPt = [interSec[1], interSec[2], interSec[3]];

                    // Change ray vector to a reflection of the incident ray around the intersection normal
                    rayVec = vReflect(
                        rayVecUnit[0],
                        rayVecUnit[1],
                        rayVecUnit[2],
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
                    interpolate(pxOld[0], pxNew[0], 0.05),
                    interpolate(pxOld[1], pxNew[1], 0.05),
                    interpolate(pxOld[2], pxNew[2], 0.05),
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