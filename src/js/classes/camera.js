import Gpu from './gpu';

const v = require('../functions/vect');

export default class Camera {
    constructor(fov, location, direction) {
        this.fov = fov;
        this.location = location;
        this.direction = direction;
    }

    generateRays(width, height) {
        let eVector = v.vecUnit(v.vecSub(this.direction, this.location));
        let eVectorR = v.vecUnit(v.vecCross(eVector, [0, 1, 0]));
        let eVectorU = v.vecUnit(v.vecCross(eVectorR, eVector));

        let halfW = Math.tan((Math.PI * (this.fov / 2) / 180));
        let halfH = (height / width) * halfW;
        let pixelW = (halfW * 2) / (width - 1);
        let pixelH = (halfH * 2) / (height - 1);

        return Gpu.makeKernel(function (eVector, eVectorR, eVectorU) {
            let x = (this.thread.x * this.constants.pixelW) - this.constants.halfW;
            let y = (this.thread.y * this.constants.pixelH) - this.constants.halfH;

            return vecUnit(
                vecAdd(
                    vecAdd(eVector, vecScale(eVectorR, x)),
                    vecScale(eVectorU, y)
                )
            );
        }).setConstants({
            halfW: halfW,
            halfH: halfH,
            pixelW: pixelW,
            pixelH: pixelH
        }).setOutput([width, height])(eVector, eVectorR, eVectorU);
    }
}
