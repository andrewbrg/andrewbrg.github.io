import Base from './base';

export default class Sphere extends Base {
    constructor(color, specular, lambert, point, radius) {
        super(color, specular, lambert);

        this.type = 1;
        this.point = point;
        this.radius = radius;
    }

    toArray() {
        let base = super.toArray()
        return base.concat([this.type, this.point, this.radius]);
    }
}