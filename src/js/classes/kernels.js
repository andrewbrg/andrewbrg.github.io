import Gpu from './gpu';
import Vector from "./vector";

const {Input} = require('gpu.js');

export default class Kernels {
    constructor() {

    }

    static raysKernel(width, height) {
        return Gpu.makeKernel(function (eyeV, rightV, upV) {
            let x = this.thread.x;
            let y = this.thread.y;

            x = (x * this.constants.PIXEL_W) - this.constants.HALF_W;
            y = (y * this.constants.PIXEL_H) - this.constants.HALF_H;

            let xScaleVx = x * rightV[0];
            let xScaleVy = x * rightV[1];
            let xScaleVz = x * rightV[2];

            let yScaleVx = y * upV[0];
            let yScaleVy = y * upV[1];
            let yScaleVz = y * upV[2];

            let sumVx = eyeV[0] + xScaleVx + yScaleVx;
            let sumVy = eyeV[1] + xScaleVy + yScaleVy;
            let sumVz = eyeV[2] + xScaleVz + yScaleVz;

            let rayVx = vUnitX(sumVx, sumVy, sumVz);
            let rayVy = vUnitY(sumVx, sumVy, sumVz);
            let rayVz = vUnitZ(sumVx, sumVy, sumVz);

            return [rayVx, rayVy, rayVz];
        }).setConstants({
            HALF_W: halfWidth,
            HALF_H: halfHeight,
            PIXEL_W: pixelWidth,
            PIXEL_H: pixelHeight
        }).setPipeline(true).setOutput([width, height]);
    }
}