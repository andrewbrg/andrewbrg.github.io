import Vector from './vector';
import Kernels from './kernels';

export default class Camera {
    constructor(point, vector, fov) {
        this.point = point;
        this.vector = vector;
        this.fov = fov;
    }

    generateRays(width, height) {
        let eyeV = Vector.unit(Vector.sub(this.vector, this.point));
        let rightV = Vector.unit(Vector.cross(eyeV, [0, 1, 0]));
        let upV = Vector.unit(Vector.cross(rightV, eyeV));

        return Kernels.rays(width, height, this.fov)(eyeV, rightV, upV);
    }
}
