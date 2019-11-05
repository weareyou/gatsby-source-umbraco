const formatMessage = require('../util/formatMessage')

module.exports = async helpers => {
  const { gatsby, options } = helpers
  const route = options.globalDataRoute

  const fields = await fetchGlobalData(helpers, route)
  const nodeMeta = createGatsbyNodeMeta(gatsby, fields)

  return gatsby.actions.createNode({
    ...nodeMeta,
    ...fields,
  })
}

async function fetchGlobalData({ gatsby, axios }, route) {
  gatsby.reporter.verbose(formatMessage(`Fetching global site data from: ${route}`))
  try {
    const { data } = await axios.get(route)
    return data
  } catch (error) {
    const message = formatMessage(`Problem fetching global site data from: ${route}.`)
    gatsby.reporter.error(message, error)
  }
}

function createGatsbyNodeMeta(gatsby, content) {
  return {
    id: gatsby.createNodeId(-1),
    internal: {
      type: "Global",
      contentDigest: gatsby.createContentDigest(content)
    }
  }
}