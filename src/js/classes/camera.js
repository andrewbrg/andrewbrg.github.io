import Gpu from './gpu';
import Vector from './vector';

export default class Camera {
    constructor(fov, location, direction) {
        this.fov = fov;
        this.location = location;
        this.direction = direction;
    }

    generateRays(width, height) {
        let eyeV = Vector.unit(Vector.sub(this.direction, this.location));
        let rightV = Vector.unit(Vector.cross(eyeV, [0, 1, 0]));
        let upV = Vector.unit(Vector.cross(rightV, eyeV));

        let halfWidth = Math.tan((Math.PI * (this.fov / 2) / 180));
        let halfHeight = (height / width) * halfWidth;
        let pixelWidth = (halfWidth * 2) / (width - 1);
        let pixelHeight = (halfHeight * 2) / (height - 1);

        return Gpu.makeKernel(function (eyeV, rightV, upV) {
            let x = this.thread.x;
            let y = this.thread.y;

            x = (x * this.constants.pixelWidth) - this.constants.halfWidth;
            y = (y * this.constants.pixelHeight) - this.constants.halfHeight;

            let xScaleVx = x * rightV[0];
            let xScaleVy = x * rightV[1];
            let xScaleVz = x * rightV[2];

            let yScaleVx = y * upV[0];
            let yScaleVy = y * upV[1];
            let yScaleVz = y * upV[2];

            let sumVx = eyeV[0] + xScaleVx + yScaleVx;
            let sumVy = eyeV[1] + xScaleVy + yScaleVy;
            let sumVz = eyeV[2] + xScaleVz + yScaleVz;

            let rayVx = unitX(sumVx, sumVy, sumVz);
            let rayVy = unitY(sumVx, sumVy, sumVz);
            let rayVz = unitZ(sumVx, sumVy, sumVz);

            return [rayVx, rayVy, rayVz];
        }).setConstants({
            halfWidth: halfWidth,
            halfHeight: halfHeight,
            pixelWidth: pixelWidth,
            pixelHeight: pixelHeight
        }).setOutput([width, height])(eyeV, rightV, upV);
    }
}
