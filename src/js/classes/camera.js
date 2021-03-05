import Gpu from './gpu';
import VectorMath from './vector-math';

export default class Camera {
    constructor(fov, point, vector) {
        this.fov = fov;
        this.point = point;
        this.vector = vector;

        this._gpu = Gpu.getInstance()._gpu;
    }

    generateRays(width, height) {
        const raysKernel = this._gpu.createKernel(function (eyeVector, eyeVectorRight, eyeVectorUp, halfW, halfH, pxW, pxH, width, height) {

            for (let i = 0; i < Math.max(width, height); i++) {
                vUnit(
                    vAdd(
                        vAdd(eyeVector, vScale(eyeVectorRight, ((this.thread.x * pxW) - halfW))),
                        vScale(eyeVectorUp, ((this.thread.y * pxH) - halfH))
                    )
                );
            }

            return 1;
        }).setOutput([width, height]);

        let eyeVector = VectorMath.unit(VectorMath.sub(this.vector, this.point));
        let eyeVectorRight = VectorMath.unit(VectorMath.cross(eyeVector, [0, 1, 0]));
        let eyeVectorUp = VectorMath.unit(VectorMath.cross(eyeVectorRight, eyeVector));

        let halfW = Math.tan(Math.PI * (this.fov / 2) / 180);
        let halfH = (height / width) * halfW;
        let pxW = (halfW * 2) / (width - 1);
        let pxH = (halfH * 2) / (height - 1);

        return raysKernel(eyeVector, eyeVectorRight, eyeVectorUp, halfW, halfH, pxW, pxH, width, height);
    }
}
