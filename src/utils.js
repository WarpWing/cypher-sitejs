function random (chars) {
  let b = ''
  for (let i = 0; i <= chars - 1; i++) {
    b += Math.random().toString(36).replace(/[^a-z,1-9]+/g, '').substr(1, 1)
  }
  return b
}

module.exports = {
  random
}
