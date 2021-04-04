import ko from 'knockout';
import {LIGHT_TYPE_POINT, LIGHT_TYPE_SPOT} from '../lights/base';
import {OBJECT_TYPE_PLANE, OBJECT_TYPE_SPHERE, OBJECT_TYPE_CAPSULE} from '../objects/base';

import Scene from '../classes/scene';
import Tracer from '../classes/tracer';
import Camera from '../classes/camera';

import Plane from '../objects/plane';
import Sphere from '../objects/sphere';
import Capsule from '../objects/capsule';
import PointLight from '../lights/pointLight';

export default class RayTracer {
    constructor(element) {
        this.element = element;

        this.camera = ko.observable(new Camera([0, 4, 17]));
        this.scene = ko.observable(new Scene());

        this.fps = ko.observable();
        this.btnClass = ko.observable();
        this.frameTimeMs = ko.observable();
        this.framesRendered = ko.observable();

        this.fov = ko.observable();
        this.fov.subscribe((val) => {
            this.tracer.fov(parseInt(val));
        });

        this.depth = ko.observable();
        this.depth.subscribe((val) => {
            this.tracer.depth(parseInt(val));
        });

        this.shadowRayCount = ko.observable();
        this.shadowRayCount.subscribe((val) => {
            this.tracer.shadowRays(parseInt(val));
        });

        this.superSampling = ko.observable();
        this.superSampling.subscribe((val) => {
            this.tracer.superSampling(parseFloat(val));
        });

        this.movementSpeed = ko.observable();
        this.movementSpeed.subscribe((val) => {
            this.camera().movementSpeed(parseFloat(val));
        });

        this.lights = ko.observableArray([]);
        this.lights.subscribe((val) => {
            this.scene().lights = val;
        });

        this.objects = ko.observableArray([]);
        this.objects.subscribe((val) => {
            this.scene().objects = val;
        });

        this.btnTxt = ko.observable();
        this.btnTxt.subscribe((val) => {
            this.btnClass('Play' === val ? 'blue' : 'orange');
        });

        M.AutoInit();
        ko.applyBindings(this, element);

        this.tracer = new Tracer(element.getElementsByTagName('canvas')[0]);
        this.tracer.camera(this.camera());
        this.tracer.scene(this.scene());

        this._initScene();
        this._initWidget();

        this.tracer._tick();
    }

    _initWidget() {
        setInterval(() => {
            this.fov(this.tracer.fov());
            this.fps(this.tracer.fps());
            this.frameTimeMs(this.tracer.frameTimeMs());
            this.framesRendered(this.tracer.framesRendered());
            this.depth(this.tracer.depth());
            this.superSampling(this.tracer.superSampling());
            this.shadowRayCount(this.tracer.shadowRays());
            this.movementSpeed(this.camera().movementSpeed());
            this.btnTxt(this.tracer.isPlaying() ? ' Pause' : 'Play');
        }, 10);
    }

    _initScene() {
        this._addObject(new Sphere([-1.75, 3, 0], 3, [1, 1, 1], 0.5, 0));
        this._addObject(new Sphere([3.25, 1.5, 3], 1.5, [0.5, 0.5, 0.8], 0.2));
        this._addObject(new Sphere([0.75, 0.5, 3], 0.5, [0.5, 0.9, 0.5], 0.4));

        this._addObject(new Plane([0, 1, 0], 0.5, [0.8, 0.8, 0.8], 0.2));
        this._addObject(new Plane([0, 0, 1], 10, [0.9, 0.3, 0.6], 0.2));

        this._addObject(new Capsule([2.5, 1, -3], [3, 4, -3], 1, [0.3, 0.7, 0.7], 0.4));
        this._addLight(new PointLight([0, 20, 10], 1));
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

    objectType(object) {
        let type = 'Object';
        switch (object.type) {
            case OBJECT_TYPE_PLANE:
                type = 'Plane';
                break;
            case OBJECT_TYPE_SPHERE:
                type = 'Sphere';
                break;
            case OBJECT_TYPE_CAPSULE:
                type = 'Capsule';
                break;
        }

        return type;
    }

    lightType(light) {
        let type = 'Light';
        switch (light.type) {
            case LIGHT_TYPE_POINT:
                type = 'Point Light';
                break;
            case LIGHT_TYPE_SPOT:
                type = 'Spot Light';
                break;
        }

        return type;
    }

    refresh() {
        window.dispatchEvent(new CustomEvent('rt:scene:updated', {'detail': this.scene()}));
    }

    _addObject(object) {
        this.objects.push(object);
        this.refresh();
    }

    _addLight(light) {
        this.lights.push(light);
        this.refresh();
    }
}