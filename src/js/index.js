import 'materialize-css';

import Scene from './classes/scene';
import Tracer from './classes/tracer';
import Camera from './classes/camera';

import Sphere from './objects/sphere';
import PointLight from './lights/pointLight';

let camera = new Camera([0, 0, 20], [0, 0, 0]);
let scene = new Scene();

let sphere = new Sphere([0, 0, 0], 5);
sphere.color([200, 40, 120]);
scene.addObject(sphere);

let light = new PointLight([0, 0, 7], [255, 255, 255]);
scene.addLight(light);

let tracer = new Tracer(document.getElementsByClassName('canvas')[0]);
tracer.camera(camera);
tracer.scene(scene);

tracer.fov(45);
tracer.depth(1);

tracer.tick();