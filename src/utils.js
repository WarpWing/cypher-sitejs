/**
 * ## Random
 * Generates a random string with a limit of characters
 * @param {number} chars - The number of characters to generate
 * @returns {string} The generated string
 */
function random (chars) {
    let b = ''
    for (let i = 0; i <= chars - 1; i += 1) {
        b += Math.random().toString(36)
            .replace(/[^a-z,1-9]+/g, '')
            .substr(1, 1)
    }
    return b
}

module.exports = {
    random
}
