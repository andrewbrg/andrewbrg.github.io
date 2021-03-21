function nearestInterSecObj(
    ptX,
    ptY,
    ptZ,
    vecX,
    vecY,
    vecZ,
    objs,
    objsCount
) {
    let oIndex = -1;
    let oDistance = 1e10;
    let distance = 0;
    let maxDistance = oDistance;

    for (let i = 0; i < objsCount; i++) {
        if (this.constants.OBJECT_TYPE_SPHERE === objs[i][0]) {
            distance = sphereIntersection(
                objs[i][1],
                objs[i][2],
                objs[i][3],
                objs[i][20],
                ptX,
                ptY,
                ptZ,
                vecX,
                vecY,
                vecZ
            );
        } else if (this.constants.OBJECT_TYPE_PLANE === objs[i][0]) {
            distance = planeIntersection(
                objs[i][1],
                objs[i][2],
                objs[i][3],
                objs[i][20],
                objs[i][21],
                objs[i][22],
                ptX,
                ptY,
                ptZ,
                vecX,
                vecY,
                vecZ
            );
        }

        if (distance > 0.001 && distance < oDistance) {
            oIndex = i;
            oDistance = distance
        }
    }

    if (-1 === oIndex || maxDistance === oDistance) {
        return [-1, 0, 0, 0];
    }

    return [
        oIndex,
        ptX + (vecX * oDistance),
        ptY + (vecY * oDistance),
        ptZ + (vecZ * oDistance)
    ];
}

function sphereIntersection(
    spherePtX,
    spherePtY,
    spherePtZ,
    sphereRadius,
    rayPtX,
    rayPtY,
    rayPtZ,
    rayVecX,
    rayVecY,
    rayVecZ
) {
    const vecX = spherePtX - rayPtX;
    const vecY = spherePtY - rayPtY;
    const vecZ = spherePtZ - rayPtZ;
    const sideLength = vDot(vecX, vecY, vecZ, rayVecX, rayVecY, rayVecZ);

    const discriminant =
        (sphereRadius * sphereRadius)
        + (sideLength * sideLength)
        - vDot(vecX, vecY, vecZ, vecX, vecY, vecZ);

    return (discriminant < 0) ? -1 : sideLength - Math.sqrt(discriminant);
}

function planeIntersection(
    planePtX,
    planePtY,
    planePtZ,
    normVecX,
    normVecY,
    normVecZ,
    rayPtX,
    rayPtY,
    rayPtZ,
    rayVecX,
    rayVecY,
    rayVecZ
) {
    const deNom = vDot(rayVecX, rayVecY, rayVecZ, normVecX, normVecY, normVecZ);
    if (Math.abs(deNom) > 0.001) {
        const vX = planePtX - rayPtX;
        const vY = planePtY - rayPtY;
        const vZ = planePtZ - rayPtZ;
        const distance = vDot(vX, vY, vZ, normVecX, normVecY, normVecZ) / deNom;
        return distance > 0 ? distance : -1;
    }

    return -1;
}

module.exports = {
    nearestInterSecObj,
    sphereIntersection,
    planeIntersection
};