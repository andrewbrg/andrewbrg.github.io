import Vector from './vector';
import Kernels from './kernels';

export default class Camera {
    constructor(point, fov = 50) {
        this.point = point;
        this.vector = [point[0], point[1], point[2] - 10];
        this.fov = fov;

        this._movementSpeed = 0.5;

        this._raysCache = null;
        this._initialStateCache = JSON.parse(JSON.stringify(this));

        window.addEventListener('rt:camera:updated', () => {
            this._clearRaysCache = true;
        }, false);

        window.addEventListener('rt:engine:updated', () => {
            this._clearRaysCache = true;
        }, false);
    }

    reset() {
        const d = JSON.parse(JSON.stringify(this._initialStateCache));

        this.point = d.point;
        this.vector = d.vector;
        this.fov = d.fov;

        window.dispatchEvent(new CustomEvent('rt:camera:updated', {'detail': this}));
    }

    movementSpeed(v) {
        if ('undefined' === typeof v) {
            return this._movementSpeed;
        }
        this._movementSpeed = v;
    }

    move(direction) {
        let f = this._movementSpeed;
        let eyeVec = Vector.unit(Vector.sub(this.vector, this.point));
        let rVec = Vector.unit(Vector.cross(eyeVec, [0, 1, 0]));

        switch (direction) {
            case 'up':
                this.point[1] += f;
                this.vector[1] += f;
                break;
            case 'down':
                this.point[1] -= f;
                this.vector[1] -= f;
                break;
            case 'forward':
                this.point[0] += eyeVec[0] * f;
                this.point[2] += eyeVec[2] * f;
                this.vector[0] += eyeVec[0] * f;
                this.vector[2] += eyeVec[2] * f;
                break;
            case 'backward':
                this.point[0] -= eyeVec[0] * f;
                this.point[2] -= eyeVec[2] * f;
                this.vector[0] -= eyeVec[0] * f;
                this.vector[2] -= eyeVec[2] * f;
                break;
            case 'left':
                this.point[0] -= rVec[0] * f;
                this.point[2] -= rVec[2] * f;
                this.vector[0] -= rVec[0] * f;
                this.vector[2] -= rVec[2] * f;
                break;
            case 'right':
                this.point[0] += rVec[0] * f;
                this.point[2] += rVec[2] * f;
                this.vector[0] += rVec[0] * f;
                this.vector[2] += rVec[2] * f;
                break;
        }

        window.dispatchEvent(new CustomEvent('rt:camera:updated', {'detail': this}));
    }

    turn(pitch, roll) {
        roll = (roll * this._movementSpeed) * 1.5;
        pitch = (pitch * this._movementSpeed) * 1.5;

        if (this.vector[2] >= this.point[2]) {
            roll = -roll;
        }

        const cosA = Math.cos(0);
        const sinA = Math.sin(0);

        const cosB = Math.cos(pitch);
        const sinB = Math.sin(pitch);

        const cosC = Math.cos(roll);
        const sinC = Math.sin(roll);

        const Axx = cosA * cosB;
        const Axy = cosA * sinB * sinC - sinA * cosC;
        const Axz = cosA * sinB * cosC + sinA * sinC;

        const Ayx = sinA * cosB;
        const Ayy = sinA * sinB * sinC + cosA * cosC;
        const Ayz = sinA * sinB * cosC - cosA * sinC;

        const Azx = -sinB;
        const Azy = cosB * sinC;
        const Azz = cosB * cosC;

        const vec = Vector.sub(this.vector, this.point);
        this.vector = Vector.add([
                Axx * vec[0] + Axy * vec[1] + Axz * vec[2],
                Ayx * vec[0] + Ayy * vec[1] + Ayz * vec[2],
                Azx * vec[0] + Azy * vec[1] + Azz * vec[2]
            ],
            this.point
        );

        window.dispatchEvent(new CustomEvent('rt:camera:updated', {'detail': this}));
    }

    generateRays(width, height) {
        if (this._clearRaysCache) {
            this._clearRaysCache = false;
            this._raysCache = null;
        }

        if (!this._raysCache) {
            let eyeVec = Vector.unit(Vector.sub(this.vector, this.point));
            let rVec = Vector.unit(Vector.cross(eyeVec, [0, 1, 0]));
            let upVec = Vector.unit(Vector.cross(rVec, eyeVec));

            this._raysCache = Kernels.rays(width, height, this.fov)(eyeVec, rVec, upVec)
        }

        return this._raysCache;
    }
}
