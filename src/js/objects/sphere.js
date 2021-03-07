import Base, {TYPE_SPHERE} from './base';

export default class Sphere extends Base {
    constructor(point, radius) {
        super();
        this.type = TYPE_SPHERE;
        this.point = point;
        this.radius = radius;
    }

    toArray() {
        let base = super.toArray();
        return base.concat([this.type, this.radius, this.point]);
    }
}