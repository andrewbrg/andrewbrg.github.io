import 'gpu.js';

const v = require('../functions/vect');

export default class Gpu {
    constructor() {
        this._gpujs = new GPU({mode: 'gpu'});

        this._gpujs.addFunction(v.vecAdd, {returnType: 'Array(3)'});
        this._gpujs.addFunction(v.vecSub, {returnType: 'Array(3)'});
        this._gpujs.addFunction(v.vecScale, {returnType: 'Array(3)'});
        this._gpujs.addFunction(v.vecCross, {returnType: 'Array(3)'});
        this._gpujs.addFunction(v.vecDot, {returnType: 'Float'});
        this._gpujs.addFunction(v.vecUnit, {returnType: 'Array(3)'});
        this._gpujs.addFunction(v.vecLength, {returnType: 'Float'});
        this._gpujs.addFunction(v.vecReflect, {returnType: 'Array(3)'});
        this._gpujs.addFunction(v.vecCast, {returnType: 'Array(3)'});
    }

    static makeKernel(fn) {
        return GpuInstance._gpujs.createKernel(fn);
    }

    static mode(v) {
        if ('undefined' === typeof v) {
            return GpuInstance.mode;
        }

        GpuInstance.mode = v;
    }
}

const GpuInstance = new Gpu();