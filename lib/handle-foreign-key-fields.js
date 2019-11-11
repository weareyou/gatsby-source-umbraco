const { isString, isNumber, isArray, isObject } = require('../util/typecheck')

module.exports = (helpers, fields) => {
  return handleForeignKeyFieldsOnObject(helpers, object = fields)
}

function handleForeignKeyFieldsOnObject(helpers, object) {
  const foreignKeySuffix = "___ID"
  const obj = { ...object }
  const entries = Object.entries(obj)
  
  for (const [key, value] of entries) {
    if (key.endsWith(foreignKeySuffix)) {
      if (isIdType(value)) {
        const id = helpers.gatsby.createNodeId(value)
        delete obj[key]
        obj[getGatsbyReferenceKey(key, foreignKeySuffix)] = id
      }
        // panic if the FK field contains something that can't be an ID
      else if (isArray(value) && value.every(isIdType)) {
        const ids = value.map(id => helpers.gatsby.createNodeId(id))
        delete obj[key]
        obj[getGatsbyReferenceKey(key, foreignKeySuffix)] = ids
      }
    }
    else if (isObject(value)) {
      obj[key] = handleForeignKeyFieldsOnObject(helpers, object = value)
    }
    else if (isArray(value)) {
      obj[key] = handleForeignKeyFieldsForArray(helpers, array = value)
    }
    // TODO panic if the FK field contains something that can't be an ID
    // Maybe null should be allowed though
  }

  return obj
}

function handleForeignKeyFieldsForArray(helpers, array) {
  const newArray = []
  
  for (const value of array) {
    let newValue = value
    if (isObject(value)) {
      newValue = handleForeignKeyFieldsOnObject(helpers, object = value)
    }
    newArray.push(newValue)
  }

  return newArray
}

function isIdType(value) {
  return isString(value) || isNumber(value)
}

/**
 * Turn a FK key name into a Gatsby foreign key field name
 * by replacing the FK suffix with the Gatsby FK suffix.
 * 
 * Gatby has a convention for naming foreign key fields. It
 * uses this convention to create references between nodes.
 * See: https://www.gatsbyjs.org/docs/schema-gql-type/#foreign-key-reference-___node
 * 
 * @param {String} key FK reference key name
 * @param {String} foreignKeySuffix 
 */
function getGatsbyReferenceKey(key, foreignKeySuffix) {
  const keyName = key.slice(0,  -foreignKeySuffix.length)
  return keyName + "___NODE"
}