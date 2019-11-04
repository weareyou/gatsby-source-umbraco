module.exports = async helpers => {
  // TODO make global data route configurable
  const { gatsby } = helpers

  const fields = await fetchGlobalData(helpers)
  const nodeMeta = createGatsbyNodeMeta(gatsby, fields)

  return gatsby.actions.createNode({
    ...nodeMeta,
    ...fields,
  })
}

async function fetchGlobalData({ gatsby, axios }) {
  try {
    const { data } = await axios.get("/globaldata")
    return data
  } catch (error) {
    gatsby.reporter.error(`Oeps.`, error) // TODO
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