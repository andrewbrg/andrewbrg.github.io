**RayTracing in JavaScript**

Another simple [ray tracer](https://en.wikipedia.org/wiki/Ray_tracing_(graphics)) written in JavaScript which runs on your GPU in webgl by making use of the [gpu.js](https://gpu.rocks/#/) library.

It currently does lambertian and specular shading and runs in realtime. Different scenes can be configured.

To run the project the `src` directory should be built using webpack with the included makefile then the `dist/index.html` file should be opened in your browser.

To rebuild the `dist` directory once run

```shell
make provision
```

Run the following to rebuild it in realtime as you edit the `src` directory

```shell
make watch
```

![alt text](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 1")