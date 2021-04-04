import {vDot} from './vector';

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
    let oDistance = 10e10;
    let oInsideHit = false;

    const min = 0.01;
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
            const a = vDot(vecX, vecY, vecZ, objs[i][1], objs[i][2], objs[i][3]);
            if (a <= 0) {
                const distance = -(vDot(ptX, ptY, ptZ, objs[i][1], objs[i][2], objs[i][3]) + objs[i][20]) / a;
                if (distance >= 0 && distance < oDistance) {
                    oInsideHit = false;
                    oIndex = i;
                    oDistance = distance
                }
            }
        } else if (this.constants.OBJECT_TYPE_CAPSULE === objs[i][0]) {
            const ba = [
                objs[i][21] - objs[i][1],
                objs[i][22] - objs[i][2],
                objs[i][23] - objs[i][3]
            ];

            const oa = [
                ptX - objs[i][1],
                ptY - objs[i][2],
                ptZ - objs[i][3],
            ];

            const baBa = vDot(ba[0], ba[1], ba[2], ba[0], ba[1], ba[2]);
            const baVec = vDot(ba[0], ba[1], ba[2], vecX, vecY, vecZ);
            const baOa = vDot(ba[0], ba[1], ba[2], oa[0], oa[1], oa[2]);
            const vecOa = vDot(vecX, vecY, vecZ, oa[0], oa[1], oa[2]);
            const oaOa = vDot(oa[0], oa[1], oa[2], oa[0], oa[1], oa[2]);

            const radiusSq = objs[i][20] * objs[i][20];

            const a = baBa - baVec * baVec;
            let b = baBa * vecOa - baOa * baVec;
            let c = baBa * oaOa - baOa * baOa - radiusSq * baBa;
            let h = b * b - a * c;
            if (h >= 0) {
                distance = (-b - Math.sqrt(h)) / a;

                // For body
                const y = baOa + distance * baVec;
                if (y > 0 && y < baBa) {
                    if (distance > min && distance < oDistance) {
                        oInsideHit = false;
                        oIndex = i;
                        oDistance = distance
                    }
                }

                // For top and bottom
                const oc = (y <= 0.0) ? oa : [ptX - objs[i][21], ptY - objs[i][22], ptZ - objs[i][23],];
                b = vDot(vecX, vecY, vecZ, oc[0], oc[1], oc[2]);
                c = vDot(oc[0], oc[1], oc[2], oc[0], oc[1], oc[2]) - radiusSq;
                h = b * b - c;

                if (h > 0.0) {
                    distance = -b - Math.sqrt(h);
                    if (distance > min && distance < oDistance) {
                        oInsideHit = false;
                        oIndex = i;
                        oDistance = distance
                    }
                }
            }
        }
    }

    return [
        oIndex,
        oDistance * (oInsideHit ? -1 : 1)
    ];
}

module.exports = {
    nearestInterSecObj
};