const v = require('../functions/vector');

export default class Vector {
    static add(a, b) {
        return [
            a[0] + b[0],
            a[1] + b[1],
            a[2] + b[2]
        ];
    }

    static sub(a, b) {
        return [
            a[0] - b[0],
            a[1] - b[1],
            a[2] - b[2]
        ];
    }

    static scale(a, s) {
        return [
            a[0] * s,
            a[1] * s,
            a[2] * s
        ];
    }

    static cross(a, b) {
        return [
            v.vCrossX(a[1], a[2], b[1], b[2]),
            v.vCrossY(a[0], a[2], b[0], b[2]),
            v.vCrossZ(a[0], a[1], b[0], b[1])
        ];
    }

    static dot(a, b) {
        return v.vDot(a[0], a[1], a[2], b[0], b[1], b[2]);
    }

    static unit(a) {
        return [
            v.vUnitX(a[0], a[1], a[2]),
            v.vUnitY(a[0], a[1], a[2]),
            v.vUnitZ(a[0], a[1], a[2])
        ];
    }

    static len(a) {
        return Math.sqrt(Vector.dot(a, a));
    }

    static reflect(a, b) {
        return [
            v.vReflectX(a[0], a[1], a[2], b[0], b[1], b[2]),
            v.vReflectY(a[0], a[1], a[2], b[0], b[1], b[2]),
            v.vReflectZ(a[0], a[1], a[2], b[0], b[1], b[2])
        ];
    }
}