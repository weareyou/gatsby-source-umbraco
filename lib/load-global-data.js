const formatMessage = require('../util/formatMessage')

module.exports = async helpers => {
  const { gatsby } = helpers
  const route = "/globaldata" // TODO make global data route configurable

  const fields = await fetchGlobalData(helpers, route)
  const nodeMeta = createGatsbyNodeMeta(gatsby, fields)

  return gatsby.actions.createNode({
    ...nodeMeta,
    ...fields,
  })
}

async function fetchGlobalData({ gatsby, axios }, route) {
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