const { isString, isNumber, isArray, isObject } = require("../util/typecheck")
const formatMessage = require("../util/formatMessage")
const getGatsbyReferenceKey = require("../util/getGatsbyReferenceKey")

module.exports = (helpers, fields) => {
  helpers.gatsby.reporter.verbose(
    formatMessage(`Looking for foreign key fields on node`)
  )
  return handleForeignKeyFieldsOnObject(helpers, (object = fields))
}

/**
 * Transform all foreign key (FK) fields to Gatsby relational fields for an object.
 *
 * For all keys that end in the FK suffix (configured as foreignKeySuffx) the
 * ID is transformed into a Gatsby ID. The field is then replaced with a Gatsby
 * foreign key field.
 *
 * Arrays of FK ids are also supported, every item of an array in a FK field
 * is transformed into a Gatsby ID.
 *
 * This function also checks nested objects, and objects in nested arrays, to
 * make sure all FK fields are transformed.
 *
 * @param {*} helpers
 * @param {Object} object
 */
function handleForeignKeyFieldsOnObject(helpers, object) {
  const foreignKeySuffix = helpers.options.foreignKeySuffix
  const obj = { ...object }
  const entries = Object.entries(obj)

  for (const [key, value] of entries) {
    if (key.endsWith(foreignKeySuffix)) {
      handleForeignKeyFieldInObject(helpers, obj, key)
    } else if (isObject(value)) {
      obj[key] = handleForeignKeyFieldsOnObject(helpers, (object = value))
    } else if (isArray(value)) {
      obj[key] = handleForeignKeyFieldsForArray(helpers, (array = value))
    }
  }

  return obj
}

/**
 * Transform FK fields for objects in an array.
 *
 * @param {*} helpers
 * @param {Array} array
 */
function handleForeignKeyFieldsForArray(helpers, array) {
  const newArray = []

  for (const value of array) {
    let newValue = value
    if (isObject(value)) {
      newValue = handleForeignKeyFieldsOnObject(helpers, (object = value))
    }
    else if (isArray(value)) {
      newValue = handleForeignKeyFieldsForArray(helpers, (array = value))
    }
    newArray.push(newValue)
  }

  return newArray
}

/**
 * Replace a FK field with a Gatsby FK field, transforming the id(s)
 * with Gatsby id(s).
 *
 * @param {*} helpers
 * @param {Object} object
 * @param {String} key key of the FK field
 */
function handleForeignKeyFieldInObject(helpers, object, key) {
  const { gatsby, options } = helpers
  const value = object[key]
  let replacement

  if (isIdType(value)) {
    gatsby.reporter.verbose(
      formatMessage(
        `Handling foreign key field (key: "${key}", value: "${value}")`
      )
    )
    replacement = gatsby.createNodeId(value)
  } else if (isArray(value) && value.every(isIdType)) {
    gatsby.reporter.verbose(
      formatMessage(
        `Handling foreign key array (key: "${key}", value: ${JSON.stringify(
          value
        )})`
      )
    )
    replacement = value.map(id => gatsby.createNodeId(id))
  } else {
    panicOnInvalidForeignKeyType(helpers, key, value)
  }

  delete object[key]
  const referenceKey = getGatsbyReferenceKey(key, options.foreignKeySuffix)
  object[referenceKey] = replacement
}

/**
 * Stop the build with an error message regarding invalid type in
 * FK field/array.
 *
 * @param {*} helpers
 * @param {String} key
 * @param {*} value
 */
function panicOnInvalidForeignKeyType({ gatsby }, key, value) {
  let wrongTypeValue = value
  if (isArray(value)) wrongTypeValue = value.filter(x => !isIdType(x)).shift()
  const type = Object.prototype.toString.call(wrongTypeValue)

  const message = formatMessage(
    `Encountered invalid type in foreign key ${
      isArray(value) ? `array` : `field`
    }:`,
    ``,
    `key: ${key}`,
    `invalid value: ${JSON.stringify(wrongTypeValue)}`,
    `invalid type: ${type}`
  )

  gatsby.reporter.panic(message)
}

function isIdType(value) {
  return isString(value) || isNumber(value)
}
