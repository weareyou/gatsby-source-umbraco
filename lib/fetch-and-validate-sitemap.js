const { isArray, isString, isObject, isNumber } = require('../util/typecheck')

module.exports = async (helpers) => {
  // TODO make sitemap route configurable
  let sitemap = await fetchSitemap(helpers)
  sitemap = validateAndPrepSitemapRecursive(helpers, sitemap.root)
  return { root: sitemap }
}

async function fetchSitemap({ gatsby, axios }) {
  try {
    const { data: sitemap } = await axios.get("/sitemap")
    return sitemap
  } catch (error) {
    gatsby.reporter.panic(`Oeps.`, error) // TODO
  }
}

function validateAndPrepSitemapRecursive(helpers, sitemapNode, parent = {}) {
  validateSitemapNode(helpers, sitemapNode)
  const node = prepSitemapNode(sitemapNode, parent)
  const children = sitemapNode.children.map(child => validateAndPrepSitemapRecursive(helpers, child, node))
  return {
    ...node,
    children,
  }
}

/* ============
 *  Validation
 * ============ */

function validateSitemapNode(helpers, sitemapNode) {
  if (!isValidID(sitemapNode.id))
    throwValidationError(helpers, "id", sitemapNode.id, sitemapNode)

  if (!isString(sitemapNode.urlSegment))
    throwValidationError(helpers, "urlSegment", sitemapNode.urlSegment, sitemapNode)

  if (!isString(sitemapNode.type))
    throwValidationError(helpers, "type", sitemapNode.type, sitemapNode)

  if (!isValidChildren(sitemapNode.children))
    throwValidationError(helpers, "children", sitemapNode.children, sitemapNode)
}

function isValidID(id) {
  return (isString(id) && id.length > 0) || isNumber(id)
}

function isValidChildren(children) {
  return isArray(children) && children.every(isObject)
}

function throwValidationError({ gatsby }, propertyName, propertyValue, sitemapNode) {
  const message = [
    `Encountered invalid node in sitemap. Property [${propertyName}] is invalid or missing.`,
    ``,
    `  Current value of [${propertyName}]: ${JSON.stringify(propertyValue)}`,
    `  The sitemap node: ${JSON.stringify(sitemapNode)}`
  ].join("\n")
  gatsby.reporter.panic(message)
}

/* =============
 *  Preparation
 * ============= */

function prepSitemapNode(sitemapNode, parent = {}) {
  const path = getPathForSitemapNode(sitemapNode, parent)
  const type = normalizeType(sitemapNode.type)
  return {
    ...sitemapNode,
    path,
    type,
  }
}

function getPathForSitemapNode(sitemapNode, parent) {
  let path = (parent.path || "") + "/" + sitemapNode.urlSegment
  if (path.indexOf("//") == 0) path = path.substr(1)
  return path
}

function normalizeType(type) {
  return type.charAt(0).toUpperCase() + type.slice(1)
}