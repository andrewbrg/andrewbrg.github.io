function sphereNormalX(iPtX, iPtY, iPtZ, spherePtX, spherePtY, spherePtZ) {
    let x = iPtX - spherePtX;
    let y = iPtY - spherePtY;
    let z = iPtZ - spherePtZ;

    return vUnitX(x, y, z);
}

function sphereNormalY(iPtX, iPtY, iPtZ, spherePtX, spherePtY, spherePtZ) {
    let x = iPtX - spherePtX;
    let y = iPtY - spherePtY;
    let z = iPtZ - spherePtZ;

    return vUnitY(x, y, z);
}

function sphereNormalZ(iPtX, iPtY, iPtZ, spherePtX, spherePtY, spherePtZ) {
    let x = iPtX - spherePtX;
    let y = iPtY - spherePtY;
    let z = iPtZ - spherePtZ;

    return vUnitZ(x, y, z);
}

module.exports = {
    sphereNormalX,
    sphereNormalY,
    sphereNormalZ
};