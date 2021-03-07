import 'gpu.js';

const v = require('../functions/vector');

export default class Gpu {
    constructor() {
        this._gpujs = new GPU({mode: 'gpu'});

        this._gpujs.addFunction(v.crossX);
        this._gpujs.addFunction(v.crossY);
        this._gpujs.addFunction(v.crossZ);
        this._gpujs.addFunction(v.dot);
        this._gpujs.addFunction(v.len);
        this._gpujs.addFunction(v.unitX);
        this._gpujs.addFunction(v.unitY);
        this._gpujs.addFunction(v.unitZ);
        this._gpujs.addFunction(v.reflectX);
        this._gpujs.addFunction(v.reflectY);
        this._gpujs.addFunction(v.reflectZ);
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