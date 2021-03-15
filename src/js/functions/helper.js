function padArray(array, length, fill) {
    return length > array.length ? array.concat(Array(length - array.length).fill(fill)) : array;
}

function interpolate(x, y, a) {
    return x * (1 - a) + y * a;
}

// Credits to https://blog.demofox.org/2020/05/16/using-blue-noise-for-raytraced-soft-shadows/
function blueNoise() {
    return [
        [0.478712, 0.875764],
        [-0.337956, -0.793959],
        [-0.955259, -0.028164],
        [0.864527, 0.325689],
        [0.209342, -0.395657],
        [-0.106779, 0.672585],
        [0.156213, 0.235113],
        [-0.413644, -0.082856],
        [-0.415667, 0.323909],
        [0.141896, -0.939980],
        [0.954932, -0.182516],
        [-0.766184, 0.410799],
        [-0.434912, -0.458845],
        [0.415242, -0.078724],
        [0.728335, -0.491777],
        [-0.058086, -0.066401],
        [0.202990, 0.686837],
        [-0.808362, -0.556402],
        [0.507386, -0.640839],
        [-0.723494, -0.229240],
        [0.489740, 0.317826],
        [-0.622663, 0.765301],
        [-0.010640, 0.929347],
        [0.663146, 0.647618],
        [-0.096674, -0.413835],
        [0.525945, -0.321063],
        [-0.122533, 0.366019],
        [0.195235, -0.687983],
        [-0.563203, 0.098748],
        [0.418563, 0.561335],
        [-0.378595, 0.800367],
        [0.826922, 0.001024],
        [-0.085372, -0.766651],
        [-0.921920, 0.183673],
        [-0.590008, -0.721799],
        [0.167751, -0.164393],
        [0.032961, -0.562530],
        [0.632900, -0.107059],
        [-0.464080, 0.569669],
        [-0.173676, -0.958758],
        [-0.242648, -0.234303],
        [-0.275362, 0.157163],
        [0.382295, -0.795131],
        [0.562955, 0.115562],
        [0.190586, 0.470121],
        [0.770764, -0.297576],
        [0.237281, 0.931050],
        [-0.666642, -0.455871],
        [-0.905649, -0.298379],
        [0.339520, 0.157829],
        [0.701438, -0.704100],
        [-0.062758, 0.160346],
        [-0.220674, 0.957141],
        [0.642692, 0.432706],
        [-0.773390, -0.015272],
        [-0.671467, 0.246880],
        [0.158051, 0.062859],
        [0.806009, 0.527232],
        [-0.057620, -0.247071],
        [0.333436, -0.516710],
        [-0.550658, -0.315773],
        [-0.652078, 0.589846],
        [0.008818, 0.530556],
        [-0.210004, 0.519896]
    ];
}


module.exports = {
    padArray,
    interpolate,
    blueNoise
};