function padArray(array, length, fill) {
    return length > array.length ? array.concat(Array(length - array.length).fill(fill)) : array;
}

function mix(x1, x2, x3, y1, y2, y3, a) {
    return [
        x1 * (1 - a) + y1 * a,
        x2 * (1 - a) + y2 * a,
        x3 * (1 - a) + y3 * a
    ];
}

function randomUnitVector() {
    const z = Math.random() * 2 - 1;
    const a = Math.random() * (2.0 * Math.PI);
    const r = Math.sqrt(1.0 - z * z);

    return [r * Math.cos(a), r * Math.sin(a), z];
}

function fresnel(
    n1, // refractive index leaving
    n2, // refractive index entering
    normVecX,
    normVecY,
    normVecZ,
    iPtX,
    iPtY,
    iPtZ,
    specular
) {
    // Schlick approximation
    let r0 = (n1 - n2) / (n1 + n2);
    r0 *= r0;

    let cosX = -vDot(iPtX, iPtY, iPtZ, normVecX, normVecY, normVecZ);
    if (n1 > n2) {
        const n = n1 / n2;
        const sinT2 = n * n * (1 - (cosX * cosX));

        // Total internal reflection
        if (sinT2 > 1) {
            return 1;
        }

        cosX = Math.sqrt(1 - sinT2);
    }

    const x = 1 - cosX;
    const ret = r0 + ((1 - r0) * x * x * x * x * x);

    // Adjust reflect multiplier for object reflectivity
    return specular + (1 - specular) * ret;
}

module.exports = {
    padArray,
    mix,
    randomUnitVector,
    fresnel
};