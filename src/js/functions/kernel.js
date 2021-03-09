function closestObjectIntersection(point, vector, objs, objsLen) {
    let oId = -1;
    let oDist = 1e10;

    for (let i = 0; i < objsLen; i++) {
        if (this.constants.OBJECT_TYPE_SPHERE === objs[i][0]) {
            let ocX = point[0] - objs[i][1];
            let ocY = point[1] - objs[i][2];
            let ocZ = point[2] - objs[i][3];

            let a = vDot(
                vector[0],
                vector[1],
                vector[2],
                vector[0],
                vector[1],
                vector[2]
            );
            let b = 2.0 * vDot(
                ocX,
                ocY,
                ocZ,
                vector[0],
                vector[1],
                vector[2]
            )
            let c = vDot(ocX, ocY, ocZ, ocX, ocY, ocZ) - (objs[i][20] * objs[i][20]);
            let discriminant = (b * b) - (4 * a * c);
            if (discriminant > 0) {
                let distance = (-b - Math.sqrt(discriminant)) / (2.0 * a);
                if (distance > -0.005 && distance < oDist) {
                    oId = i;
                    oDist = distance
                }
            }
        }

        if (this.constants.OBJECT_TYPE_PLANE === objs[i][0]) {

        }
    }

    if (-1 === oId || 1e10 === oDist) {
        return [1e10, 0, 0, 0];
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

    return [1e10, 0, 0, 0];
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