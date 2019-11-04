const { registerType } = require('./typeRegistry')
const fetchAndValidateSitemap = require('./fetch-and-validate-sitemap')
const loadImagesForNode = require('./load-images-for-node')

const asyncForEach = require('./util/asyncForEach')

module.exports = async helpers => {
  const sitemap = await fetchAndValidateSitemap(helpers)
  return loadNodeRecursive(helpers, sitemap.root)
}

async function loadNodeRecursive(helpers, sitemapNode, parent) {
  const node = await loadNode(helpers, sitemapNode, parent)
  if (sitemapNode.children.length > 0) {
    await asyncForEach(
      sitemapNode.children,
      async child => loadNodeRecursive(helpers, child, node)
    )
  }
}

async function loadNode(helpers, sitemapNode, parent) {
  const { gatsby } = helpers
  const data = await fetchDataForSitemapNode(helpers, sitemapNode)
  const nodeMeta = createGatsbyNodeMeta(gatsby, data, sitemapNode, parent)
  const fields = await loadImagesForNode(helpers, data, nodeMeta)

  const node = {
    ...fields,
    ...nodeMeta,
  }

  gatsby.actions.createNode(node)
  registerType(node.internal.type)
  if (parent) gatsby.actions.createParentChildLink({ parent, child: node })

  return node
}

async function fetchDataForSitemapNode(helpers, sitemapNode) {
  const { gatsby, axios } = helpers
  try {
    const response = await axios.get(sitemapNode.path)
    return response.data
  } catch (error) {
    gatsby.reporter.panic(`Oops.`, error) // TODO
  }
}

function createGatsbyNodeMeta(gatsby, content, sitemapNode, parent = {}) {
  return {
    id: gatsby.createNodeId(`umbraco-${sitemapNode.id}`),
    parent: parent.id,
    children: [],
    internal: {
      type: sitemapNode.type,
      contentDigest: gatsby.createContentDigest(content),
    }
  }
}