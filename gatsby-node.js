const validateAndPrepOptions = require("./util/validate-and-prep-options")
const createAndConfigureAxios = require("./util/create-and-configure-axios")

const nodeTypes = []

exports.sourceNodes = async (
  { actions, createNodeId, createContentDigest },
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

async function loadSiteMetadata(actions, axios) {
  const { createNode, createNodeId, createContentDigest } = actions
  const { data } = await axios.get("/metadata")
  const nodeMeta = {
    id: createNodeId(-1),
    internal: {
      type: "Metadata",
      contentDigest: createContentDigest(data),
    },
  }
  return createNode({
    ...nodeMeta,
    ...data,
  })
}

async function loadNodeRecursive(actions, axios, sitemapNode, parent = {}) {
  const {
    createNode,
    createParentChildLink,
    createNodeId,
    createContentDigest,
  } = actions

  const slug = getSlugForSitemapNode(sitemapNode, parent)
  const type = toUpperFirst(sitemapNode.type)
  const { data } = await axios.get(slug)

  const nodeMeta = {
    id: createNodeId(`umbraco-${sitemapNode.id}`),
    parent: parent.id,
    children: [],
    internal: {
      type,
      contentDigest: createContentDigest(data),
    },
  }

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
      async n => await loadNodeRecursive(actions, axios, n, node)
    )
  }
}

function getSlugForSitemapNode(sitemapNode, parent) {
  let slug = (parent.slug || "") + "/" + sitemapNode.slug
  if (slug.indexOf("//") == 0) slug = slug.substr(1)
  return slug
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
