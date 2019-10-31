const { createRemoteFileNode } = require("gatsby-source-filesystem")

const validateAndPrepOptions = require("./util/validate-and-prep-options")
const createAndConfigureAxios = require("./util/create-and-configure-axios")

const nodeTypes = []

const imageKeys = ["image"]

exports.sourceNodes = async (
  { actions, createNodeId, createContentDigest, store, cache },
  options
) => {
  const { createNode, createParentChildLink } = actions
  options = validateAndPrepOptions(options)
  const axios = createAndConfigureAxios(options)
  const helpers = {
    createNode,
    createParentChildLink,
    createNodeId,
    createContentDigest,
    store,
    cache,
  }
  const metadataPromise = loadSiteMetadata(helpers, axios)
  const { data: sitemap } = await axios.get("/sitemap")
  const nodesPromise = loadNodeRecursive(helpers, axios, sitemap.root)
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

async function loadNodeRecursive(helpers, axios, sitemapNode, parent = {}) {
  const {
    createNode,
    createParentChildLink,
    createNodeId,
    createContentDigest,
    store,
    cache,
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

  data = await loadImagesForNode(nodeMeta.id, data, { createNode, createNodeId, store, cache })

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
      async n => await loadNodeRecursive(helpers, axios, n, node)
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

async function loadImagesForNode(parentNodeId, data, helpers) {
  const { createNode, createNodeId, cache, store } = helpers
  const fields = { ...data }

  await asyncForEach(Object.entries(fields), async ([key]) => {
    if (imageKeys.includes(key)) {
      const url = data[key]
      delete fields[key]
      let fileNode = await createRemoteFileNode({
        url,
        parentNodeId,
        createNode,
        createNodeId,
        cache,
        store,
      })
      if (fileNode) {
        fields[key + "___NODE"] = fileNode.id
      }
    }
  })

  return fields
}