let instance;

export default class Gpu {
    constructor() {
        this._gpu = new GPU();

        this._gpu.addFunction(function vAdd(a, b) {
            return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
        }, {returnType: 'Array(3)'});

        this._gpu.addFunction(function vSub(a, b) {
            return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
        }, {returnType: 'Array(3)'});

        this._gpu.addFunction(function vScale(a, b) {
            return [a[0] * b, a[1] * b, a[2] * b];
        }, {returnType: 'Array(3)'});

        this._gpu.addFunction(function vCross(a, b) {
            return [(a[1] * b[2]) - (a[2] * b[1]), (a[2] * b[0]) - (a[0] * b[2]), (a[0] * b[1]) - (a[1] * b[0])];
        }, {returnType: 'Array(3)'});

        this._gpu.addFunction(function vDot(a, b) {
            return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
        }, {returnType: 'Number'});

        this._gpu.addFunction(function vUnit(a) {
            return vScale(a, (1 / vLen(a)));
        }, {returnType: 'Array(3)'});

        this._gpu.addFunction(function vLen(a) {
            return Math.sqrt(vDot(a, a));
        }, {returnType: 'Number'});

        this._gpu.addFunction(function vReflect(a, b) {
            return vSub(vScale(vScale(b, vDot(a, b)), 2), a);
        }, {returnType: 'Array(3)'});
    }

    static getInstance() {
        return instance = instance || new Gpu();
    }
}