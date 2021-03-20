__RayTracing in JavaScript__

Another simple [ray tracer](https://en.wikipedia.org/wiki/Ray_tracing_(graphics)) written in JavaScript which runs on your GPU in webgl by making use of the [gpu.js](https://gpu.rocks/#/) library.

It currently does lambertian and specular shading, soft shadows and runs in realtime. There is no opacity implemented yet but different scenes can be configured and run.

**View it online here: [https://andrewbrg.github.io/dist/](https://andrewbrg.github.io/dist/)**

To run the project the `src` directory should be built using webpack with the included makefile then the `dist/index.html` file should be opened in your browser.

To rebuild the `dist` directory once run

```shell
make provision
```

Run the following to rebuild it in realtime as you edit the `src` directory

```shell
make watch
```

![GPU Raytracer](https://raw.githubusercontent.com/andrewbrg/andrewbrg.github.io/main/src/screenshot.png)