import 'materialize-css';

import Scene from './classes/scene';
import Tracer from './classes/tracer';
import Camera from './classes/camera';

import Sphere from './objects/sphere';
import PointLight from './lights/pointLight';

let camera = new Camera([0, 0, 25], [0, 0, 0]);
let scene = new Scene();

scene.addObject(new Sphere([145, 30, 120], 0.5, 0.5, [0, 0, 0], 13.5));
scene.addLight(new PointLight([0, 10, 10], [255, 255, 255]));

let tracer = new Tracer(document.getElementsByClassName('canvas')[0]);
tracer.camera(camera);
tracer.scene(scene);

tracer.fov(50);
tracer.depth(1);

tracer.tick();