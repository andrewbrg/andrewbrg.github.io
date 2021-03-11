import Base, {OBJECT_TYPE_PLANE} from './base';

const h = require('../functions/helper');

export default class Plane extends Base {
    constructor(point, normal) {
        super();
        this.type = OBJECT_TYPE_PLANE;

        this.ptX = point[0];
        this.ptY = point[1];
        this.ptZ = point[2];

        this.normX = normal[0];
        this.normY = normal[1];
        this.normZ = normal[2];
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