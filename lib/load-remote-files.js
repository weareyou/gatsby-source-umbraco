const { createRemoteFileNode } = require("gatsby-source-filesystem")
const asyncForEach = require("../util/asyncForEach")
const formatMessage = require("../util/formatMessage")
const { isObject, isArray, isString } = require("../util/typecheck")
const getGatsbyReferenceKey = require("../util/getGatsbyReferenceKey")

module.exports = async (helpers, fields, meta) => {
  helpers.gatsby.reporter.verbose(
    formatMessage(`Looking for remote file fields on node`)
  )
  return loadRemoteFilesForObject(helpers, fields, meta)
}

/**
 * Load all remote files for an object.
 *
 * For all keys that end in the remote file suffix (configured as remoteFileSuffix) the
 * file is downloaded from the URL and transformed into a File node, which is then linked
 * to the original node using Gatsby's foreign key reference mechanism.
 *
 * Arrays of remote files are also supported, every item of an array in a remote file field
 * is turned into a File node.
 *
 * This function also checks nested objects, and objects in nested arrays, to make sure
 * all remote files are loaded.
 *
 * @param {*} helpers
 * @param {Object} object
 * @param {Object} meta gatsby node meta
 * @returns {Promise<Object>}
 */
async function loadRemoteFilesForObject(helpers, object, meta) {
  const remoteFileSuffix = helpers.options.remoteFileSuffix
  const obj = { ...object }
  const entries = Object.entries(obj)

  await asyncForEach(entries, async ([key, value]) => {
    if (key.endsWith(remoteFileSuffix)) {
      await handleRemoteFileKeyInObject(helpers, obj, key, meta)
    } else if (isObject(value)) {
      obj[key] = await loadRemoteFilesForObject(helpers, value, meta)
    } else if (isArray(value)) {
      obj[key] = await loadRemoteFilesForArray(helpers, value, meta)
    }
  })

  return obj
}

/**
 * Load remote files for objects in an array.
 *
 * @param {*} helpers
 * @param {Array} array
 * @param {Object} meta gatsby node meta
 * @returns {Promise<Array>}
 */
async function loadRemoteFilesForArray(helpers, array, meta) {
  const newArray = []

  await asyncForEach(array, async value => {
    let newValue = value
    if (isObject(value))
      newValue = await loadRemoteFilesForObject(helpers, value, meta)
    else if (isArray(value))
      newValue = await loadRemoteFilesForArray(helpers, value, meta)
    newArray.push(newValue)
  })

  return newArray
}

/**
 * Load remote file(s) and replace the remote file field with a Gatsby FK field linking
 * to the created File node(s).
 *
 * @param {*} helpers
 * @param {Object} object
 * @param {String} key key of the remote file field
 * @param {Object} meta gatsby node meta
 */
async function handleRemoteFileKeyInObject(helpers, object, key, meta) {
  const { gatsby, options } = helpers
  const value = object[key]
  let replacement

  if (isString(value)) {
    gatsby.reporter.verbose(
      formatMessage(`Handeling remote file field (key: "${key}")`)
    )
    const filenode = await loadRemoteFile(helpers, value, meta.id)
    replacement = filenode.id
  } else if (isArray(value) && value.every(isString)) {
    gatsby.reporter.verbose(
      formatMessage(`Handeling remote file array (key: "${key}")`)
    )
    const filenodes = await Promise.all(
      value.map(async url => await loadRemoteFile(helpers, url, meta.id))
    )
    replacement = filenodes.map(filenode => filenode.id)
  } else {
    panicOnInvalidRemoteFileType(helpers, key, value)
  }

  delete object[key]
  const referenceKey = getGatsbyReferenceKey(key, options.remoteFileSuffix)
  object[referenceKey] = replacement
}

/**
 * Stop the build with an error message regarding invalid type in remote file
 * field/array.
 *
 * @param {*} helpers
 * @param {String} key
 * @param {*} value
 */
function panicOnInvalidRemoteFileType({ gatsby }, key, value) {
  let wrongTypeValue = value
  if (isArray(value)) wrongTypeValue = value.filter(x => !isString(x)).shift()
  const type = Object.prototype.toString.call(wrongTypeValue)

  const message = formatMessage(
    `Encountered invalid type in remote file ${
      isArray(value) ? `array` : `field`
    }:`,
    ``,
    `key: ${key}`,
    `invalid value: ${JSON.stringify(wrongTypeValue)}`,
    `invalid type: ${type}`
  )

  gatsby.reporter.panic(message)
}

/**
 * Load a remote file, creating a File node.
 *
 * @param {*} helpers
 * @param {string} url
 * @param {string} parentNodeId ID of the Gatsby node to attatch the created File to
 * @returns {FileSystemNode}
 */
async function loadRemoteFile({ gatsby }, url, parentNodeId) {
  const { actions, createNodeId, cache, store } = gatsby
  const { createNode } = actions
  let filenode

  gatsby.reporter.verbose(formatMessage(`Loading remote file (url: "${url}")`))

  try {
    filenode = await createRemoteFileNode({
      url,
      parentNodeId,
      createNode,
      createNodeId,
      cache,
      store,
    })
  } catch (error) {
    const message = formatMessage(
      `Problem creating remote file node (url: "${url}")`
    )
    gatsby.reporter.panic(message)
  }

  return filenode
}
