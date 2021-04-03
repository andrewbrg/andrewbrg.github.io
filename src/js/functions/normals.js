import {vUnitX, vUnitY, vUnitZ, vUnit} from './vector';

function sphereNormal(iPtX, iPtY, iPtZ, spherePtX, spherePtY, spherePtZ) {
    return vUnit(iPtX - spherePtX, iPtY - spherePtY, iPtZ - spherePtZ);
}

function sphereNormalX(iPtX, iPtY, iPtZ, spherePtX, spherePtY, spherePtZ) {
    return vUnitX(iPtX - spherePtX, iPtY - spherePtY, iPtZ - spherePtZ);
}

function sphereNormalY(iPtX, iPtY, iPtZ, spherePtX, spherePtY, spherePtZ) {
    return vUnitY(iPtX - spherePtX, iPtY - spherePtY, iPtZ - spherePtZ);
}

function sphereNormalZ(iPtX, iPtY, iPtZ, spherePtX, spherePtY, spherePtZ) {
    return vUnitZ(iPtX - spherePtX, iPtY - spherePtY, iPtZ - spherePtZ);
}

function planeNormal(distance) {

    return vUnit([]);
}

module.exports = {
    sphereNormal,
    sphereNormalX,
    sphereNormalY,
    sphereNormalZ
};