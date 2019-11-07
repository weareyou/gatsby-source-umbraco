const types = []

module.exports = {
  registerType(type) {
    if (types.includes(type)) return
    types.push(type)
  },
  allTypes() {
    return types
  },
}
