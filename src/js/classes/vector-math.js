export default class VectorMath {

    static unit(a) {
        return this.scale(a, (1 / this.len(a)));
    }

    static len(a) {
        return Math.sqrt(this.dot(a, a));
    }

    static reflect(a, norm) {
        return this.sub(this.scale(this.scale(norm, this.dot(a, norm)), 2), a);
    }

    static dot(a, b) {
        return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
    }

    static cross(a, b) {
        return [(a[1] * b[2]) - (a[2] * b[1]), (a[2] * b[0]) - (a[0] * b[2]), (a[0] * b[1]) - (a[1] * b[0])];
    }

    static scale(a, s) {
        return [a[0] * s, a[1] * s, a[2] * s];
    }

    static add(a, b) {
        return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    }

    static sub(a, b) {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }
}