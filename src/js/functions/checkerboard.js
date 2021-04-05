function uvPatternAt(patternU, patternV, u, v) {
    let u2 = Math.floor(u * patternU);
    let v2 = Math.floor(v * patternV);

    if ((u2 + v2) % 2 === 0) {
        return [0.5, 0.5, 0.5];
    } else {
        return [1, 1, 1];
    }
}

function planarMap(pX, pY, pZ) {
    return [pX % 1, pZ % 1];
}

function sphericalMap(nX, nY, nZ) {
    return [Math.acos(nY) / Math.PI, Math.atan2(nX, nZ) / Math.PI];
}

module.exports = {
    uvPatternAt,
    planarMap,
    sphericalMap
};
