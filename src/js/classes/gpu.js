import 'gpu.js';

const h = require('../functions/helper');
const v = require('../functions/vector');
const n = require('../functions/normals');
const i = require('../functions/intersections');

export default class Gpu {
    constructor() {
        this._gpujs = new GPU({mode: 'webgl2'});

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

        this._gpujs.addFunction(h.interpolate);
        this._gpujs.addFunction(h.smoothStep);

        this._gpujs.addFunction(i.nearestInterSecObj);
        this._gpujs.addFunction(i.sphereIntersection);
        this._gpujs.addFunction(i.planeIntersection);

        this._gpujs.addFunction(n.sphereNormalX);
        this._gpujs.addFunction(n.sphereNormalY);
        this._gpujs.addFunction(n.sphereNormalZ);
    }

    static makeKernel(fn) {
        return GpuInstance._gpujs.createKernel(fn);
    }

    static gpuJS() {
        return GpuInstance._gpujs;
    }

    static mode(v) {
        if ('undefined' === typeof v) {
            return GpuInstance.mode;
        }

        GpuInstance.mode = v;
    }

    static canvas(v) {
        if ('undefined' === typeof v) {
            return GpuInstance._gpujs.canvas;
        }

        GpuInstance._gpujs.canvas = v;
        GpuInstance._gpujs.context = v.getContext('webgl2', {antialias: true});
    }
}

const GpuInstance = new Gpu();