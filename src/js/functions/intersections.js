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

    const min = 0.0001;
    const maxDistance = oDistance;

    for (let i = 0; i < objsCount; i++) {
        if (this.constants.OBJECT_TYPE_SPHERE === objs[i][0]) {
            const ptX1 = objs[i][1] - ptX;
            const ptY1 = objs[i][2] - ptY;
            const ptZ1 = objs[i][3] - ptZ;
            const sideLength = vDot(vecX, vecY, vecZ, ptX1, ptY1, ptZ1);

            const discriminant =
                (objs[i][20] * objs[i][20])
                + (sideLength * sideLength)
                - vDot(ptX1, ptY1, ptZ1, ptX1, ptY1, ptZ1);

            distance = (discriminant < 0) ? -1 : sideLength - Math.sqrt(discriminant);
        } else if (this.constants.OBJECT_TYPE_PLANE === objs[i][0]) {
            const deNom = vDot(vecX, vecY, vecZ, objs[i][20], objs[i][21], objs[i][22]);
            if (Math.abs(deNom) !== min) {
                const _distance = vDot(
                    objs[i][1] - ptX,
                    objs[i][2] - ptY,
                    objs[i][3] - ptZ,
                    objs[i][20],
                    objs[i][21],
                    objs[i][22]
                ) / deNom;

                distance = (_distance > 0) ? _distance : -1;
            } else {
                distance = -1;
            }
        }

        if (distance > min && distance < oDistance) {
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

module.exports = {
    nearestInterSecObj
};