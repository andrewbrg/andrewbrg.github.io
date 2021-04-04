import Gpu from './gpu';
import {LIGHT_TYPE_POINT, LIGHT_TYPE_SPOT} from '../lights/base';
import {OBJECT_TYPE_PLANE, OBJECT_TYPE_SPHERE, OBJECT_TYPE_CAPSULE} from '../objects/base';

import {sphereNormal, capsuleNormal, planeNormal} from '../functions/normals'
import {nearestInterSecObj} from '../functions/intersections';
import {vUnit, vCross, vReflect, vDot} from '../functions/vector';
import {mix, fresnel, randomUnitVector} from '../functions/helper';

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

                const x1 = (x * this.constants.PIXEL_W) - this.constants.HALF_W;
                const y1 = (y * this.constants.PIXEL_H) - this.constants.HALF_H;

                const vec = [
                    eyeVec[0] + x1 * rVec[0] + y1 * upVec[0],
                    eyeVec[1] + x1 * rVec[1] + y1 * upVec[1],
                    eyeVec[2] + x1 * rVec[2] + y1 * upVec[2]
                ];

                return vUnit(vec[0], vec[1], vec[2]);
            }).setConstants({
                HALF_W: halfWidth,
                HALF_H: halfHeight,
                PIXEL_W: pixelWidth,
                PIXEL_H: pixelHeight
            }).setPipeline(true).setOutput([width, height]);
        }

        return Kernels._cache[id];
    }

    static traceFrame(size, objsCount, lightsCount) {
        const id = `traceFrame${Kernels._sid(arguments)}`;
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

                // Ray point
                let rayPt = [pt[0], pt[1], pt[2]];

                // Ray vector (direction)
                let rayVec = rays[y][x];
                let rayVecUnit = [rayVec[0], rayVec[1], rayVec[2]];

                let _depth = 0;
                let oIndexes = [0, 0, 0, 0];
                let oNormals = [oIndexes, oIndexes, oIndexes, oIndexes];
                let colorRGB = [0, 0, 0];

                while (_depth <= depth) {

                    // Look for the nearest object intersection of this ray
                    const interSec = nearestInterSecObj(
                        rayPt[0],
                        rayPt[1],
                        rayPt[2],
                        rayVecUnit[0],
                        rayVecUnit[1],
                        rayVecUnit[2],
                        objs,
                        this.constants.OBJECTS_COUNT
                    );

                    // If there are no intersections with any objects
                    const oIndex = interSec[0];
                    if (oIndex === -1) {
                        break;
                    }

                    // Store the objects index
                    oIndexes[_depth] = oIndex;

                    const interSecPt = [
                        (rayPt[0] + (rayVecUnit[0] * interSec[1])),
                        (rayPt[1] + (rayVecUnit[1] * interSec[1])),
                        (rayPt[2] + (rayVecUnit[2] * interSec[1]))
                    ]

                    let interSecNorm = [0, 0, 0];
                    if (objs[oIndex][0] === this.constants.OBJECT_TYPE_SPHERE) {
                        interSecNorm = sphereNormal(
                            interSecPt[0],
                            interSecPt[1],
                            interSecPt[2],
                            objs[oIndex][1],
                            objs[oIndex][2],
                            objs[oIndex][3]
                        );
                    } else if (objs[oIndex][0] === this.constants.OBJECT_TYPE_PLANE) {
                        interSecNorm = planeNormal(
                            objs[oIndex][20],
                            objs[oIndex][21],
                            objs[oIndex][22]
                        );
                    } else if (objs[oIndex][0] === this.constants.OBJECT_TYPE_CAPSULE) {
                        interSecNorm = capsuleNormal(
                            interSecPt[0],
                            interSecPt[1],
                            interSecPt[2],
                            objs[oIndex][1],
                            objs[oIndex][2],
                            objs[oIndex][3],
                            objs[oIndex][21],
                            objs[oIndex][22],
                            objs[oIndex][23],
                            objs[oIndex][20]
                        );
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

                        let toLightVecUnit = vUnit(
                            lightPtX - interSecPt[0],
                            lightPtY - interSecPt[1],
                            lightPtZ - interSecPt[2]
                        );

                        let lightContrib = 0;

                        // Handle spotlights
                        let lightAngleContrib = 1;
                        if (this.constants.LIGHT_TYPE_SPOT === lights[i][0]) {
                            lightAngleContrib = smoothstep(
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

                        const lightRVec = vCross(
                            toLightVecUnit[0],
                            toLightVecUnit[1],
                            toLightVecUnit[2],
                            0,
                            1,
                            0
                        );
                        const lightRVecUnit = vUnit(lightRVec[0], lightRVec[1], lightRVec[2]);

                        const lightUpVec = vCross(
                            lightRVecUnit[0],
                            lightRVecUnit[1],
                            lightRVecUnit[2],
                            toLightVecUnit[0],
                            toLightVecUnit[1],
                            toLightVecUnit[2]
                        );
                        const lightUpVecUnit = vUnit(lightUpVec[0], lightUpVec[1], lightUpVec[2]);

                        for (let j = 0; j < sRayCount; j++) {

                            // Transform the light vector into a random vector
                            // onto a disk with maximum radius equal to the light radius
                            // and rotate the point around the disk center by a random amount up to 360 degrees
                            const ptRadius = lights[i][8] * Math.random();
                            const ptAngle = Math.random() * 360;
                            const diskPt = [ptRadius * Math.cos(ptAngle), ptRadius * Math.sin(ptAngle)];

                            toLightVecUnit = vUnit(
                                toLightVecUnit[0] + (lightRVecUnit[0] * diskPt[0]) + (lightUpVecUnit[0] * diskPt[1]),
                                toLightVecUnit[1] + (lightRVecUnit[1] * diskPt[0]) + (lightUpVecUnit[1] * diskPt[1]),
                                toLightVecUnit[2] + (lightRVecUnit[2] * diskPt[0]) + (lightUpVecUnit[2] * diskPt[1])
                            );

                            // Check if the light is visible from this new point
                            const oIntersection = nearestInterSecObj(
                                interSecPt[0],
                                interSecPt[1],
                                interSecPt[2],
                                toLightVecUnit[0],
                                toLightVecUnit[1],
                                toLightVecUnit[2],
                                objs,
                                this.constants.OBJECTS_COUNT
                            );

                            // If the light source is visible from this shadow ray
                            // we must see how much light this vector contributes to the total
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

                        // Factor in the lambertian component
                        let c = lightContrib * lightAngleContrib * lights[i][7] * objs[oIndex][7];

                        // Factor in the specular component
                        if (_depth > 0) {
                            const j = _depth - 1;

                            let specular = 1;
                            for (let k = j; k >= 0; k--) {
                                specular *= objs[oIndexes[k]][8];
                            }

                            // Multiply the specular component by the
                            // fresnel factor at the point of intersection
                            c *= fresnel(
                                1,
                                objs[oIndexes[j]][11],
                                oNormals[j][0],
                                oNormals[j][1],
                                oNormals[j][2],
                                -rayVecUnit[0],
                                -rayVecUnit[1],
                                -rayVecUnit[2],
                                specular / _depth
                            );
                        }

                        // Apply the final pixel RGB
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
                    rayPt = [interSecPt[0], interSecPt[1], interSecPt[2]];

                    // Change ray vector to a reflection of the incident ray around the intersection normal
                    rayVec = vReflect(
                        rayVecUnit[0],
                        rayVecUnit[1],
                        rayVecUnit[2],
                        interSecNorm[0],
                        interSecNorm[1],
                        interSecNorm[2]
                    );

                    // Add roughness to specular ray by shifting it by a
                    // random amount with a magnitude proportional to it's roughness
                    if (objs[oIndex][9] > 0) {
                        const r = randomUnitVector();
                        const diffuseRayDir = vUnit(
                            interSecNorm[0] + r[0],
                            interSecNorm[1] + r[1],
                            interSecNorm[2] + r[2],
                        );

                        rayVec = mix(
                            rayVec[0],
                            rayVec[1],
                            rayVec[2],
                            diffuseRayDir[0],
                            diffuseRayDir[1],
                            diffuseRayDir[2],
                            objs[oIndex][9] * objs[oIndex][9]
                        );
                    }

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
                OBJECT_TYPE_CAPSULE: OBJECT_TYPE_CAPSULE,
                LIGHT_TYPE_POINT: LIGHT_TYPE_POINT,
                LIGHT_TYPE_SPOT: LIGHT_TYPE_SPOT
            }).setPipeline(true).setImmutable(true).setOutput(size);
        }

        return Kernels._cache[id];
    }

    static interpolateFrames(size) {
        const id = `interpolate${Kernels._sid(arguments)}`;
        if (Kernels._ids[id] !== id) {
            Kernels._ids[id] = id;
            Kernels._cache[id] = Gpu.makeKernel(function (oldPixels, newPixels, i) {
                const x = this.thread.x;
                const y = this.thread.y;

                const pxNew = newPixels[y][x];
                const pxOld = oldPixels[y][x];

                return mix(pxOld[0], pxOld[1], pxOld[2], pxNew[0], pxNew[1], pxNew[2], i);
            }).setPipeline(true).setImmutable(true).setOutput(size)
        }

        return Kernels._cache[id];
    }

    static drawFrame(size) {
        const id = `drawFrame${Kernels._sid(arguments)}`;
        if (Kernels._ids[id] !== id) {
            Kernels._ids[id] = id;
            Kernels._cache[id] = Gpu.makeKernel(function (pixels) {
                const x = this.thread.x;
                const y = this.thread.y;

                const p = pixels[y][x];
                this.color(p[0], p[1], p[2]);
            }).setOutput(size).setGraphical(true);
        }

        return Kernels._cache[id];
    }

    static _sid(args) {
        return [...args].flat().reduce((a, b) => a + b, 0);
    }
}

Kernels._ids = [];
Kernels._cache = [];