import 'gpu.js';

const v = require('../functions/vector');

export default class Gpu {
    constructor() {
        this._gpujs = new GPU({mode: 'gpu'});

        this._gpujs.addFunction(v.vCrossX);
        this._gpujs.addFunction(v.vCrossY);
        this._gpujs.addFunction(v.vCrossZ);
        this._gpujs.addFunction(v.vDot);
        this._gpujs.addFunction(v.vLen);
        this._gpujs.addFunction(v.vUnitX);
        this._gpujs.addFunction(v.vUnitY);
        this._gpujs.addFunction(v.vUnitZ);
        this._gpujs.addFunction(v.vReflectX);
        this._gpujs.addFunction(v.vReflectY);
        this._gpujs.addFunction(v.vReflectZ);
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