function crossX(ay, az, by, bz) {
    return (ay * bz) - (az * by);
}

function crossY(ax, az, bx, bz) {
    return (az * bx) - (ax * bz);
}

function crossZ(ax, ay, bx, by) {
    return (ax * by) - (ay * bx);
}

function dot(ax, ay, az, bx, by, bz) {
    return (ax * bx) + (ay * by) + (az * bz);
}

function len(ax, ay, az) {
    return Math.sqrt(dot(ax, ay, az, ax, ay, az));
}

function unitX(ax, ay, az) {
    let magnitude = Math.sqrt((ax * ax) + (ay * ay) + (az * az));
    let div = 1.0 / magnitude;
    return div * ax;
}

function unitY(ax, ay, az) {
    let magnitude = Math.sqrt((ax * ax) + (ay * ay) + (az * az));
    let div = 1.0 / magnitude;
    return div * ay;
}

function unitZ(ax, ay, az) {
    let magnitude = Math.sqrt((ax * ax) + (ay * ay) + (az * az));
    let div = 1.0 / magnitude;
    return div * az;
}

function reflectX(ax, ay, az, bx, by, bz) {
    let V1x = ((ax * bx) + (ay * by) + (az * bz)) * bx;
    return (V1x * 2) - ax;
}

function reflectY(ax, ay, az, bx, by, bz) {
    let V1y = ((ax * bx) + (ay * by) + (az * bz)) * by;
    return (V1y * 2) - ay;
}

function reflectZ(ax, ay, az, bx, by, bz) {
    let V1z = ((ax * bx) + (ay * by) + (az * bz)) * bz;
    return (V1z * 2) - az;
}


module.exports = {
    crossX,
    crossY,
    crossZ,
    dot,
    len,
    unitX,
    unitY,
    unitZ,
    reflectX,
    reflectY,
    reflectZ
};