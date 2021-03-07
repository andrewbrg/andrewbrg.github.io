function vCrossX(ay, az, by, bz) {
    return (ay * bz) - (az * by);
}

function vCrossY(ax, az, bx, bz) {
    return (az * bx) - (ax * bz);
}

function vCrossZ(ax, ay, bx, by) {
    return (ax * by) - (ay * bx);
}

function vDot(ax, ay, az, bx, by, bz) {
    return (ax * bx) + (ay * by) + (az * bz);
}

function vLen(ax, ay, az) {
    return Math.sqrt(vDot(ax, ay, az, ax, ay, az));
}

function vUnitX(ax, ay, az) {
    let magnitude = Math.sqrt((ax * ax) + (ay * ay) + (az * az));
    let div = 1.0 / magnitude;
    return div * ax;
}

function vUnitY(ax, ay, az) {
    let magnitude = Math.sqrt((ax * ax) + (ay * ay) + (az * az));
    let div = 1.0 / magnitude;
    return div * ay;
}

function vUnitZ(ax, ay, az) {
    let magnitude = Math.sqrt((ax * ax) + (ay * ay) + (az * az));
    let div = 1.0 / magnitude;
    return div * az;
}

function vReflectX(ax, ay, az, bx, by, bz) {
    let V1x = ((ax * bx) + (ay * by) + (az * bz)) * bx;
    return (V1x * 2) - ax;
}

function vReflectY(ax, ay, az, bx, by, bz) {
    let V1y = ((ax * bx) + (ay * by) + (az * bz)) * by;
    return (V1y * 2) - ay;
}

function vReflectZ(ax, ay, az, bx, by, bz) {
    let V1z = ((ax * bx) + (ay * by) + (az * bz)) * bz;
    return (V1z * 2) - az;
}

module.exports = {
    vCrossX,
    vCrossY,
    vCrossZ,
    vDot,
    vLen,
    vUnitX,
    vUnitY,
    vUnitZ,
    vReflectX,
    vReflectY,
    vReflectZ
};