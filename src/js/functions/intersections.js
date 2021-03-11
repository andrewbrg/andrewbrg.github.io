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

            if (distance > -0.005 && distance < oDistance) {
                oIndex = i;
                oDistance = distance
            }
        }

        if (this.constants.OBJECT_TYPE_PLANE === objs[i][0]) {

        }
    }

    if (-1 === oIndex || maxDistance === oDistance) {
        return [-1, 0, 0, 0];
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

    return [-1, 0, 0, 0];
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
    let eyeToCenterX = spherePtX - rayPtX;
    let eyeToCenterY = spherePtY - rayPtY;
    let eyeToCenterZ = spherePtZ - rayPtZ;
    let sideLength = vDot(eyeToCenterX, eyeToCenterY, eyeToCenterZ, rayVecX, rayVecY, rayVecZ);
    let cameraToCenterLength = vDot(eyeToCenterX, eyeToCenterY, eyeToCenterZ, eyeToCenterX, eyeToCenterY, eyeToCenterZ);
    let discriminant = (sphereRadius * sphereRadius) - cameraToCenterLength + (sideLength * sideLength);
    if (discriminant < 0) {
        return -1;
    } else {
        return sideLength - Math.sqrt(discriminant);
    }
}

module.exports = {
    closestObjIntersection,
    sphereIntersection
};