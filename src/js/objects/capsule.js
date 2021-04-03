import Base, {OBJECT_TYPE_CAPSULE} from './base';

const h = require('../functions/helper');

export default class Capsule extends Base {
    constructor(pointBottom, pointTop, radius, color, specular) {
        super();
        this.type = OBJECT_TYPE_CAPSULE;

        this.ptX = pointBottom[0];
        this.ptY = pointBottom[1];
        this.ptZ = pointBottom[2];

        this.ptX1 = pointTop[0];
        this.ptY1 = pointTop[1];
        this.ptZ1 = pointTop[2];

        this.radius = radius;

        this.red = 'undefined' !== typeof color ? color[0] : 1;
        this.green = 'undefined' !== typeof color ? color[1] : 1;
        this.blue = 'undefined' !== typeof color ? color[2] : 1;

        this.specular = 'undefined' !== typeof specular ? specular : 0.5;
    }

    toArray() {
        let base = super.toArray();
        let el = h.padArray([
            this.radius,     // 20
            this.ptX1,       // 21
            this.ptY1,       // 22
            this.ptZ1,       // 23
        ], 10, -1);
        return base.concat(el);
    }
}