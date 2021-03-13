const h = require('../functions/helper');

export const LIGHT_TYPE_POINT = 1;
export const LIGHT_TYPE_PLANE = 2;

export default class base {
    constructor() {
        this.type = 0;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.red = 255;
        this.green = 255;
        this.blue = 255;
        this.intensity = 1;
        this.radius = 0.1;
    }

    position(v) {
        this.x = v[0];
        this.y = v[1];
        this.z = v[2];
    }

    color(color) {
        this.red = color[0];
        this.green = color[1];
        this.blue = color[2];
    }

    toArray() {
        return h.padArray([
            this.type,                 // 0
            this.x,                    // 1
            this.y,                    // 2
            this.z,                    // 3
            this.red,                  // 4
            this.green,                // 5
            this.blue,                 // 6
            this.intensity,            // 7
            this.radius                // 8
        ], 10, -1);
    }
}