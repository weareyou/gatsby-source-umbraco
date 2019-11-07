/**
 * Checks if the value passed is an object
 * @param {*} value
 * @returns {boolean}
 */
exports.isObject = function(value) {
  if (value === null) return false
  if (Array.isArray(value)) return false
  return typeof value === "object"
}

/**
 * Checks if the value passed is an array
 * @param {*} value
 * @returns {boolean}
 */
exports.isArray = function(value) {
  return Array.isArray(value)
}

/**
 * Checks if the value passed is a string
 * @param {*} value
 * @returns {boolean}
 */
exports.isString = function(value) {
  return typeof value === "string"
}

exports.isNumber = function(value) {
  if (isNaN(value)) return false
  if (value == Infinity) return false
  return typeof value === "number"
}
