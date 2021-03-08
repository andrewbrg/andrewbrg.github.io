import Base, {TYPE_SPHERE} from './base';

export default class Sphere extends Base {
    constructor(point, radius) {
        super();
        this.type = TYPE_SPHERE;
        this.x = point[0];
        this.y = point[1];
        this.z = point[2];
        this.radius = radius;
    }

    toArray() {
        let base = super.toArray();
        let el = this._padArray([this.radius], 10, -1);
        return base.concat(el);
    }
}