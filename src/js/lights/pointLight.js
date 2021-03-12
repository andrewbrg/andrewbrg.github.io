import Base, {LIGHT_TYPE_POINT} from './base';

const h = require('../functions/helper');

export default class PointLight extends Base {
    constructor(point, intensity) {
        super();
        this.type = LIGHT_TYPE_POINT;
        this.x = point[0];
        this.y = point[1];
        this.z = point[2];

        this.intensity = intensity;
    }

    toArray() {
        let base = super.toArray();
        let el = h.padArray([], 5, -1);
        return base.concat(el);
    }
}