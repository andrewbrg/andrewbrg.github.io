export default class base {
    constructor(color, specular, lambert) {
        this.color = color;
        this.specular = specular;
        this.lambert = lambert;
    }

    toArray() {
        return [this.color, this.specular, this.lambert];
    }
}