function padArray(array, length, fill) {
    return length > array.length ? array.concat(Array(length - array.length).fill(fill)) : array;
}

function interpolate(x, y, a) {
    return x * (1 - a) + y * a;
}

function jitter(x, y, z, a) {
    return [x, y, z];
}

// n1 = refractive index leaving
// n2 = refractive index entering
function fresnel(
    n1,
    n2,
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

function smoothStep(min, max, value) {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
}

module.exports = {
    padArray,
    interpolate,
    jitter,
    fresnel,
    smoothStep
};