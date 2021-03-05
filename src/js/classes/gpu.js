let GpuInstance;

export default class Gpu {
    constructor() {
        this._gpujs = new GPU({mode: 'webgl2'});

        this._gpujs.addFunction(function add(a, b) {
            return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
        }, {returnType: 'Array(3)'});

        this._gpujs.addFunction(function sub(a, b) {
            return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
        }, {returnType: 'Array(3)'});

        this._gpujs.addFunction(function scale(a, b) {
            return [a[0] * b, a[1] * b, a[2] * b];
        }, {returnType: 'Array(3)'});

        this._gpujs.addFunction(function cross(a, b) {
            return [(a[1] * b[2]) - (a[2] * b[1]), (a[2] * b[0]) - (a[0] * b[2]), (a[0] * b[1]) - (a[1] * b[0])];
        }, {returnType: 'Array(3)'});

        this._gpujs.addFunction(function dot(a, b) {
            return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
        }, {returnType: 'Number'});

        this._gpujs.addFunction(function unit(a) {
            return scale(a, (1 / length(a)));
        }, {returnType: 'Array(3)'});

        this._gpujs.addFunction(function length(a) {
            return Math.sqrt(dot(a, a));
        }, {returnType: 'Number'});

        this._gpujs.addFunction(function reflect(a, b) {
            return sub(scale(scale(b, dot(a, b)), 2), a);
        }, {returnType: 'Array(3)'});
    }

    static makeKernel(fn) {
        GpuInstance = GpuInstance || new Gpu();
        return GpuInstance._gpujs.createKernel(fn);
    }
}