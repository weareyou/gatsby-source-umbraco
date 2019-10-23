const validateAndPrepOptions = require("./util/validate-and-prep-options")
const createAndConfigureAxios = require("./util/create-and-configure-axios")

exports.sourceNodes = async (
  { actions, createNodeId, createContentDigest },
  options
) => {
  const { createNode, createParentChildLink } = actions
  options = validateAndPrepOptions(options)
  const axios = createAndConfigureAxios(options)
  const { data: sitemap } = await axios.get("/sitemap")
  return loadNodeRecursive(
    { createNode, createParentChildLink, createNodeId, createContentDigest },
    axios,
    sitemap.root
  )
}

async function loadNodeRecursive(actions, axios, sitemapNode, parent = {}) {
  const {
    createNode,
    createParentChildLink,
    createNodeId,
    createContentDigest,
  } = actions

  const path = getPathForSitemapNode(sitemapNode, parent)
  const type = toUpperFirst(sitemapNode.type)
  const { data } = await axios.get(path)

  const umbracoMeta = {
    path,
  }
  const nodeMeta = {
    id: createNodeId(`umbraco-${sitemapNode.id}`),
    parent: parent.id,
    children: [],
    internal: {
      type,
      mediaType: "application/json",
      content: JSON.stringify(data),
      contentDigest: createContentDigest(data),
    },
  }

  const node = {
    ...nodeMeta,
    ...umbracoMeta,
    data,
  }
  createNode(node)

  if (parent.id) createParentChildLink({ parent, child: node })

  if (sitemapNode.children.length > 0) {
    return asyncForEach(
      sitemapNode.children,
      async n => await loadNodeRecursive(actions, axios, n, node)
    )
  }
}

function getPathForSitemapNode(sitemapNode, parent) {
  let path = (parent.path || "") + "/" + sitemapNode.slug
  if (path.indexOf("//") == 0) path = path.substr(1)
  return path
}

function toUpperFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
