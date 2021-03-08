function closestObjectIntersection(point, vector, objs, objsLen) {
    let oId = -1;
    let oDist = 1e10;

    for (let i = 0; i < objsLen; i++) {
        if (this.constants.OBJECT_TYPE_SPHERE === objs[i][0]) {
            let eyeToCenterX = objs[i][1] - point[0];
            let eyeToCenterY = objs[i][2] - point[1];
            let eyeToCenterZ = objs[i][3] - point[2];

            let vDotV = vDot(
                eyeToCenterX,
                eyeToCenterY,
                eyeToCenterZ,
                vector[0],
                vector[1],
                vector[2]
            );

            let eDotV = vDot(
                eyeToCenterX,
                eyeToCenterY,
                eyeToCenterZ,
                eyeToCenterX,
                eyeToCenterY,
                eyeToCenterZ
            );

            let discriminant = (objs[i][20] * objs[i][20]) - eDotV + (vDotV * vDotV);
            if (discriminant > 0) {
                let distance = vDotV - Math.sqrt(discriminant);
                if (distance > 0 && distance < oDist) {
                    oId = i;
                    oDist = distance
                }
            }
        }

        if (this.constants.OBJECT_TYPE_PLANE === objs[i][0]) {

        }
    }

    if (-1 === oId || 1e10 === oDist) {
        return [-1, -1, -1, -1];
    }

    let intersectPointX = point[0] + (vector[0] * oDist);
    let intersectPointY = point[1] + (vector[1] * oDist);
    let intersectPointZ = point[2] + (vector[2] * oDist);

    if (this.constants.OBJECT_TYPE_SPHERE === objs[oId][0]) {
        return [
            intersectPointX,
            intersectPointY,
            intersectPointZ,
            oId
        ];
    }

    if (this.constants.OBJECT_TYPE_PLANE === objs[oId][0]) {

    }

    return [-1, -1, -1, -1];
}

function sphereNormal(iPointX, iPointY, iPointZ, sPointX, sPointY, sPointZ) {
    let x = iPointX - sPointX;
    let y = iPointY - sPointY;
    let z = iPointZ - sPointZ;

    return [vUnitX(x, y, z), vUnitY(x, y, z), vUnitZ(x, y, z)];
}

module.exports = {
    closestObjectIntersection,
    sphereNormal
};