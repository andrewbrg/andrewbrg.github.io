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
    let a = 1.0 / magnitude;
    return a * ax;
}

function vUnitY(ax, ay, az) {
    let magnitude = Math.sqrt((ax * ax) + (ay * ay) + (az * az));
    let a = 1.0 / magnitude;
    return a * ay;
}

function vUnitZ(ax, ay, az) {
    let magnitude = Math.sqrt((ax * ax) + (ay * ay) + (az * az));
    let a = 1.0 / magnitude;
    return a * az;
}

function vReflectX(ax, ay, az, bx, by, bz) {
    let vecX = ((ax * bx) + (ay * by) + (az * bz)) * bx;
    return (vecX * 2.0) - ax;
}

function vReflectY(ax, ay, az, bx, by, bz) {
    let vecY = ((ax * bx) + (ay * by) + (az * bz)) * by;
    return (vecY * 2.0) - ay;
}

function vReflectZ(ax, ay, az, bx, by, bz) {
    let vecZ = ((ax * bx) + (ay * by) + (az * bz)) * bz;
    return (vecZ * 2.0) - az;
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