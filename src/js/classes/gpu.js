import 'gpu.js';

const h = require('../functions/helper');
const v = require('../functions/vector');
const n = require('../functions/normals');
const i = require('../functions/intersections');
const c = require('../functions/uvmapping');

export default class Gpu {
    constructor() {
        this._gpujs = new GPU({mode: 'gpu'});

        this._gpujs.addFunction(v.vCrossX);
        this._gpujs.addFunction(v.vCrossY);
        this._gpujs.addFunction(v.vCrossZ);
        this._gpujs.addFunction(v.vCross);
        this._gpujs.addFunction(v.vDot);
        this._gpujs.addFunction(v.vLen);
        this._gpujs.addFunction(v.vUnitX);
        this._gpujs.addFunction(v.vUnitY);
        this._gpujs.addFunction(v.vUnitZ);
        this._gpujs.addFunction(v.vUnit);
        this._gpujs.addFunction(v.vReflectX);
        this._gpujs.addFunction(v.vReflectY);
        this._gpujs.addFunction(v.vReflectZ);
        this._gpujs.addFunction(v.vReflect);

        this._gpujs.addFunction(h.mix);
        this._gpujs.addFunction(h.fresnel);
        this._gpujs.addFunction(h.randomUnitVector);

        this._gpujs.addFunction(i.nearestInterSecObj);

        this._gpujs.addFunction(n.sphereNormal);
        this._gpujs.addFunction(n.capsuleNormal);

        this._gpujs.addFunction(c.uvPatternAt);
        this._gpujs.addFunction(c.uvTextureAt);
        this._gpujs.addFunction(c.planarMap);
        this._gpujs.addFunction(c.sphericalMap);
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