const { createRemoteFileNode } = require("gatsby-source-filesystem")

const validateAndPrepOptions = require("./util/validate-and-prep-options")
const createAndConfigureAxios = require("./util/create-and-configure-axios")

const nodeTypes = []

exports.sourceNodes = async (
  { actions, createNodeId, createContentDigest, store, cache, reporter },
  options
) => {
  const { createNode, createParentChildLink } = actions
  options = validateAndPrepOptions(options, reporter)
  const axios = createAndConfigureAxios(options)

  const helpers = {
    createNode,
    createParentChildLink,
    createNodeId,
    createContentDigest,
    store,
    cache,
    reporter,
  }

  const metadataPromise = loadSiteMetadata(helpers, axios)
  const { data: sitemap } = await axios.get("/sitemap")
  const nodesPromise = loadNodeRecursive(helpers, options, axios, sitemap.root)

  return Promise.all([metadataPromise, nodesPromise])
}

exports.createSchemaCustomization = ({ actions, schema }) => {
  const { createTypes } = actions
  const interfaceType = "UmbracoNode"

  const concreteTypes = nodeTypes.map(type => {
    return schema.buildObjectType({
      name: type,
      interfaces: ["Node", interfaceType],
    })
  })

  createTypes([
    `interface ${interfaceType} @nodeInterface {
      id: ID!
      parent: Node
      children: [Node!]!
      internal: Internal!

      name: String
      slug: String
    }`,
    ...concreteTypes,
  ])
}

exports.setFieldsOnGraphQLNodeType = require("gatsby-source-filesystem/extend-file-node")

async function loadSiteMetadata(helpers, axios) {
  const { createNode, createNodeId, createContentDigest } = helpers
  const { data } = await axios.get("/globaldata")
  const nodeMeta = {
    id: createNodeId(-1),
    internal: {
      type: "Global",
      contentDigest: createContentDigest(data),
    },
  }
  return createNode({
    ...nodeMeta,
    ...data,
  })
}

async function loadNodeRecursive(
  helpers,
  options,
  axios,
  sitemapNode,
  parent = {}
) {
  const {
    createNode,
    createParentChildLink,
    createNodeId,
    createContentDigest,
  } = helpers

  const path = getPathForSitemapNode(sitemapNode, parent)
  const type = toUpperFirst(sitemapNode.type)
  let { data } = await axios.get(path)

  const nodeMeta = {
    id: createNodeId(`umbraco-${sitemapNode.id}`),
    parent: parent.id,
    children: [],
    internal: {
      type,
      contentDigest: createContentDigest(data),
    },
  }

  data = await loadImagesForNode(
    nodeMeta.id,
    data,
    helpers,
    options
  )

  const node = {
    ...nodeMeta,
    ...data,
  }
  createNode(node)
  registerType(type)

  if (parent.id) createParentChildLink({ parent, child: node })

  if (sitemapNode.children.length > 0) {
    return asyncForEach(
      sitemapNode.children,
      async n => await loadNodeRecursive(helpers, options, axios, n, node)
    )
  }
}

function getPathForSitemapNode(sitemapNode, parent) {
  let path = (parent.slug || "") + "/" + sitemapNode.urlSegment
  if (path.indexOf("//") == 0) path = path.substr(1)
  return path
}

function toUpperFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

function registerType(type) {
  if (nodeTypes.indexOf(type) === -1) {
    nodeTypes.push(type)
  }
}

async function loadImagesForNode(parentNodeId, data, helpers, options) {
  const fields = { ...data }
  await asyncForEach(Object.entries(fields), async ([key, value]) => {
    if (isObject(value)) fields[key] = await loadImagesForNode(parentNodeId, value, helpers, options)
    else if (isArray(value)) {
      let newArray = [];
      await asyncForEach(value, async obj => {
        const newValue = await loadImagesForNode(parentNodeId, obj, helpers, options)
        newArray.push(newValue)
      })
      fields[key] = newArray;
    }
    else if (options.imageKeys.includes(key)) {
      const url = fields[key]
      let fileNode = await loadImage(url, parentNodeId, helpers)
      if (fileNode) {
        delete fields[key]
        fields[key + "___NODE"] = fileNode.id
      }
    }
  })

  return fields
}

async function loadImage(url, parentNodeId, helpers) {
  const { createNode, createNodeId, cache, store, reporter } = helpers
  let  filenode;
  try {
    filenode = await createRemoteFileNode({
      url,
      parentNodeId,
      createNode,
      createNodeId,
      cache,
      store,
    })
  } catch (e) {
    reporter.error(""
      + `Failed trying to fetch remote file in gatsby-source-umbraco.\n`
      + `  url: '${url}'\n`
      + `Falling back to the original value.`
    )
  }
  return filenode
}

function isArray(val) {
  return Array.isArray(val)
}

function isObject (value) {
  if (value === null) return false;
  if (Array.isArray(value)) return false;
  return (typeof value === 'object');
}
