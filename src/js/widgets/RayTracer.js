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
        this.framesRendered = ko.observable();

        this.depth = ko.observable();
        this.resScale = ko.observable();
        this.shadowRayCount = ko.observable();

        this.btnTxt = ko.observable();
        this.btnClass = ko.observable();

        ko.applyBindings(this, element);

        this.tracer = new Tracer(element.getElementsByTagName('canvas')[0]);
        this._buildScene();

        this.tracer.fov(50);
        this.tracer._tick();

        this.fov.subscribe((val) => {
            this.tracer.fov(val);
        });

        this.depth.subscribe((val) => {
            this.tracer.depth(val);
        });

        this.shadowRayCount.subscribe((val) => {
            this.tracer.shadowRays(val);
        });

        this.resScale.subscribe((val) => {
            this.tracer.resScale(val);
        });

        this.btnTxt.subscribe((val) => {
            this.btnClass('Play' === val ? 'blue' : 'orange');
        });

        setInterval(() => {
            this.fov(this.tracer.fov());
            this.fps(this.tracer.fps());
            this.frameTimeMs(this.tracer.frameTimeMs());
            this.framesRendered(this.tracer.framesRendered());
            this.depth(this.tracer.depth());
            this.resScale(this.tracer.resScale());
            this.shadowRayCount(this.tracer.shadowRays());

            this.btnTxt(this.tracer.isPlaying() ? ' Pause' : 'Play');
        }, 10);
    }

    _buildScene() {
        let camera = new Camera([0, 8, 20], [0, 0, 0]);
        let scene = new Scene();

        this._c = camera;

        let s1 = new Sphere([0, 3, 0], 3);
        s1.color([1, 1, 1]);
        s1.specular = 0.5;
        scene.addObject(s1);

        let s2 = new Sphere([4, 2, 3], 1.5);
        s2.color([0.5, 0.2, 0.5]);
        s2.specular = 0.01;
        scene.addObject(s2);

        let p1 = new Plane([0, 0, 0], [0, -1, 0]);
        p1.color([0.5, 0.5, 0.9]);
        p1.specular = 0.3;
        scene.addObject(p1);

        let l1 = new PointLight([-5, 14, 18], 1);
        scene.addLight(l1);

        let l2 = new PointLight([10, 4, -5], 0.6);
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

    reset() {
        this.tracer.camera(this._c);
    }
}