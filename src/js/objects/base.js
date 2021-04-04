const h = require('../functions/helper');

export const OBJECT_TYPE_SPHERE = 1;
export const OBJECT_TYPE_PLANE = 2;
export const OBJECT_TYPE_CAPSULE = 3;

export default class base {
    constructor() {
        this.type = 0;
        this.ptX = 0;
        this.ptY = 0;
        this.ptZ = 0;
        this.red = 1;
        this.green = 1;
        this.blue = 1;
        this.albido = 1;
        this.specular = 0.5;
        this.roughness = 0.2;
        this.transmittance = 0;
        this.refractiveIndex = 1.4;
    }

    position(v) {
        this.ptX = v[0];
        this.ptY = v[1];
        this.ptZ = v[2];
    }

    color(color) {
        this.red = color[0];
        this.green = color[1];
        this.blue = color[2];
    }

    toArray() {
        return h.padArray([
            this.type,                 // 0
            this.ptX,                  // 1
            this.ptY,                  // 2
            this.ptZ,                  // 3
            this.red,                  // 4
            this.green,                // 5
            this.blue,                 // 6
            this.albido,               // 7
            this.specular,             // 8
            this.roughness,            // 9
            this.transmittance,        // 10
            this.refractiveIndex,      // 11
        ], 20, -1);
    }
}