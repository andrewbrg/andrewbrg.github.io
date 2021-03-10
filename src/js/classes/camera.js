import Vector from './vector';
import Kernels from './kernels';

export default class Camera {
    constructor(point, vector, fov) {
        this.point = point;
        this.vector = vector;
        this.fov = fov;

        this._movementSpeed = 1;
    }

    speed(v) {
        if ('undefined' === typeof v) {
            return this._movementSpeed;
        }
        this._movementSpeed = v;
    }

    generateRays(width, height) {
        let eyeVec = Vector.unit(Vector.sub(this.vector, this.point));
        let rVec = Vector.unit(Vector.cross(eyeVec, [0, 1, 0]));
        let upVec = Vector.unit(Vector.cross(rVec, eyeVec));

        return Kernels.rays(width, height, this.fov)(eyeVec, rVec, upVec);
    }
}
