import 'materialize-css';

import Tracer from './classes/tracer';
import Camera from './classes/camera';

let tracer = new Tracer(document.getElementsByClassName('canvas')[0]);
let camera = new Camera(50, [0, 0, 25], [0, 0, 0]);

tracer.camera(camera);
tracer.tick();