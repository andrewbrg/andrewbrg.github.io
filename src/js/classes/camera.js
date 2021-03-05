import Gpu from './gpu';

export default class Camera {
    constructor(fov, point, vector) {
        this.fov = fov;
        this.point = point;
        this.vector = vector;
    }

    generateRays(width, height) {
        const raysKernel = Gpu.makeKernel(function (point, vector, fov, width, height) {

            let eVector = unit(sub(vector, point));
            let eVectorR = unit(cross(eVector, [0, 1, 0]));
            let eVectorU = unit(cross(eVectorR, eVector));

            let halfW = Math.tan((Math.PI * (fov / 2) / 180));
            let halfH = (height / width) * halfW;
            let pxW = (halfW * 2) / (width - 1);
            let pxH = (halfH * 2) / (height - 1);

            return unit(
                add(
                    add(eVector, scale(eVectorR, ((this.thread.x * pxW) - halfW))),
                    scale(eVectorU, ((this.thread.y * pxH) - halfH))
                )
            );
        }).setOutput([width, height]);

        return raysKernel(this.point, this.vector, this.fov, width, height);
    }
}
