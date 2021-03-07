export default class PointLight {
    constructor(point, color) {
        this.point = point;
        this.color = color;
    }

    toArray() {
        return [this.point, this.color];
    }
}