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
    let oInsideHit = false;

    const min = 0.001;
    const max = oDistance;
    let distance = 0;

    for (let i = 0; i < objsCount; i++) {
        if (this.constants.OBJECT_TYPE_SPHERE === objs[i][0]) {
            const ptX1 = ptX - objs[i][1];
            const ptY1 = ptY - objs[i][2];
            const ptZ1 = ptZ - objs[i][3];
            const radiusSq = objs[i][20] * objs[i][20];

            const b = vDot(ptX1, ptY1, ptZ1, vecX, vecY, vecZ);
            const c = vDot(ptX1, ptY1, ptZ1, ptX1, ptY1, ptZ1) - radiusSq;

            if (c <= 0 || b <= 0) {
                const discriminant = (b * b) - c;
                if (discriminant >= 0) {
                    const ds = Math.sqrt(discriminant);
                    distance = -b - ds;
                    if (distance > min && distance < oDistance) {
                        oInsideHit = false;
                        oIndex = i;
                        oDistance = distance
                    }

                    if (distance < 0) {
                        distance = -b + ds;
                        if (distance > min && distance < oDistance) {
                            oInsideHit = true;
                            oIndex = i;
                            oDistance = distance
                        }
                    }
                }
            }
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
                if (distance > min && distance < oDistance) {
                    oInsideHit = false;
                    oIndex = i;
                    oDistance = distance
                }
            }
        }
    }

    if (-1 === oIndex || max === oDistance) {
        return [-1, 0, 0, 0];
    }

    return [
        oIndex,
        (ptX + (vecX * oDistance)) * (oInsideHit ? -1 : 1),
        (ptY + (vecY * oDistance)) * (oInsideHit ? -1 : 1),
        (ptZ + (vecZ * oDistance)) * (oInsideHit ? -1 : 1)
    ];
}

module.exports = {
    nearestInterSecObj
};