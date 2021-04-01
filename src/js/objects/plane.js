import Base, {OBJECT_TYPE_PLANE} from './base';

const h = require('../functions/helper');

export default class Plane extends Base {
    constructor(point, normal, color, specular) {
        super();
        this.type = OBJECT_TYPE_PLANE;

        this.ptX = point[0];
        this.ptY = point[1];
        this.ptZ = point[2];

        this.normX = normal[0];
        this.normY = normal[1];
        this.normZ = normal[2];

        this.red = 'undefined' !== typeof color ? color[0] : 1;
        this.green = 'undefined' !== typeof color ? color[1] : 1;
        this.blue = 'undefined' !== typeof color ? color[2] : 1;

        this.specular = 'undefined' !== typeof specular ? specular : 0.5;
    }

    toArray() {
        let base = super.toArray();
        let el = h.padArray([
            this.normX,     // 20
            this.normY,     // 21
            this.normZ      // 22
        ], 10, -1);
        return base.concat(el);
    }
}