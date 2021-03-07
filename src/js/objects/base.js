export const TYPE_SPHERE = 1;
export const TYPE_PLANE = 2;

export default class base {
    constructor(color = [255, 255, 255], specular = 0.5, lambert = 0.5, opacity = 0) {
        this.color = color;
        this.surface = [specular, lambert, opacity];
    }

    setSurface(specular, lambert, opacity) {
        this.surface = [specular, lambert, opacity];
    }

    setColor(color) {
        this.color = color;
    }

    toArray() {
        return [this.color, this.surface];
    }
}