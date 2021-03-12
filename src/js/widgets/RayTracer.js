import ko from 'knockout';

import Scene from '../classes/scene';
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
        let camera = new Camera([0, 0, 20], [0, 0, 0]);
        let scene = new Scene();

        let s1 = new Sphere([0, 0, 0], 3);
        s1.color([200, 50, 50]);
        scene.addObject(s1);

        let s2 = new Sphere([4, 3, 3], 1.5);
        s2.color([50, 200, 50]);
        scene.addObject(s2);

        let l1 = new PointLight([0, 4, 5], [255, 255, 255]);
        scene.addLight(l1);

        let l2 = new PointLight([0, 0, 15], [255, 255, 255]);
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