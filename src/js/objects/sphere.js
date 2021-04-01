import Base, {OBJECT_TYPE_SPHERE} from './base';

const h = require('../functions/helper');

export default class Sphere extends Base {
    constructor(point, radius, color, specular) {
        super();
        this.type = OBJECT_TYPE_SPHERE;
        this.ptX = point[0];
        this.ptY = point[1];
        this.ptZ = point[2];

        this.radius = radius;

        this.red = 'undefined' !== typeof color ? color[0] : 1;
        this.green = 'undefined' !== typeof color ? color[1] : 1;
        this.blue = 'undefined' !== typeof color ? color[2] : 1;

        this.specular = 'undefined' !== typeof specular ? specular : 0.5;
    }

    toArray() {
        let base = super.toArray();
        let el = h.padArray([
            this.radius     // 20
        ], 10, -1);
        return base.concat(el);
    }
}