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

        this.camera = ko.observable(new Camera([0, 4, 20]));
        this.scene = ko.observable(new Scene());
        this.lights = ko.observableArray();
        this.objects = ko.observableArray();

        this.fps = ko.observable();
        this.fov = ko.observable();
        this.frameTimeMs = ko.observable();
        this.framesRendered = ko.observable();

        this.depth = ko.observable();
        this.superSampling = ko.observable();
        this.shadowRayCount = ko.observable();
        this.movementSpeed = ko.observable();

        this.btnTxt = ko.observable();
        this.btnClass = ko.observable();

        ko.applyBindings(this, element);
        M.AutoInit();

        this.tracer = new Tracer(element.getElementsByTagName('canvas')[0]);

        this._initScene();
        this._initWidget();

        this.tracer._tick();
    }

    _initWidget() {
        this.fov.subscribe((val) => {
            this.tracer.fov(parseInt(val));
        });

        this.depth.subscribe((val) => {
            this.tracer.depth(parseInt(val));
        });

        this.shadowRayCount.subscribe((val) => {
            this.tracer.shadowRays(parseInt(val));
        });

        this.superSampling.subscribe((val) => {
            this.tracer.superSampling(parseFloat(val));
        });

        this.movementSpeed.subscribe((val) => {
            this.camera().movementSpeed(parseFloat(val));
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
            this.superSampling(this.tracer.superSampling());
            this.shadowRayCount(this.tracer.shadowRays());
            this.movementSpeed(this.camera().movementSpeed());

            this.lights(this.scene().lights);
            this.objects(this.scene().objects);

            this.btnTxt(this.tracer.isPlaying() ? ' Pause' : 'Play');
        }, 10);
    }

    _initScene() {
        let s1 = new Sphere([-1, 3, 0], 3);
        s1.color([1, 1, 1]);
        s1.specular = 0.4;
        this.scene().addObject(s1);

        let s2 = new Sphere([4, 1.5, 3], 1.5);
        s2.color([0.5, 0.3, 0.8]);
        s2.specular = 0.05;
        this.scene().addObject(s2);

        let s3 = new Sphere([1.5, 0.5, 3], 0.5);
        s3.color([0.5, 0.9, 0.5]);
        s3.specular = 0.4;
        this.scene().addObject(s3);

        let p1 = new Plane([0, 0, 0], [0, -1, 0]);
        p1.color([0.8, 0.8, 0.8]);
        p1.specular = 0.2;
        this.scene().addObject(p1);

        let p2 = new Plane([0, 0, -10], [0, 0, -1]);
        p2.color([0.2, 0.3, 0.7]);
        p2.specular = 0.2;
        this.scene().addObject(p2);

        let l1 = new PointLight([5, 20, 10], 1);
        this.scene().addLight(l1);

        this.tracer.camera(this.camera());
        this.tracer.scene(this.scene());
    }

    togglePlay() {
        if (this.tracer.isPlaying()) {
            this.tracer.pause();
        } else {
            this.tracer.play();
        }
    }

    reset() {
        this.camera().reset();
        if (!this.tracer.isPlaying()) {
            this.tracer._tick();
        }
    }
}