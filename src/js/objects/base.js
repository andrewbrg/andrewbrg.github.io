const h = require('../functions/helper');

export const OBJECT_TYPE_SPHERE = 1;
export const OBJECT_TYPE_PLANE = 2;

export default class base {
    constructor() {
        this.type = 0;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.red = 255;
        this.green = 255;
        this.blue = 255;
        this.specular = 0.3;
        this.lambert = 1;
        this.ambient = 0.03;
        this.opacity = 0;
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
            this.specular,             // 7
            this.lambert,              // 8
            this.ambient,              // 9
            this.opacity               // 10
        ], 20, -1);
    }
}