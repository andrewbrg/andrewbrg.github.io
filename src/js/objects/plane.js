import Base, {OBJECT_TYPE_PLANE} from './base';

const h = require('../functions/helper');

export default class Plane extends Base {
    constructor(normal, distance, color, specular, roughness) {
        super();
        this.type = OBJECT_TYPE_PLANE;

        this.ptX = normal[0];
        this.ptY = normal[1];
        this.ptZ = normal[2];

        this.distance = distance;
        this.checkerboard = 0;

        this.red = 'undefined' !== typeof color ? color[0] : 1;
        this.green = 'undefined' !== typeof color ? color[1] : 1;
        this.blue = 'undefined' !== typeof color ? color[2] : 1;

        this.specular = 'undefined' !== typeof specular ? specular : 0.5;
        this.roughness = 'undefined' !== typeof roughness ? roughness : 0.2;
    }

    toArray() {
        let base = super.toArray();
        let el = h.padArray([
            this.distance,      // 20
        ], 10, -1);
        return base.concat(el);
    }
}