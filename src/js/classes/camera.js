import Vector from './vector';
import Kernels from './kernels';

export default class Camera {
    constructor(point, vector, fov = 50) {
        this.point = point;
        this.vector = vector;
        this.fov = fov;

        this._raysCache = null;
        this._mousePos = [0, 0];
        this._movementSpeed = 1;

        this._deepCopy = JSON.parse(JSON.stringify(this));

        window.addEventListener('rt:camera:updated', () => {
            this._raysCache = null;
        }, false);
    }

    reset() {
        const d = JSON.parse(JSON.stringify(this._deepCopy));

        this.point = d.point;
        this.vector = d.vector;
        this.fov = d.fov;

        window.dispatchEvent(new Event('rt:camera:updated'));
    }

    speed(v) {
        if ('undefined' === typeof v) {
            return this._movementSpeed;
        }
        this._movementSpeed = v;
    }

    isMoving() {
        return this._mousePos[0] !== 0 || this._mousePos[1] !== 0;
    }

    generateRays(width, height) {
        if (this.isMoving()) {
            window.dispatchEvent(new Event('rt:camera:updated'));
            this._raysCache = null;
        }

        if (this._raysCache) {
            return this._raysCache;
        }

        this.vector[0] += this._mousePos[0];
        this.vector[1] -= this._mousePos[1];

        let eyeVec = Vector.unit(Vector.sub(this.vector, this.point));
        let rVec = Vector.unit(Vector.cross(eyeVec, [0, 1, 0]));
        let upVec = Vector.unit(Vector.cross(rVec, eyeVec));

        this._raysCache = Kernels.rays(width, height, this.fov)(eyeVec, rVec, upVec)
        return this._raysCache;
    }
}
