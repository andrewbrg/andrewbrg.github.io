import Vector from './vector';
import Kernels from './kernels';

export default class Camera {
    constructor(point, fov = 50) {
        this.point = point;
        this.vector = [point[0], point[1], point[2] - 10];
        this.fov = fov;

        this._movementSpeed = 1;

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
        switch (direction) {
            case 'KeyE':
                this.point[1] += this._movementSpeed;
                this.vector[1] += this._movementSpeed;
                break;
            case 'KeyQ':
                this.point[1] -= this._movementSpeed;
                this.vector[1] -= this._movementSpeed;
                break;
            case 'KeyW':
                this.point[0] += this._eyeVec[0] * this._movementSpeed;
                this.point[2] += this._eyeVec[2] * this._movementSpeed;
                this.vector[0] += this._eyeVec[0] * this._movementSpeed;
                this.vector[2] += this._eyeVec[2] * this._movementSpeed;
                break;
            case 'KeyS':
                this.point[0] -= this._eyeVec[0] * this._movementSpeed;
                this.point[2] -= this._eyeVec[2] * this._movementSpeed;
                this.vector[0] -= this._eyeVec[0] * this._movementSpeed;
                this.vector[2] -= this._eyeVec[2] * this._movementSpeed;
                break;
            case 'KeyA':
                this.point[0] -= this._rVec[0] * this._movementSpeed;
                this.point[2] -= this._rVec[2] * this._movementSpeed;
                this.vector[0] -= this._rVec[0] * this._movementSpeed;
                this.vector[2] -= this._rVec[2] * this._movementSpeed;
                break;
            case 'KeyD':
                this.point[0] += this._rVec[0] * this._movementSpeed;
                this.point[2] += this._rVec[2] * this._movementSpeed;
                this.vector[0] += this._rVec[0] * this._movementSpeed;
                this.vector[2] += this._rVec[2] * this._movementSpeed;
                break;
        }

        window.dispatchEvent(new CustomEvent('rt:camera:updated', {'detail': this}));
    }

    turn(pitch, roll) {
        roll = roll * this._movementSpeed * 1.5;
        pitch = pitch * this._movementSpeed * 1.5;

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

        this.vector = Vector.add([
                Axx * this._eyeVec[0] + Axy * this._eyeVec[1] + Axz * this._eyeVec[2],
                Ayx * this._eyeVec[0] + Ayy * this._eyeVec[1] + Ayz * this._eyeVec[2],
                Azx * this._eyeVec[0] + Azy * this._eyeVec[1] + Azz * this._eyeVec[2]
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
            this._eyeVec = Vector.unit(Vector.sub(this.vector, this.point));
            this._rVec = Vector.unit(Vector.cross(this._eyeVec, [0, 1, 0]));
            this._upVec = Vector.unit(Vector.cross(this._rVec, this._eyeVec));

            this._raysCache = Kernels.rays(width, height, this.fov)(this._eyeVec, this._rVec, this._upVec)
        }

        return this._raysCache;
    }
}
