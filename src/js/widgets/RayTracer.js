import ko from 'knockout';

import Scene from '../classes/scene';
import Plane from '../objects/plane';
import Tracer from '../classes/tracer';
import Camera from '../classes/camera';
import Sphere from '../objects/sphere';
import PointLight from '../lights/pointLight';

export default class RayTracer {
    constructor(element) {
        this.element = element;

        this.fps = ko.observable();
        this.fov = ko.observable();
        this.frameTimeMs = ko.observable();
        this.canvasDrawTimeMs = ko.observable();
        this.framesRendered = ko.observable();

        ko.applyBindings(this, element);

        this.tracer = new Tracer(element.getElementsByTagName('canvas')[0]);
        this._buildScene();

        this.tracer.fov(50);
        this.tracer.depth(2);
        this.tracer._tick();

        this.fov.subscribe((val) => {
            this.tracer.fov(val);
        });

        setInterval(() => {
            this.fov(this.tracer.fov());
            this.fps(this.tracer.fps());
            this.frameTimeMs(this.tracer.frameTimeMs());
            this.framesRendered(this.tracer.framesRendered());
            this.canvasDrawTimeMs(this.tracer.canvasDrawTimeMs());
        }, 10);
    }

    _buildScene() {
        let camera = new Camera([0, 2, 20], [0, 0, 0]);
        let scene = new Scene();

        let s1 = new Sphere([0, 0, 0], 3);
        s1.color([0.9, 0.2, 0.2]);
        scene.addObject(s1);

        let s2 = new Sphere([4, 3, 3], 1.5);
        s2.color([0.2, 0.8, 0.2]);
        scene.addObject(s2);

        let p1 = new Plane([0, -4, 0], [0, -1, 0]);
        p1.color([0.6, 0.5, 0.9]);
        p1.specular = 0.05;
        scene.addObject(p1);

        let l1 = new PointLight([0, 7, 5], 1);
        scene.addLight(l1);

        let l2 = new PointLight([-5, 5, 0], 0.3);
        scene.addLight(l2);

        this.tracer.camera(camera);
        this.tracer.scene(scene);
    }

    togglePlay() {
        if (this.tracer.isPlaying()) {
            this.tracer.pause();
        } else {
            this.tracer.play();
        }
    }
}