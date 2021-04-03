import {vUnit, vDot} from './vector';

function sphereNormal(iPtX, iPtY, iPtZ, spherePtX, spherePtY, spherePtZ) {
    return vUnit(iPtX - spherePtX, iPtY - spherePtY, iPtZ - spherePtZ);
}

function capsuleNormal(iPtX, iPtY, iPtZ, capPtX, capPtY, capPtZ, capPtX1, capPtY1, capPtZ1, radius) {
    const ba = [capPtX1 - capPtX, capPtY1 - capPtY, capPtZ1 - capPtZ];
    const pa = [iPtX - capPtX, iPtY - capPtY, iPtZ - capPtZ];

    const baPa = vDot(pa[0], pa[1], pa[2], ba[0], ba[1], ba[2]) / vDot(ba[0], ba[1], ba[2], ba[0], ba[1], ba[2]);
    const h = Math.max(Math.min(baPa, 1), 0);

    return vUnit(
        (pa[0] - (h * ba[0])) / radius,
        (pa[1] - (h * ba[1])) / radius,
        (pa[2] - (h * ba[2])) / radius
    );
}

function planeNormal(normX, normY, normZ) {
    return vUnit(-normX, -normY, -normZ);
}

module.exports = {
    sphereNormal,
    capsuleNormal,
    planeNormal
};