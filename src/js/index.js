import 'materialize-css';

import Scene from './classes/scene';
import Tracer from './classes/tracer';
import Camera from './classes/camera';

import Sphere from './objects/sphere';
import PointLight from './lights/pointLight';

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

let tracer = new Tracer(document.getElementsByClassName('canvas')[0]);
tracer.camera(camera);
tracer.scene(scene);

tracer.fov(45);
tracer.depth(1);

tracer.tick();