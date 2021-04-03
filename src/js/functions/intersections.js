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
        } else if (this.constants.OBJECT_TYPE_CYLINDER === objs[i][0]) {
            const ba = [
                objs[i][21] - objs[i][1],
                objs[i][22] - objs[i][2],
                objs[i][23] - objs[i][3]
            ];

            const oc = [
                ptX - objs[i][1],
                ptY - objs[i][2],
                ptZ - objs[i][3],
            ];

            const baba = vDot(ba[0], ba[1], ba[2], ba[0], ba[1], ba[2]);
            const bard = vDot(ba[0], ba[1], ba[2], vecX, vecY, vecZ);
            const baoc = vDot(ba[0], ba[1], ba[2], oc[0], oc[1], oc[2]);

            const k2 = baba - (bard * bard);
            const k1 = baba * vDot(oc[0], oc[1], oc[2], vecX, vecY, vecZ) - (baoc * bard);
            const k0 = baba * vDot(oc[0], oc[1], oc[2], oc[0], oc[1], oc[2]) - (baoc * baoc) - (objs[i][20] * objs[i][20] * baba);

            let h = k1 * k1 - k2 * k0;
            if (h >= 0.0) {
                h = Math.sqrt(h);
                distance = (-k1 - h) / k2;

                // Body
                const y = baoc + distance * bard;
                if (y > 0.0 && y < baba) {
                    if (distance > min && distance < oDistance) {
                        oInsideHit = false;
                        oIndex = i;
                        oDistance = distance
                    }
                }

                // Top & Bottom
                distance = (((y < 0.0) ? 0.0 : baba) - baoc) / bard;
                if (Math.abs(k1 + k2 * distance) < h) {
                    if (distance > min && distance < oDistance) {
                        oInsideHit = false;
                        oIndex = i;
                        oDistance = distance
                    }
                }
            }
        }
    }

    if (-1 === oIndex || max === oDistance) {
        return [oIndex, oDistance];
    }

    return [
        oIndex,
        oDistance * (oInsideHit ? -1 : 1)
    ];
}

module.exports = {
    nearestInterSecObj
};