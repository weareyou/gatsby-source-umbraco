const { createRemoteFileNode } = require("gatsby-source-filesystem")
const asyncForEach = require('../util/asyncForEach')
const formatMessage = require('../util/formatMessage')
const { isObject, isArray, isString } = require('../util/typecheck')

module.exports = async (helpers, fields, meta) => {
  helpers.gatsby.reporter.verbose(formatMessage(`Looking for images on node (name: "${fields.name}", slug: "${fields.slug}")`))
  return loadImagesForObject(helpers, fields, meta)
}

/**
 * Load all images for an object.
 * 
 * For all keys that contain a image URL (configured as imageKeys) the
 * image is downloaded and transformed to a File node, which is linked
 * using Gatsby's foreign key reference mechanism.
 * 
 * This function also checks nested objects, and objects in nested
 * arrays, to make sure all images are loaded.
 * 
 * @param {*} helpers 
 * @param {Object} fields 
 * @param {Object} meta gatsby node metadata
 */
async function loadImagesForObject(helpers, fields, meta) {
  const imageKeys = helpers.options.imageKeys
  const object = { ...fields }
  const entries = Object.entries(object)

  await asyncForEach(entries, async ([key, value]) => {
    if (isObject(value)) object[key] = await loadImagesForObject(helpers, value, meta)
    else if (isArray(value)) object[key] = await loadImagesForArray(helpers, value, meta)
    else if (imageKeys.includes(key)) await handleImageKeyInObject(helpers, object, key, meta)
  })

  return object
}

async function handleImageKeyInObject(helpers, fields, key, meta) {
  const value = fields[key]
  let filenode
  
  if (isString(value)) {
    helpers.gatsby.reporter.verbose(formatMessage(`Loading image (key: "${key}", url: "${value}")`))
    filenode = await loadImage(helpers, value, meta.id)
  }

  if (filenode) { // Replace field with link to new file node
    delete fields[key]
    fields[getReferenceKey(key)] = filenode.id
  } else {
    const message = formatMessage(`Unable to load image, using the original value of the field (key: "${key}", value: ${JSON.stringify(value)})`)
    helpers.gatsby.reporter.warn(message)
  }
}

/**
 * Load images for objects in an array.
 * 
 * @param {*} helpers 
 * @param {Array} array 
 * @param {Object} meta 
 * @returns {Array}
 */
async function loadImagesForArray(helpers, array, meta) {
  const newArray = []

  await asyncForEach(array, async value => {
    let newValue = value
    if (isObject(value)) newValue = await loadImagesForObject(helpers, value, meta)
    newArray.push(newValue)
  })

  return newArray
}

/**
 * Load an image creating a File node
 * 
 * @param {*} helpers 
 * @param {string} url 
 * @param {string} parentNodeId ID of the Gatsby node to attatch the created File to
 * @returns {FileSystemNode} 
 */
async function loadImage({ gatsby }, url, parentNodeId) {
  const { actions, createNodeId, cache, store } = gatsby
  const { createNode } = actions
  let filenode;

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
    const message = formatMessage(`Problem creating remote file node.`)
    gatsby.reporter.error(message)
  }

  return filenode
}

/**
 * Turn a key name into a Gatsby foreign key field name
 * 
 * Gatsby has a convention for naming foreign key fields. It
 * uses this convention to create references between nodes.
 * See: https://www.gatsbyjs.org/docs/node-creation/#foreign-key-reference-___node
 * 
 * @param {string} key 
 */
function getReferenceKey(key) {
  return key + "___NODE"
}
