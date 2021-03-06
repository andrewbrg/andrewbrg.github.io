const h = require('../functions/helper');

export const LIGHT_TYPE_POINT = 1;
export const LIGHT_TYPE_SPOT = 2;

export default class base {
    constructor() {
        this.type = 0;
        this.ptX = 0;
        this.ptY = 0;
        this.ptZ = 0;
        this.red = 1;
        this.green = 1;
        this.blue = 1;
        this.intensity = 1;
        this.radius = 0.5;
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
            this.intensity,            // 7
            this.radius                // 8
        ], 10, -1);
    }
}