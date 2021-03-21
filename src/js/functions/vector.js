function vCross(ax, ay, az, bx, by, bz) {
    return [
        (ay * bz) - (az * by),
        (az * bx) - (ax * bz),
        (ax * by) - (ay * bx)
    ];
}

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

function vUnit(ax, ay, az) {
    const magnitude = Math.sqrt((ax * ax) + (ay * ay) + (az * az));
    const a = 1.0 / magnitude;
    return [a * ax, a * ay, a * az];
}

function vUnitX(ax, ay, az) {
    const magnitude = Math.sqrt((ax * ax) + (ay * ay) + (az * az));
    const a = 1.0 / magnitude;
    return a * ax;
}

function vUnitY(ax, ay, az) {
    const magnitude = Math.sqrt((ax * ax) + (ay * ay) + (az * az));
    const a = 1.0 / magnitude;
    return a * ay;
}

function vUnitZ(ax, ay, az) {
    const magnitude = Math.sqrt((ax * ax) + (ay * ay) + (az * az));
    const a = 1.0 / magnitude;
    return a * az;
}

function vReflect(ax, ay, az, bx, by, bz) {
    const dot = vDot(ax, ay, az, bx, by, bz);
    return [
        (dot * bx * 2.0) - ax,
        (dot * by * 2.0) - ay,
        (dot * bz * 2.0) - az,
    ]
}

function vReflectX(ax, ay, az, bx, by, bz) {
    const vecX = vDot(ax, ay, az, bx, by, bz) * bx;
    return (vecX * 2.0) - ax;
}

function vReflectY(ax, ay, az, bx, by, bz) {
    const vecY = vDot(ax, ay, az, bx, by, bz) * by;
    return (vecY * 2.0) - ay;
}

function vReflectZ(ax, ay, az, bx, by, bz) {
    const vecZ = vDot(ax, ay, az, bx, by, bz) * bz;
    return (vecZ * 2.0) - az;
}

module.exports = {
    vCrossX,
    vCrossY,
    vCrossZ,
    vCross,
    vDot,
    vLen,
    vUnitX,
    vUnitY,
    vUnitZ,
    vUnit,
    vReflectX,
    vReflectY,
    vReflectZ,
    vReflect
};