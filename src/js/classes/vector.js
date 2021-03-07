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
            v.crossX(a[1], a[2], b[1], b[2]),
            v.crossY(a[0], a[2], b[0], b[2]),
            v.crossZ(a[0], a[1], b[0], b[1])
        ];
    }

    static dot(a, b) {
        return v.dot(a[0], a[1], a[2], b[0], b[1], b[2]);
    }

    static unit(a) {
        return [
            v.unitX(a[0], a[1], a[2]),
            v.unitY(a[0], a[1], a[2]),
            v.unitZ(a[0], a[1], a[2])
        ];
    }

    static len(a) {
        return Math.sqrt(Vector.dot(a, a));
    }

    static reflect(a, b) {
        return [
            v.reflectX(a[0], a[1], a[2], b[0], b[1], b[2]),
            v.reflectY(a[0], a[1], a[2], b[0], b[1], b[2]),
            v.reflectZ(a[0], a[1], a[2], b[0], b[1], b[2])
        ];
    }
}