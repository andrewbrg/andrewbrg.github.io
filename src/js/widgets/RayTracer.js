import ko from 'knockout';

import Scene from '../classes/scene';
import Tracer from '../classes/tracer';
import Camera from '../classes/camera';

import Sphere from '../objects/sphere';
import PointLight from '../lights/pointLight';

export default class RayTracer {
    constructor(element) {
        this.element = element;

        this.tracer = new Tracer(element.getElementsByTagName('canvas')[0]);
        this._buildScene();

        this.tracer.fov(45);
        this.tracer.depth(1);
        this.tracer.play();

        this.fps = ko.observable();
        this.frameTimeMs = ko.observable();

        this.fov = ko.observable(this.tracer.fov());
        this.fov.subscribe((val) => {
            this.tracer.fov(val);
        });

        setInterval(() => {
            this.fps(this.tracer.fps());
            this.frameTimeMs(this.tracer.frameTimeMs())
        }, 100);

        ko.applyBindings(this, element);
    }

    _buildScene() {
        let camera = new Camera([0, 0, 20], [0, 0, 0]);
        let scene = new Scene();

        let s1 = new Sphere([0, 0, 0], 3);
        s1.color([200, 40, 120]);
        scene.addObject(s1);

        let s2 = new Sphere([8, 5, 0], 2);
        s2.color([100, 40, 120]);
        scene.addObject(s2);

        let light = new PointLight([0, 4, 5], [255, 255, 255]);
        scene.addLight(light);

        this.tracer.camera(camera);
        this.tracer.scene(scene);
    }
}