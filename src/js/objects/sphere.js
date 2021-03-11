import Base, {OBJECT_TYPE_SPHERE} from './base';

const h = require('../functions/helper');

export default class Sphere extends Base {
    constructor(point, radius) {
        super();
        this.type = OBJECT_TYPE_SPHERE;
        this.ptX = point[0];
        this.ptY = point[1];
        this.ptZ = point[2];

        this.radius = radius;
    }

    toArray() {
        let base = super.toArray();
        let el = h.padArray([
            this.radius     // 20
        ], 10, -1);
        return base.concat(el);
    }
}