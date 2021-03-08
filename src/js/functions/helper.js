function padArray(array, length, fill) {
    return length > array.length ? array.concat(Array(length - array.length).fill(fill)) : array;
}

module.exports = {
    padArray
};