import Gpu from './gpu';

export default class Engine {
    constructor(depth) {
        this.depth = depth;
    }

    renderFrame(camera, scene, rays) {
        let sceneArr = scene.toArray();
        let intersections = this._findObjectIntersections(camera, sceneArr[0], rays);

        console.log(intersections.toArray());
        rays.delete();
    }

    _findObjectIntersections(camera, objects, rays) {
        return Gpu.makeKernel(function (rays, objects) {
            let x = this.thread.x;
            let y = this.thread.y;
            let rayV = rays[y][x];

            let obj = 0;
            let dist = 1e10;

            for (let i = 0; i < this.constants.OBJ_COUNT; i++) {
                let o = objects[i];

                if (1 === o[3]) {
                    let oPoint = o[4];
                    let oRadius = o[5];

                    let eyeToCenterX = oPoint[0] - this.constants.RAY_POINT[0];
                    let eyeToCenterY = oPoint[1] - this.constants.RAY_POINT[1];
                    let eyeToCenterZ = oPoint[2] - this.constants.RAY_POINT[2];

                    let vDotVect = vDot(
                        eyeToCenterX,
                        eyeToCenterY,
                        eyeToCenterZ,
                        rayV[0],
                        rayV[1],
                        rayV[2]
                    );

                    let eDotVect = vDot(
                        eyeToCenterX,
                        eyeToCenterY,
                        eyeToCenterZ,
                        eyeToCenterX,
                        eyeToCenterY,
                        eyeToCenterZ
                    );

                    let discriminant = (oRadius * oRadius) - eDotVect + (vDotVect * vDotVect);
                    if (discriminant > 0) {
                        let d = vDotVect - Math.sqrt(discriminant);
                        if (d < 1e10 && d < dist) {
                            obj = o;
                            dist = d;
                        }
                    }
                }
            }

            return [obj, dist];
        }).setConstants({
            RAY_POINT: camera.point,
            OBJ_COUNT: objects.length,
        }).setPipeline(true).setOutput(rays.output)(rays, objects);
    }
}