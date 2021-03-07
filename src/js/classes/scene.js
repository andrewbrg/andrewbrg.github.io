export default class Scene {
    constructor() {
        this.objects = [];
        this.lights = [];
    }

    addObject(object) {
        this.objects.push(object);
    }

    addLight(light) {
        this.lights.push(light);
    }

    toArray() {
        let result = [];
        let objects = [];
        let lights = [];

        this.objects.forEach((obj) => {
            objects.push(obj.toArray());
        });

        this.lights.forEach((light) => {
            lights.push(light.toArray());
        });

        result.push(objects);
        result.push(lights);

        return result;
    }
}