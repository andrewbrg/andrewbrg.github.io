function vecAdd(a, b) {
    return [
        a[0] + b[0],
        a[1] + b[1],
        a[2] + b[2]
    ];
}

function vecSub(a, b) {
    return [
        a[0] - b[0],
        a[1] - b[1],
        a[2] - b[2]
    ];
}

function vecScale(a, s) {
    return [
        a[0] * s,
        a[1] * s,
        a[2] * s
    ];
}

function vecCross(a, b) {
    return [
        (a[1] * b[2]) - (a[2] * b[1]),
        (a[2] * b[0]) - (a[0] * b[2]),
        (a[0] * b[1]) - (a[1] * b[0])
    ];
}

function vecDot(a, b) {
    return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
}

function vecUnit(a) {
    return vecScale(a, (1 / vecLength(a)));
}

function vecLength(a) {
    return Math.sqrt(vecDot(a, a));
}

function vecReflect(a, b) {
    return vecSub(vecScale(vecScale(b, vecDot(a, b)), 2), a);
}

function vecCast(a) {
    return [a[0], a[1], a[2]];
}

module.exports = {vecAdd, vecSub, vecCross, vecDot, vecLength, vecReflect, vecScale, vecUnit, vecCast};