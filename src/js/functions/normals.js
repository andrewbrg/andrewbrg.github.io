function sphereNormalX(iPtX, iPtY, iPtZ, spherePtX, spherePtY, spherePtZ) {
    return vUnitX(iPtX - spherePtX, iPtY - spherePtY, iPtZ - spherePtZ);
}

function sphereNormalY(iPtX, iPtY, iPtZ, spherePtX, spherePtY, spherePtZ) {
    return vUnitY(iPtX - spherePtX, iPtY - spherePtY, iPtZ - spherePtZ);
}

function sphereNormalZ(iPtX, iPtY, iPtZ, spherePtX, spherePtY, spherePtZ) {
    return vUnitZ(iPtX - spherePtX, iPtY - spherePtY, iPtZ - spherePtZ);
}

module.exports = {
    sphereNormalX,
    sphereNormalY,
    sphereNormalZ
};