function closestObjIntersection(
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
    let maxDistance = oDistance;
    let std = [-1, 0, 0, 0];

    for (let i = 0; i < objsCount; i++) {
        if (this.constants.OBJECT_TYPE_SPHERE === objs[i][0]) {
            let distance = sphereIntersection(
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

            if (distance > 0.001 && distance < oDistance) {
                oIndex = i;
                oDistance = distance
            }
        }

        if (this.constants.OBJECT_TYPE_PLANE === objs[i][0]) {

        }
    }

    if (-1 === oIndex || maxDistance === oDistance) {
        return std;
    }

    let intersectPtX = ptX + (vecX * oDistance);
    let intersectPtY = ptY + (vecY * oDistance);
    let intersectPtZ = ptZ + (vecZ * oDistance);

    if (this.constants.OBJECT_TYPE_SPHERE === objs[oIndex][0]) {
        return [
            oIndex,
            intersectPtX,
            intersectPtY,
            intersectPtZ
        ];
    }

    if (this.constants.OBJECT_TYPE_PLANE === objs[oIndex][0]) {

    }

    return std;
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
        - vDot(vecX, vecY, vecZ, vecX, vecY, vecZ)
        + (sideLength * sideLength);

    return (discriminant < 0) ? -1 : sideLength - Math.sqrt(discriminant);
}

function planeIntersection(
    normVecX,
    normVecY,
    normVecZ,
    distance,
    rayPtX,
    rayPtY,
    rayPtZ,
    rayVecX,
    rayVecY,
    rayVecZ
) {
    const deNom = vDot(rayVecX, rayVecY, rayVecZ, normVecX, normVecY, normVecZ);
    if (deNom !== 0) {
        const t = -(distance + (rayPtX * normVecX + rayPtY * normVecY + rayPtZ * normVecZ)) / deNom;
        return (t < 0) ? -1 : t;
    }

    return -1;
}

module.exports = {
    closestObjIntersection,
    sphereIntersection,
    planeIntersection
};